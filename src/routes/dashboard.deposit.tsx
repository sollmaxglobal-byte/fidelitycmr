import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Copy, FileImage, ShieldCheck, Smartphone, Upload, Wallet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { initiateKorapayMobileMoney, authorizeKorapayMobileMoney, verifyKorapayPayment } from "@/lib/korapay.functions";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/deposit")({ component: DepositPage });

type Method = {
  id: string;
  name: string;
  number: string;
  enabled: boolean;
  color: string;
  instructions?: string;
  accountName?: string;
  type: string;
  logoUrl?: string;
};
type Settings = { deposit_min_amount?: number; deposit_max_amount?: number };

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];
const fallbackSettings = { deposit_min_amount: 1000, deposit_max_amount: 10000000 };

function money(value: string | number) {
  return Number(value || 0).toLocaleString("fr-FR");
}
function DepositPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<Settings>(fallbackSettings);
  const [activeMethods, setActiveMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [depositStatus, setDepositStatus] = useState("pending");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [korapayAuthModel, setKorapayAuthModel] = useState<string | null>(null);
  const [korapayMessage, setKorapayMessage] = useState("");

  const selectedMethod = activeMethods.find((m) => m.id === method);
  const isKorapayMethod = !!selectedMethod && selectedMethod.type === "mobile_money";
  const korapayNetwork = selectedMethod?.name.toLowerCase().includes("orange") ? "orange" : selectedMethod?.name.toLowerCase().includes("mtn") ? "mtn" : null;
  const amountNumber = Number(amount);
  const minAmount = Number(settings.deposit_min_amount ?? fallbackSettings.deposit_min_amount);
  const maxAmount = Number(settings.deposit_max_amount ?? fallbackSettings.deposit_max_amount);
  const amountError =
    amount && (amountNumber < minAmount || amountNumber > maxAmount)
      ? `Enter an amount between ${money(minAmount)} and ${money(maxAmount)} FCFA.`
      : "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: settingsData, error: settingsError }, { data: methodsData, error: methodsError }] =
        await Promise.all([
          supabase.from("app_settings").select("deposit_min_amount, deposit_max_amount").eq("id", 1).maybeSingle(),
          supabase
            .from("payment_methods")
            .select("id, type, label, account_name, account_number, instructions, active, scope, logo_url")
            .eq("active", true)
            .in("scope", ["deposit", "both"])
            .order("created_at"),
        ]);

      if (settingsError) toast.error("Could not load deposit settings.");
      if (methodsError) toast.error("Could not load payment methods.");
      if (mounted && settingsData) setSettings(settingsData as Settings);
      if (mounted && methodsData) {
        setActiveMethods(
          methodsData
            .map((item) => ({
              id: item.id,
              name: item.label,
              number: item.account_number ?? "",
              enabled: item.active,
              color: item.type === "mobile_money" ? "#ffd45a" : "#0f766e",
              instructions: item.instructions ?? undefined,
              accountName: item.account_name ?? undefined,
              type: item.type,
              logoUrl: item.logo_url ?? undefined,
            }))
            .filter((item) => item.number),
        );
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (step === 2 && activeMethods.length === 1 && !method) setMethod(activeMethods[0].id);
  }, [step, activeMethods, method]);

  useEffect(() => {
    if (step !== 4 || !reference || !submitted) return;
    const poll = window.setInterval(async () => {
      const { data } = await supabase.from("deposits").select("status").eq("reference", reference).maybeSingle();
      if (data?.status) setDepositStatus(data.status);
    }, 10000);
    return () => window.clearInterval(poll);
  }, [step, reference, submitted]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  async function startKorapay() {
    if (!user || !selectedMethod || !korapayNetwork) return;
    if (!phone.trim()) { toast.error("Enter your Cameroon mobile number."); return; }
    setSubmitting(true);
    try {
      const result = await initiateKorapayMobileMoney({ data: { amount: amountNumber, methodId: selectedMethod.id, phone, network: korapayNetwork } });
      setReference(result.merchantReference);
      setTransactionReference(result.transactionReference || "");
      setKorapayAuthModel(result.authModel || null);
      setKorapayMessage(result.message || "Authorize the payment on your phone.");
      setDepositStatus(result.status || "processing");
      if (result.redirectUrl) window.location.assign(result.redirectUrl);
      else setStep(4);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not start payment."); }
    finally { setSubmitting(false); }
  }

  async function submitOtp() {
    if (!transactionReference || !reference) return;
    setSubmitting(true);
    try {
      const result = await authorizeKorapayMobileMoney({ data: { depositId: reference, transactionReference, otp } });
      setKorapayMessage(result.message || "Payment authorization received.");
      setDepositStatus(result.status || "processing");
      if (result.status === "success") {
        const verified = await verifyKorapayPayment({ data: { depositId: reference } });
        setDepositStatus(verified.status);
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not authorize payment."); }
    finally { setSubmitting(false); }
  }

  function next() {
    if (step === 1) {
      if (!amount || amountNumber < minAmount || amountNumber > maxAmount) {
        toast.error(amountError || "Enter a valid amount.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!method) {
        toast.error("Choose an active payment method.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedMethod) {
        toast.error("Choose an active payment method.");
        return;
      }
      setStep(4);
    }
  }

  async function submitProof() {
    if (!user || !uploadedFile || !selectedMethod) {
      toast.error("Upload your payment proof to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const depositReference = reference || crypto.randomUUID();
      const path = `${user.id}/${depositReference}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, uploadedFile, { upsert: true, contentType: uploadedFile.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: amountNumber,
        payment_method_id: method,
        reference: depositReference,
        proof_url: path,
        status: "pending",
      });
      if (error) throw error;

      setReference(depositReference);
      setSubmitted(true);
      setDepositStatus("pending");
      toast.success("Payment submitted successfully");
    } catch (error) {
      console.error("[deposit] submission failed", error);
      toast.error(error instanceof Error ? error.message : "Could not submit your deposit.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = (step / 4) * 100;

  if (loading) {
    return (
      <main className="flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-[#101014] text-[#f8f7f2]">
        <p className="text-sm text-muted-foreground">Loading deposit options…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-4xl flex-col overflow-hidden bg-[#101014] px-3 py-3 text-[#f8f7f2] sm:px-6">
      <div className="shrink-0 px-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#2b2b33]">
            <div className="h-full rounded-full bg-[#ffd45a] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] font-bold text-[#ffd45a]">Step {step}/4</span>
        </div>
      </div>

      <section className="min-h-0 flex-1 overflow-hidden">
        {step === 1 && (
          <Screen
            eyebrow="Screen 1 · Step 1"
            title="How much do you want to deposit?"
            description="Choose the amount you want credited to your wallet."
          >
            <div className="mx-auto flex w-full max-w-md flex-col">
              <div className="relative rounded-xl border border-[#c9a94b] bg-[#111116] p-4">
                <Input
                  id="deposit-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  inputMode="numeric"
                  autoFocus
                  className="h-14 border-0 bg-transparent pr-16 text-2xl font-bold text-[#ffd45a] shadow-none focus-visible:ring-0"
                  aria-invalid={!!amountError}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">FCFA</span>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>Min {money(minAmount)}</span>
                <span>Max {money(maxAmount)}</span>
              </div>
              {amountError && <p className="mt-2 text-xs text-destructive">{amountError}</p>}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {QUICK_AMOUNTS.slice(0, 4).map((value) => (
                  <Button key={value} type="button" variant={amountNumber === value ? "default" : "outline"} className="h-12 text-sm" onClick={() => setAmount(String(value))}>
                    {money(value)}
                  </Button>
                ))}
              </div>
            </div>
            <FooterActions onNext={next} nextLabel="Continue" />
          </Screen>
        )}

        {step === 2 && (
          <Screen
            eyebrow="Screen 2 · Step 2"
            title="Select payment method"
            description={`${money(amount)} FCFA · Choose one of the active methods`}
          >
            {activeMethods.length === 0 ? (
              <div className="mx-auto max-w-md rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No active payment methods are available right now.
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                {activeMethods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`flex min-h-20 items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      method === item.id ? "border-[#ffd45a] bg-[#ffd45a]/15" : "border-border bg-[#141419] hover:border-[#ffd45a]/60"
                    }`}
                  >
                    <MethodLogo name={item.name} type={item.type} logoUrl={item.logoUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{item.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{item.type === "mobile_money" ? "Mobile Money" : item.type.replace("_", " ")}</span>
                    </span>
                    {method === item.id && <Check className="size-5 shrink-0 text-[#ffd45a]" />}
                  </button>
                ))}
              </div>
            )}
            <FooterActions onBack={() => setStep(1)} onNext={next} nextLabel="Continue" nextDisabled={!method} />
          </Screen>
        )}

        {step === 3 && (
          <Screen eyebrow="Screen 3 · Step 3" title={isKorapayMethod ? "Enter your mobile number" : "Complete your payment"} description={isKorapayMethod ? "Korapay will send a payment prompt to your phone." : "Send the exact amount to the active account below."}>
            {selectedMethod && isKorapayMethod ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                <Detail label="Amount" value={`${money(amount)} FCFA`} />
                <Detail label="Network" value={korapayNetwork === "orange" ? "Orange Money" : "MTN Mobile Money"} />
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="6XXXXXXXX" />
              </div>
            ) : selectedMethod ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2">
                <Detail label="Amount to send" value={`${money(amount)} FCFA`} onCopy={() => copy(String(amountNumber))} />
                <Detail label="Send to number" value={selectedMethod.number} onCopy={() => copy(selectedMethod.number)} />
                <Detail label="Account name" value={selectedMethod.accountName ?? "—"} onCopy={selectedMethod.accountName ? () => copy(selectedMethod.accountName!) : undefined} />
                {selectedMethod.instructions && <div className="rounded-xl border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">{selectedMethod.instructions}</div>}
              </div>
            ) : <div className="text-center text-sm text-muted-foreground">Choose a payment method first.</div>}
            <FooterActions onBack={() => setStep(2)} onNext={isKorapayMethod ? startKorapay : next} nextLabel={isKorapayMethod ? (submitting ? "Starting…" : "Pay now") : "I have paid"} nextDisabled={!selectedMethod || submitting} />
          </Screen>
        )}

        {step === 4 && (
          <Screen
            eyebrow="Screen 4 · Step 4"
            title={isKorapayMethod ? "Authorize your payment" : (submitted ? "Payment submitted!" : "Upload payment proof")}
            description={isKorapayMethod ? "Complete the Mobile Money authorization to finish your deposit." : (submitted ? "Your payment proof is being reviewed. We'll notify you once the deposit is credited." : "Upload your payment screenshot or receipt.")}
          >            {isKorapayMethod ? (
              <div className="mx-auto w-full max-w-md space-y-3">
                <Detail label="Amount" value={`${money(amount)} FCFA`} />
                <Detail label="Network" value={korapayNetwork === "orange" ? "Orange Money" : "MTN Mobile Money"} />
                <Detail label="Status" value={depositStatus === "approved" ? "Payment confirmed" : depositStatus} />
                <p className="rounded-xl border border-border bg-background p-3 text-center text-sm text-muted-foreground">{korapayMessage || "Authorize the payment on your phone."}</p>
                {korapayAuthModel === "OTP" && <Input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" placeholder="Enter OTP" />}
                {korapayAuthModel === "OTP" && <Button onClick={submitOtp} disabled={submitting || !otp} className="h-11">Authorize payment</Button>}
                {korapayAuthModel !== "OTP" && depositStatus !== "approved" && <Button onClick={async () => { setSubmitting(true); try { const r = await verifyKorapayPayment({data:{depositId:reference}}); setDepositStatus(r.status); setKorapayMessage(r.reason || "Checking payment status…"); } catch(e) { toast.error(e instanceof Error ? e.message : "Could not check payment."); } finally { setSubmitting(false); } }} disabled={submitting} className="h-11">Check payment status</Button>}
              </div>
            ) : (
            {!submitted ? (
              <div className="mx-auto w-full max-w-md">
                <label htmlFor="proof" className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#c9a94b] bg-[#ffd45a]/5 p-4 text-center">
                  <Upload className="size-10 text-[#ffd45a]" />
                  <span className="text-lg font-bold text-[#ffd45a]">Tap to upload</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG or WEBP · maximum 5MB</span>
                  <Input
                    id="proof"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast.error("File must be smaller than 5MB.");
                        return;
                      }
                      setUploadedFile(file ?? null);
                    }}
                  />
                </label>
                {uploadedFile && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-border p-2">
                    <FileImage className="size-4 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-xs">{uploadedFile.name}</span>
                    <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => setUploadedFile(null)} aria-label="Remove proof">
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto w-full max-w-md space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <Check className="size-6 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold">Payment submitted!</p>
                    <p className="text-xs text-muted-foreground">{uploadedFile?.name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Detail label="Amount" value={`${money(amount)} FCFA`} />
                  <Detail label="Payment method" value={selectedMethod?.name ?? "—"} />
                  <Detail label="Account name" value={selectedMethod?.accountName ?? "—"} />
                  <Detail label="Status" value={depositStatus === "pending" ? "Verifying" : depositStatus} />
                </div>
              </div>
            )}
            )}
            {isKorapayMethod ? <FooterActions onBack={() => setStep(3)} onNext={() => navigate({ to: "/dashboard" })} nextLabel="Back to dashboard" /> : (
            <FooterActions
              onBack={!submitted ? () => setStep(3) : undefined}
              onNext={submitted ? () => navigate({ to: "/dashboard" }) : submitProof}
              nextLabel={submitted ? "Back to dashboard" : submitting ? "Submitting…" : "Submit deposit"}
              nextDisabled={!submitted && (!uploadedFile || submitting)}
            />
            )}
          </Screen>

        )}
      </section>
    </main>
  );
}

function MethodLogo({ name, type, logoUrl }: { name: string; type: string; logoUrl?: string }) {
  const normalized = name.toLowerCase();
  if (logoUrl) {
    return (
      <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-2">
        <img src={logoUrl} alt="" className="max-h-10 max-w-10 object-contain" loading="eager" />
      </span>
    );
  }
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
      {type === "bank_transfer" ? <Wallet className="size-7 text-primary" /> : <Smartphone className="size-7 text-primary" />}
    </span>
  );
}

function Screen({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#303039] bg-[#141419] p-4 sm:p-6">
      <div className="shrink-0 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffd45a]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground sm:text-sm">{description}</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-2">{children}</div>
    </div>
  );
}

function FooterActions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-2 flex shrink-0 gap-2 border-t border-border pt-2">
      {onBack && (
        <Button type="button" variant="outline" onClick={onBack} className="h-11 flex-1">
          <ArrowLeft data-icon="inline-start" /> Back
        </Button>
      )}
      <Button type="button" onClick={onNext} disabled={nextDisabled} className="h-11 flex-1 bg-[#ffd45a] font-bold text-black hover:bg-[#f2c84e]">
        {nextLabel} <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}

function Detail({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex min-h-14 min-w-0 items-center gap-3 rounded-xl border border-[#c9a94b]/70 bg-[#111116] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-[#ffd45a]">{label}</p>
        <p className="mt-0.5 break-all text-sm font-bold leading-tight">{value}</p>
      </div>
      {onCopy && (
        <Button type="button" size="icon" variant="ghost" onClick={onCopy} aria-label={`Copy ${label}`}>
          <Copy className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{status}</span>;
}
