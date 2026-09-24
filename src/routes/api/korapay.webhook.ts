import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeTxnId } from "@/lib/mm-parse";

const KORA_BASE_URL = "https://api.korapay.com/merchant/api/v1";
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
  if (!data?.enabled) throw new Error("Korapay deposits are currently disabled by the administrator.");
  const mode = data.mode === "live" ? "live" : "test";
  const key =
    (mode === "live" ? data.live_secret_key : data.test_secret_key)?.trim() ||
    data.secret_key?.trim() ||
    (mode === "live" ? process.env.KORAPAY_LIVE_SECRET_KEY : process.env.KORAPAY_TEST_SECRET_KEY)?.trim() ||
    process.env.KORAPAY_SECRET_KEY?.trim();
  if (!key) throw new Error("Korapay is not configured. Add the secret key in Admin → Site settings.");
  return { key, mode, webhookUrl: data.webhook_url?.trim() || process.env.KORAPAY_WEBHOOK_URL?.trim() || "" };
}



function normalizeCameroonPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("237")) {
    if (digits.length !== 12) throw new Error("Enter a valid Cameroon mobile number.");
    return digits;
  }
  if (digits.length === 9 && digits.startsWith("6")) return `237${digits}`;
  throw new Error("Enter a valid Cameroon mobile number, for example 6XXXXXXXX.");
}

function readKoraMessage(body: unknown) {
  if (!body || typeof body !== "object") return "Korapay request failed";
  const value = body as { message?: unknown; data?: { message?: unknown } };
  return typeof value.message === "string"
    ? value.message
    : typeof value.data?.message === "string"
      ? value.data.message
      : "Korapay request failed";
}

async function koraRequest(path: string, init: RequestInit) {
  const config = await korapayConfig();
  const res = await fetch(`${KORA_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { res, body };
}

async function getDepositForUser(depositId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("deposits")
    .select("id,user_id,amount,reference,status,payment_method_id,payer_phone,ocr_txn_id")
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
      raw_text: `Korapay charge.success ${gatewayReference} ${amount} XAF`,
      sender: "korapay",
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
) {
  const { res, body } = await koraRequest(`/charges/${encodeURIComponent(gatewayReference)}`, { method: "GET" });
  const data = (body as { data?: KoraData } | null)?.data;
  if (!res.ok || !data) {
    return { status: "pending", message: readKoraMessage(body) };
  }

  const amount = Number(data.amount_paid ?? data.amount ?? data.amount_expected);
  const currency = String(data.currency ?? "");
  const status = String(data.status ?? "").toLowerCase();

  if (status === "success") {
    if (currency !== "XAF" || Math.trunc(amount) !== Math.trunc(expectedAmount)) {
      throw new Error("Korapay verification returned an amount or currency mismatch.");
    }
    return settleSuccessfulKorapayDeposit(
      depositId,
      merchantReference,
      expectedAmount,
      gatewayReference,
      `Korapay verified: ${gatewayReference}`,
    );
  }

  if (status === "failed") {
    await supabaseAdmin
      .from("deposits")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        ocr_txn_id: gatewayReference,
        auto_note: `Korapay payment failed: ${data.message ?? "Payment failed"}`,
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
      auto_note: `Korapay status: ${status || "processing"}`,
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
      throw new Error("Korapay Mobile Money supports up to 500,000 XAF per transaction.");
    }

    const phone = normalizeCameroonPhone(data.phone);
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
    if (!email) throw new Error("Your account email is required for Korapay payments.");

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
        auto_note: `Korapay ${data.network === "mtn" ? "MTN" : "Orange"} payment created`,
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
      network: data.network === "mtn" ? "Mtn" : "Orange",
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

      const gatewayReference = kora.transaction_reference ?? kora.payment_reference ?? "";
      if (gatewayReference) {
        await supabaseAdmin
          .from("deposits")
          .update({
            ocr_txn_id: gatewayReference,
            auto_note: `Korapay ${data.network === "mtn" ? "MTN" : "Orange"}: ${kora.message ?? kora.status ?? "processing"}`,
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
      };
    } catch (error) {
      const lookup = await koraRequest(`/charges/${encodeURIComponent(merchantReference)}`, { method: "GET" }).catch(() => null);
      const lookupData = (lookup?.body as { data?: KoraData } | null)?.data;
      const gatewayReference = lookupData?.reference ?? "";
      if (lookupData && gatewayReference) {
        await supabaseAdmin
          .from("deposits")
          .update({ ocr_txn_id: gatewayReference, auto_note: "Korapay request recovered by transaction lookup" })
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
        };
      }

      await supabaseAdmin
        .from("deposits")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          auto_note: `Korapay could not start the payment: ${(error as Error).message}`,
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
    if (!data.transactionReference || data.transactionReference.length > 120) throw new Error("Invalid Korapay reference.");
    if (!/^\d{4,8}$/.test(data.otp)) throw new Error("Enter the OTP sent to your mobile number.");
    return data;
  })
  .handler(async ({ data, context }) => {
    const deposit = await getDepositForUser(data.depositId, context.userId);
    if (deposit.status !== "pending") return { status: deposit.status, message: "This deposit has already been reviewed." };

    const { res, body } = await koraRequest("/charges/mobile-money/authorize", {
      method: "POST",
      body: JSON.stringify({ reference: data.transactionReference, token: data.otp }),
    });
    const kora = (body as { data?: KoraData } | null)?.data;
    if (!res.ok || !kora) throw new Error(readKoraMessage(body));

    await supabaseAdmin
      .from("deposits")
      .update({
        ocr_txn_id: kora.transaction_reference ?? data.transactionReference,
        auto_note: `Korapay authorization: ${kora.message ?? kora.status ?? "processing"}`,
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

    return {
      status: kora.status ?? "processing",
      authModel: kora.auth_model ?? "STK_PROMPT",
      transactionReference: kora.transaction_reference ?? data.transactionReference,
      message: kora.message ?? "Authorize the payment on your phone.",
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
    if (!gatewayReference) return { status: "pending", approved: false, reason: "Waiting for Korapay transaction reference" };

    return verifyKorapayReference(
      deposit.id,
      deposit.reference!,
      gatewayReference,
      Number(deposit.amount),
    );
  });
