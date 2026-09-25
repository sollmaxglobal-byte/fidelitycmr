import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeTxnId } from "@/lib/mm-parse";

const KORA_LIVE_BASE_URL = "https://api.korapay.com/merchant/api/v1";
const KORA_TEST_BASE_URL = "https://api.korapay.com/sandbox/merchant/api/v1";
const KORA_MAX_XAF = 500_000;

type KoraData = {
  amount?: number | string;
  amount_expected?: number | string;
  amount_paid?: number | string;
  currency?: string;
  status?: string;
  auth_model?: string;
  transaction_reference?: string;
  payment_reference?: string;
  reference?: string;
  message?: string;
  authorization?: { redirect_url?: string };
  mobile_money?: { number?: string };
};

async function korapayConfig() {
  const { data, error } = await supabaseAdmin
    .from("korapay_config")
    .select("enabled,mode,test_secret_key,live_secret_key,secret_key,webhook_url")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.enabled) throw new Error("Mobile Money deposits are currently disabled by the administrator.");
  const mode = data.mode === "live" ? "live" : "test";
  const key =
    (mode === "live" ? data.live_secret_key : data.test_secret_key)?.trim() ||
    data.secret_key?.trim() ||
    (mode === "live" ? process.env.KORAPAY_LIVE_SECRET_KEY : process.env.KORAPAY_TEST_SECRET_KEY)?.trim() ||
    process.env.KORAPAY_SECRET_KEY?.trim();
  if (!key) throw new Error("Mobile Money is not configured. Please contact support.");
  const baseUrl = mode === "test" ? KORA_TEST_BASE_URL : KORA_LIVE_BASE_URL;
  return { key, mode, baseUrl, webhookUrl: data.webhook_url?.trim() || process.env.KORAPAY_WEBHOOK_URL?.trim() || "" };
}



function normalizeCameroonPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("00237") ? digits.slice(2) : digits;
  if (normalized.startsWith("237")) {
    if (/^2376\d{8}$/.test(normalized)) return normalized;
    throw new Error("Enter a valid Cameroon mobile number, for example 6XXXXXXXX.");
  }
  if (/^0?6\d{8}$/.test(normalized)) {
    const local = normalized.startsWith("0") ? normalized.slice(1) : normalized;
    return `237${local}`;
  }
  throw new Error("Enter a valid Cameroon mobile number, for example 6XXXXXXXX.");
}

