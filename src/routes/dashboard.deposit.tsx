import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Copy, FileImage, ShieldCheck, Smartphone, Upload, Wallet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<Settings>(fallbackSettings);
  const [activeMethods, setActiveMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depositStatus, setDepositStatus] = useState("pending");

  const selectedMethod = activeMethods.find((m) => m.id === method);
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
            .select("id, label, account_name, account_number, instructions, active, scope")
            .eq("active", true)
            .in("scope", ["deposit", "both"])
            .order("type"),
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
              color: item.label.toLowerCase().includes("orange")
                ? "#FF7900"
                : item.label.toLowerCase().includes("mtn")
                  ? "#FFCC00"
                  : "#0f766e",
              instructions: item.instructions ?? undefined,
              accountName: item.account_name ?? undefined,
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
    if (step !== 5) return;
    const poll = window.setInterval(async () => {
      const { data } = await supabase.from("deposits").select("status").eq("reference", transactionId).maybeSingle();
      if (data?.status) setDepositStatus(data.status);
    }, 10000);
    return () => window.clearInterval(poll);
  }, [step, transactionId]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
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
      const reference = transactionId || crypto.randomUUID();
      setTransactionId(reference);
      const path = `${user.id}/${reference}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, uploadedFile, { upsert: true, contentType: uploadedFile.type });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("deposits").insert({
        user_id: user.id,
        amount: amountNumber,
        payment_method_id: method,
        reference,
        proof_url: path,
        status: "pending",
      });
      if (error) throw error;

      setStep(5);
      toast.success("Proof uploaded successfully");
    } catch (error) {
      console.error("[deposit] submission failed", error);
      toast.error(error instanceof Error ? error.message : "Could not submit your deposit.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress = step === 5 ? 100 : (step / 5) * 100;

  if (loading) {
    return (
      <main className="flex h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-[#101014] text-[#f8f7f2]">
        <p className="text-sm text-muted-foreground">Loading deposit options…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-4xl flex-col overflow-hidden bg-[#101014] px-3 py-3 text-[#f8f7f2] sm:px-6">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#303039] pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffd45a]">Secure deposit</p>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Fund your wallet</h1>
        </div>
        <ShieldCheck className="size-6 shrink-0 text-[#ffd45a]" />
      </header>

      <div className="shrink-0 py-2">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Step {step} of 5</span>
          <span>{step === 5 ? "Complete" : "Deposit flow"}</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[#2b2b33]">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="min-h-0 flex-1 overflow-hidden py-2">
        {step === 1 && (
          <Screen
            icon={<Wallet className="size-6 text-[#ffd45a]" />}
            eyebrow="1 · Amount"
            title="How much do you want to deposit?"
            description="Enter the amount you want credited to your wallet."
          >
            <div className="mx-auto w-full max-w-md">
              <div className="relative">
                <Input
                  id="deposit-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0"
                  inputMode="numeric"
                  autoFocus
                  className="h-16 border-border bg-background pr-20 text-2xl font-bold"
                  aria-invalid={!!amountError}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">FCFA</span>
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>Minimum {money(minAmount)} FCFA</span>
                <span>Maximum {money(maxAmount)} FCFA</span>
              </div>
              {amountError && <p className="mt-2 text-xs text-destructive">{amountError}</p>}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((value) => (
                  <Button key={value} type="button" variant={amountNumber === value ? "default" : "outline"} className="h-9 text-xs" onClick={() => setAmount(String(value))}>
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
            icon={<Smartphone className="size-6 text-[#ffd45a]" />}
            eyebrow="2 · Payment method"
            title="Choose a payment method"
            description={`Deposit amount: ${money(amount)} FCFA`}
          >
            {activeMethods.length === 0 ? (
              <div className="mx-auto max-w-md rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No active payment methods are available right now.
              </div>
            ) : (
              <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {activeMethods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`flex h-20 items-center gap-3 rounded-xl border p-4 text-left transition ${method === item.id ? "border-primary bg-primary/10" : "border-border bg-[#141419] hover:border-primary/50"}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
                      {item.name.toLowerCase().includes("mtn") ? (
                        <img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/mtn-mobile-money/default.svg" alt="" className="size-8 object-contain" />
                      ) : item.name.toLowerCase().includes("orange") ? (
                        <span className="text-[10px] font-black">OM</span>
                      ) : (
                        <Smartphone className="size-5 text-primary" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.name}</span>
                    {method === item.id && <Check className="size-5 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
            )}
            <FooterActions onBack={() => setStep(1)} onNext={next} nextLabel="Continue" nextDisabled={!method} />
          </Screen>
        )}

        {step === 3 && (
          <Screen
            icon={<Copy className="size-6 text-[#ffd45a]" />}
            eyebrow="3 · Payment details"
            title="Make the payment"
            description="Send the exact amount to the account below, then continue."
          >
            {selectedMethod ? (
              <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
                <Detail label="Amount" value={`${money(amount)} FCFA`} />
                <Detail label="Account number" value={selectedMethod.number} onCopy={() => copy(selectedMethod.number)} />
                <Detail label="Account name" value={selectedMethod.accountName ?? "—"} onCopy={selectedMethod.accountName ? () => copy(selectedMethod.accountName!) : undefined} />
                {selectedMethod.instructions && (
                  <div className="rounded-xl border border-border bg-background p-3 text-[11px] leading-relaxed text-muted-foreground">
                    {selectedMethod.instructions}
                  </div>
                )}
              </div>            ) : (
              <div className="text-center text-sm text-muted-foreground">Choose a payment method first.</div>
            )}
            <FooterActions onBack={() => setStep(2)} onNext={next} nextLabel="Continue" nextDisabled={!selectedMethod} />
          </Screen>
        )}

        {step === 4 && (
          <Screen
            icon={<Upload className="size-6 text-[#ffd45a]" />}
            eyebrow="4 · Payment proof"
            title="Upload your payment screenshot"
            description="Upload a clear screenshot showing the completed payment and amount."
          >
            <div className="mx-auto w-full max-w-xl">
              <label htmlFor="proof" className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4 text-center sm:h-56">
                {uploadedFile ? (
                  <>
                    <FileImage className="size-10 text-primary" />
                    <span className="max-w-full truncate text-sm font-semibold">{uploadedFile.name}</span>
                    <span className="text-xs text-muted-foreground">Tap to replace</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-10 text-primary" />
                    <span className="text-sm font-semibold">Upload screenshot</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG or WEBP · maximum 5MB</span>
                  </>
                )}
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
            <FooterActions onBack={() => setStep(3)} onNext={submitProof} nextLabel={submitting ? "Submitting…" : "Submit deposit"} nextDisabled={!uploadedFile || submitting} />
          </Screen>
        )}

        {step === 5 && (
          <Screen
            icon={<Check className="size-6 text-[#ffd45a]" />}
            eyebrow="5 · Processing"
            title={depositStatus === "pending" ? "Deposit submitted" : `Deposit ${depositStatus}`}
            description="Your proof has been submitted for review. You can track the deposit status below."
          >
            <div className="mx-auto grid w-full max-w-xl gap-3 sm:grid-cols-2">
              <Detail label="Amount" value={`${money(amount)} FCFA`} />
              <Detail label="Transaction ID" value={transactionId} onCopy={() => copy(transactionId)} />
              <Detail label="Payment method" value={selectedMethod?.name ?? "—"} />
              <Detail label="Status" value={depositStatus === "pending" ? "Pending review" : depositStatus} />
            </div>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => navigate({ to: "/dashboard" })} className="h-11 px-8">
                Back to dashboard <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </Screen>
        )}
      </section>
    </main>
  );
}

function Screen({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#303039] bg-[#141419] p-4 sm:p-6">
      <div className="shrink-0 text-center">
        <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10">{icon}</div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold sm:text-2xl">{title}</h2>
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
      <Button type="button" onClick={onNext} disabled={nextDisabled} className="h-11 flex-1 font-bold">
        {nextLabel} <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  );
}

function Detail({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex min-h-14 min-w-0 items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-all text-sm font-semibold leading-tight">{value}</p>
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