function readKoraMessage(body: unknown) {
  if (!body || typeof body !== "object") return "Mobile Money request failed";
  const value = body as {
    message?: unknown;
    data?: { message?: unknown; [key: string]: unknown } | null;
  };
  if (typeof value.message === "string" && value.message.trim()) {
    const details = value.data && typeof value.data === "object" ? Object.entries(value.data).filter(([, item]) => item !== null && item !== undefined && item !== "").map(([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`).join("; ") : "";
    return details ? `${value.message} — ${details}` : value.message;
  }
  if (typeof value.data?.message === "string" && value.data.message.trim()) return value.data.message;
  const details = value.data && typeof value.data === "object"
    ? Object.entries(value.data)
        .filter(([, item]) => item !== null && item !== undefined && item !== "")
        .map(([key, item]) => `${key}: ${typeof item === "string" ? item : JSON.stringify(item)}`)
        .join("; ")
    : "";
  return details ? `Mobile Money rejected the request: ${details}` : "Mobile Money request failed";
}

async function koraRequest(path: string, init: RequestInit) {
  const config = await korapayConfig();
  console.info("[korapay] request", { path, method: init.method ?? "GET" });
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  const safeBody = body && typeof body === "object" ? (() => { const value = body as Record<string, unknown>; const data = value.data && typeof value.data === "object" ? value.data as Record<string, unknown> : null; return { status: value.status, code: value.code, message: value.message, data: data ? { message: data.message, status: data.status, auth_model: data.auth_model, transaction_reference: data.transaction_reference, payment_reference: data.payment_reference, reference: data.reference, currency: data.currency, amount: data.amount, amount_expected: data.amount_expected, amount_paid: data.amount_paid, mobile_money: data.mobile_money, errors: data.errors } : null }; })() : body;
  console.info("[korapay] response", { path, httpStatus: res.status, body: safeBody });
  return { res, body };
}

async function rejectKorapayDeposit(depositId: string, reason: string) {
  await supabaseAdmin
    .from("deposits")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      auto_note: reason,
    })
    .eq("id", depositId)
    .eq("status", "pending");
}

async function getDepositForUser(depositId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("deposits")
    .select("id,user_id,amount,reference,status,payment_method_id,payer_phone,ocr_txn_id,auto_note")
    .eq("id", depositId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Deposit not found");
  return data;
}

async function settleSuccessfulKorapayDeposit(
  depositId: string,
  merchantReference: string,
  amount: number,
  gatewayReference: string,
  note: string,
) {
  const db = supabaseAdmin;
  const normalized = normalizeTxnId(gatewayReference);

  const { data: deposit, error: depositError } = await db
    .from("deposits")
    .update({
      ocr_txn_id: gatewayReference,
      ocr_txn_id_norm: normalized,
      ocr_amount: amount,
      auto_note: note,
    })
    .eq("id", depositId)
    .eq("status", "pending")
    .eq("reference", merchantReference)
    .select("id,user_id,amount,status")
    .maybeSingle();

  if (depositError) throw depositError;
  if (!deposit) {
    const { data: existing } = await db
      .from("deposits")
      .select("status")
      .eq("id", depositId)
      .maybeSingle();
    return { status: existing?.status ?? "unknown", approved: existing?.status === "approved" };
  }

  const { data: message, error: messageError } = await db
    .from("mm_messages")
    .insert({
      raw_text: `Mobile Money charge.success ${gatewayReference} ${amount} XAF`,
      sender: "mobile_money",
      txn_id: gatewayReference,
      txn_id_norm: normalized,
      amount,
      payer_number: null,
      received_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (messageError || !message) throw messageError ?? new Error("Could not record Korapay confirmation");

  const { data: outcome, error: approveError } = await db.rpc("auto_approve_deposit", {
    _deposit_id: deposit.id,
    _message_id: message.id,
  });

  if (approveError) throw approveError;
  const result = (outcome ?? {}) as { approved?: boolean; reason?: string };
  return {
    status: result.approved ? "approved" : "pending",
    approved: !!result.approved,
    reason: result.reason ?? "Payment is still being verified",
  };
}

async function verifyKorapayReference(
  depositId: string,
  merchantReference: string,
  gatewayReference: string,
  expectedAmount: number,
  fallbackReference?: string,
) {
  let { res, body } = await koraRequest(`/charges/${encodeURIComponent(gatewayReference)}`, { method: "GET" });
  let data = (body as { data?: KoraData } | null)?.data;
  if ((!res.ok || !data) && fallbackReference && fallbackReference !== gatewayReference) {
    const fallback = await koraRequest(`/charges/${encodeURIComponent(fallbackReference)}`, { method: "GET" });
    res = fallback.res;
    body = fallback.body;
    data = (body as { data?: KoraData } | null)?.data;
  }
  if (!res.ok || !data) {
    return { status: "pending", message: readKoraMessage(body) };
  }

  const amount = Number(data.amount_paid ?? data.amount ?? data.amount_expected);
  const currency = String(data.currency ?? "");
  const status = String(data.status ?? "").toLowerCase();

  if (status === "success") {
    if (currency !== "XAF" || Math.trunc(amount) !== Math.trunc(expectedAmount)) {
      throw new Error("Mobile Money verification returned an amount or currency mismatch.");
    }
    return settleSuccessfulKorapayDeposit(
      depositId,
      merchantReference,
      expectedAmount,
      gatewayReference,
      `Mobile Money verified: ${gatewayReference}`,
    );
  }

  if (status === "failed") {
    await supabaseAdmin
      .from("deposits")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        ocr_txn_id: gatewayReference,
        auto_note: `Mobile Money payment failed: ${data.message ?? "Payment failed"}`,
      })
      .eq("id", depositId)
      .eq("status", "pending")
      .eq("reference", merchantReference);
    return { status: "rejected", approved: false, reason: data.message ?? "Payment failed" };
  }

  await supabaseAdmin
    .from("deposits")
    .update({
      ocr_txn_id: gatewayReference,
      auto_note: `Mobile Money status: ${status || "processing"}`,
    })
    .eq("id", depositId)
    .eq("status", "pending")
    .eq("reference", merchantReference);

  return { status: "pending", approved: false, reason: data.message ?? "Waiting for mobile-money authorization" };
}

export const initiateKorapayMobileMoney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { amount: number; methodId: string; phone: string; network: "mtn" | "orange" }) => {
    if (!Number.isInteger(data.amount) || data.amount < 1) throw new Error("Enter a valid deposit amount.");
    if (!/^[0-9a-f-]{36}$/i.test(data.methodId)) throw new Error("Invalid payment method.");
    if (data.network !== "mtn" && data.network !== "orange") throw new Error("Invalid mobile-money network.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const amount = Math.trunc(data.amount);
    const config = await korapayConfig();
    if (amount > KORA_MAX_XAF) {
      throw new Error("Mobile Money supports up to 500,000 XAF per transaction.");
    }

    const phone = normalizeCameroonPhone(data.phone);
    if (!config.webhookUrl) {
      // The webhook URL is optional for initiation; the server can still verify by reference.
    }

    const { data: method, error: methodError } = await supabaseAdmin
      .from("payment_methods")
      .select("id,type,label,active,scope")
      .eq("id", data.methodId)
      .maybeSingle();
    if (methodError) throw methodError;
    if (
      !method ||
      method.type !== "mobile_money" ||
      method.active !== true ||
      !["deposit", "both"].includes(method.scope ?? "")
    ) {
      throw new Error("That mobile-money method is not currently available.");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileError) throw profileError;

    const email = typeof context.claims?.email === "string" ? context.claims.email : "";
    if (!email) throw new Error("Your account email is required for Mobile Money payments.");

    const merchantReference = `FID-KORA-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("deposits")
      .insert({
        user_id: context.userId,
        amount,
        payment_method_id: method.id,
        reference: merchantReference,
        status: "pending",
        payer_phone: phone,
        auto_note: `Mobile Money ${data.network === "mtn" ? "MTN" : "Orange"} payment created`,
      })
      .select("id")
      .maybeSingle();
    if (depositError || !deposit) throw depositError ?? new Error("Could not create deposit.");

    const payload = {
      reference: merchantReference,
      amount,
      currency: "XAF",
      notification_url: config.webhookUrl || undefined,
      customer: {
        name: profile?.full_name || "Fidelity customer",
        email,
      },
      merchant_bears_cost: true,
      description: `Fidelity wallet deposit - ${data.network === "mtn" ? "MTN" : "Orange"} Mobile Money`,
      // Let the payment API detect the Cameroon network from the customer's number.
      // The network field is intentionally omitted because some Cameroon accounts reject it.
      mobile_money: { number: phone },
    };

    let body: unknown;
    try {
      const response = await koraRequest("/charges/mobile-money", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      body = response.body;
      const kora = (body as { data?: KoraData } | null)?.data;
      if (!response.res.ok || !kora) {
        const message = readKoraMessage(body);
        throw new Error(message);
      }

      const gatewayReference = kora.transaction_reference ?? kora.payment_reference ?? kora.reference ?? "";
      if (gatewayReference) {
        await supabaseAdmin
          .from("deposits")
          .update({
            ocr_txn_id: gatewayReference,
            auto_note: `Mobile Money ${data.network === "mtn" ? "MTN" : "Orange"}: ${kora.message ?? kora.status ?? "processing"}${kora.payment_reference ? ` | payment_ref:${kora.payment_reference}` : ""}`,
          })
          .eq("id", deposit.id)
          .eq("status", "pending");
      }

      if (String(kora.status).toLowerCase() === "success" && gatewayReference) {
        return {
          depositId: deposit.id,
          merchantReference,
          transactionReference: gatewayReference,
          authModel: "SUCCESS",
          status: "success",
          message: "Payment completed. Verifying your deposit.",
          mode: config.mode,
        };
      }

      return {
        depositId: deposit.id,
        merchantReference,
        transactionReference: gatewayReference,
        authModel: kora.auth_model ?? "STK_PROMPT",
        status: kora.status ?? "processing",
        message: kora.message ?? "Authorize the payment on your phone.",
        redirectUrl: kora.authorization?.redirect_url ?? null,
        mode: config.mode,
      };
    } catch (error) {
      const lookup = await koraRequest(`/charges/${encodeURIComponent(merchantReference)}`, { method: "GET" }).catch(() => null);
      const lookupData = (lookup?.body as { data?: KoraData } | null)?.data;
      const gatewayReference = lookupData?.transaction_reference ?? lookupData?.payment_reference ?? lookupData?.reference ?? "";
      if (lookupData && gatewayReference) {
        await supabaseAdmin
          .from("deposits")
          .update({ ocr_txn_id: gatewayReference, auto_note: "Mobile Money request recovered by transaction lookup" })
          .eq("id", deposit.id)
          .eq("status", "pending");

        if (String(lookupData.status).toLowerCase() === "success") {
          return {
            depositId: deposit.id,
            merchantReference,
            transactionReference: gatewayReference,
            authModel: "SUCCESS",
            status: "success",
            message: "Payment completed. Verifying your deposit.",
            mode: config.mode,
          };
        }
        return {
          depositId: deposit.id,
          merchantReference,
          transactionReference: gatewayReference,
          authModel: lookupData.auth_model ?? "STK_PROMPT",
          status: lookupData.status ?? "processing",
          message: lookupData.message ?? "Authorize the payment on your phone.",
          redirectUrl: lookupData.authorization?.redirect_url ?? null,
          mode: config.mode,
        };
      }

      await supabaseAdmin
        .from("deposits")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          auto_note: `Mobile Money could not start the payment: ${(error as Error).message}`,
        })
        .eq("id", deposit.id)
        .eq("status", "pending");
      throw error;
    }
  });

export const authorizeKorapayMobileMoney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { depositId: string; transactionReference: string; otp: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.depositId)) throw new Error("Invalid deposit.");
    if (!data.transactionReference || data.transactionReference.length > 120) throw new Error("Invalid Mobile Money transaction reference.");
    if (!/^\d{4,8}$/.test(data.otp)) throw new Error("Enter the OTP sent to your mobile number.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const deposit = await getDepositForUser(data.depositId, context.userId);
    if (deposit.status !== "pending") return { status: deposit.status, message: "This deposit has already been reviewed." };

    const config = await korapayConfig();
    const authPath = config.mode === "test" ? "/charges/mobile-money/sandbox/authorize-stk" : "/charges/mobile-money/authorize";
    const authBody = config.mode === "test" ? { reference: data.transactionReference, pin: data.otp } : { reference: data.transactionReference, token: data.otp };
    const { res, body } = await koraRequest(authPath, {
      method: "POST",
      body: JSON.stringify(authBody),
    });
    const kora = (body as { data?: KoraData } | null)?.data;
    if (!res.ok || !kora) {
      const message = readKoraMessage(body);
      await rejectKorapayDeposit(deposit.id, `Mobile Money payment cancelled: ${message}`);
      throw new Error(message);
    }

    await supabaseAdmin
      .from("deposits")
      .update({
        ocr_txn_id: kora.transaction_reference ?? data.transactionReference,
        auto_note: `Mobile Money authorization: ${kora.message ?? kora.status ?? "processing"}`,
      })
      .eq("id", deposit.id)
      .eq("status", "pending");

    if (String(kora.status).toLowerCase() === "success") {
      const gatewayReference = kora.transaction_reference ?? data.transactionReference;
      return {
        status: "success",
        authModel: "SUCCESS",
        transactionReference: gatewayReference,
        message: "Payment authorized. Verifying your deposit.",
      };
    }

    const status = String(kora.status ?? "processing").toLowerCase();
    const message = kora.message ?? "Authorize the payment on your phone.";
    if (status === "failed") {
      await rejectKorapayDeposit(deposit.id, `Mobile Money payment cancelled: ${message}`);
    }

    return {
      status: status === "failed" ? "rejected" : status,
      authModel: kora.auth_model ?? "STK_PROMPT",
      transactionReference: kora.transaction_reference ?? data.transactionReference,
      message,
      redirectUrl: kora.authorization?.redirect_url ?? null,
    };
  });

export const verifyKorapayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { depositId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.depositId)) throw new Error("Invalid deposit.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const deposit = await getDepositForUser(data.depositId, context.userId);
    if (deposit.status !== "pending") return { status: deposit.status, approved: deposit.status === "approved" };

    const gatewayReference = deposit.ocr_txn_id;
    if (!gatewayReference) return { status: "pending", approved: false, reason: "Waiting for the Mobile Money transaction reference" };

    const paymentReference = deposit.auto_note?.match(/payment_ref:([^|\\s]+)/)?.[1];
    return verifyKorapayReference(
      deposit.id,
      deposit.reference!,
      gatewayReference,
      Number(deposit.amount),
      paymentReference,
    );
  });
