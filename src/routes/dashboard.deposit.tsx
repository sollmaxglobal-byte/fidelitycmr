import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Clock3, Copy, FileImage, ShieldCheck, Smartphone, Upload, Wallet, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/dashboard/deposit")({ component: DepositPage });

type MethodId = string;
type Method = { id: MethodId; name: string; number: string; enabled: boolean; color: string; instructions?: string; accountName?: string };
type Settings = { deposit_min_amount?: number; deposit_max_amount?: number };
const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000, 200000];
const fallbackSettings: Required<Pick<Settings, "deposit_min_amount" | "deposit_max_amount">> = { deposit_min_amount: 1000, deposit_max_amount: 10000000 };

function money(value: string | number) { return Number(value || 0).toLocaleString("fr-FR"); }
function makeReference() { return `FID-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
function methodName(method: Method | undefined) { return method?.name ?? "Mobile Money"; }

function DepositPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<MethodId | null>(null);
  const [reference] = useState(makeReference);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<Settings>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(900);
  const [depositStatus, setDepositStatus] = useState("pending");

  const [activeMethods, setActiveMethods] = useState<Method[]>([]);
  const selectedMethod = activeMethods.find((m) => m.id === method);
  const amountNumber = Number(amount);
  const minAmount = Number(settings.deposit_min_amount ?? fallbackSettings.deposit_min_amount);
  const maxAmount = Number(settings.deposit_max_amount ?? fallbackSettings.deposit_max_amount);
  const amountError = amount && (amountNumber < minAmount || amountNumber > maxAmount) ? `Enter an amount between ${money(minAmount)} and ${money(maxAmount)} FCFA.` : "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: settingsData, error: settingsError }, { data: methodsData, error: methodsError }] = await Promise.all([
        supabase.from("app_settings").select("deposit_min_amount, deposit_max_amount").eq("id", 1).maybeSingle(),
        supabase.from("payment_methods").select("id, label, account_name, account_number, instructions, active, scope").eq("active", true).in("scope", ["deposit", "both"]).order("type"),
      ]);
      if (settingsError) toast.error("Could not load deposit settings.");
      if (methodsError) toast.error("Could not load payment methods.");
      if (mounted && settingsData) setSettings(settingsData as Settings);
      if (mounted && methodsData) setActiveMethods(methodsData.map((item) => ({ id: item.id, name: item.label, number: item.account_number ?? "", enabled: item.active, color: item.label.toLowerCase().includes("orange") ? "#FF7900" : item.label.toLowerCase().includes("mtn") ? "#FFCC00" : "#0f766e", instructions: item.instructions ?? undefined, accountName: item.account_name ?? undefined })).filter((item) => item.number));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (step === 2 && activeMethods.length === 1) setMethod(activeMethods[0].id);
  }, [step, activeMethods]);

  useEffect(() => {
    if (step !== 3 || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, remaining]);

  useEffect(() => {
    if (step !== 5 || !reference) return;
    const poll = window.setInterval(async () => {
      const { data } = await supabase.from("deposits").select("status").eq("reference", reference).maybeSingle();
      if (data?.status) setDepositStatus(data.status);
    }, 10000);
    return () => window.clearInterval(poll);
  }, [step, reference]);

  async function copy(value: string) { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard"); }
  function next() {
    if (step === 1) { if (!amount || amountNumber < minAmount || amountNumber > maxAmount) { toast.error(amountError || "Enter a valid amount."); return; } setStep(2); }
    else if (step === 2) { if (!method) { toast.error("Choose an active payment method."); return; } setStep(3); }
    else if (step === 3) setStep(4);
  }
  async function submitProof() {
    if (!user || !uploadedFile || !selectedMethod) { toast.error("Upload your payment proof to continue."); return; }
    setSubmitting(true);
    try {
      const path = `${user.id}/${reference}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, uploadedFile, { upsert: true, contentType: uploadedFile.type });
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
      setStep(5); toast.success("Proof uploaded successfully");
    } catch (error) { console.error("[v0] Deposit submission failed", error); toast.error(error instanceof Error ? error.message : "Could not submit your deposit."); }
    finally { setSubmitting(false); }
  }

  const timer = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const steps = ["Amount", "Method", "Payment", "Proof", "Processing"];
  if (loading) return <div className="mx-auto max-w-xl py-16 text-center text-muted-foreground">Loading deposit options…</div>;

  return (
    <main className="mx-auto flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-6xl flex-col overflow-hidden bg-[#101014] px-3 py-2 text-[#f8f7f2] sm:px-4">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#303039] pb-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffd45a]">Secure deposit</p>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Fund your wallet</h1>
          <p className="hidden text-xs text-[#a9a9b0] sm:block">Everything you need is on this page — no steps or scrolling.</p>
        </div>
        <ShieldCheck className="size-6 shrink-0 text-[#ffd45a]" />
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-2 py-2 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid min-h-0 grid-rows-[auto_auto_1fr] gap-2">
          <div className="rounded-xl border border-[#3c3c47] bg-[#141419] p-3">
            <div className="mb-2 flex items-center justify-between">
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">1 · Amount</p><p className="text-sm font-semibold">How much?</p></div>
              <Wallet className="size-5 text-[#ffd45a]" />
            </div>
            <div className="relative">
              <Input id="deposit-amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" inputMode="numeric" className="h-12 border-border bg-background pr-16 text-xl font-bold" aria-invalid={!!amountError} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">FCFA</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground"><span>Min {money(minAmount)}</span><span>Max {money(maxAmount)}</span></div>
            {amountError && <p className="mt-1 text-xs text-destructive">{amountError}</p>}
            <div className="mt-2 flex gap-1.5 overflow-hidden">{QUICK_AMOUNTS.slice(0, 6).map((value) => <Button key={value} type="button" size="sm" variant={amountNumber === value ? "default" : "outline"} className="h-7 flex-1 px-1 text-[10px]" onClick={() => setAmount(String(value))}>{money(value)}</Button>)}</div>
          </div>

          <div className="min-h-0 rounded-xl border border-[#3c3c47] bg-[#141419] p-3">
            <div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">2 · Payment method</p><p className="text-sm font-semibold">Choose where to send</p></div><Smartphone className="size-5 text-[#ffd45a]" /></div>
            {activeMethods.length === 0 ? <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">No active payment methods available.</div> : <div className="grid max-h-28 grid-cols-2 gap-1.5 overflow-hidden sm:grid-cols-3">{activeMethods.map((item) => <button key={item.id} type="button" onClick={() => { setMethod(item.id); setStep(3); }} className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 text-left transition ${method === item.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}><span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">{item.name.toLowerCase().includes("mtn") ? <img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/mtn-mobile-money/default.svg" alt="" className="size-7 object-contain" /> : item.name.toLowerCase().includes("orange") ? <span className="flex size-full items-center justify-center text-[9px] font-black">OM</span> : <Smartphone className="size-4 text-primary" />}</span><span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.name}</span>{method === item.id && <Check className="size-4 shrink-0 text-primary" />}</button>)}</div>}
          </div>

          <div className="min-h-0 rounded-xl border border-[#3c3c47] bg-[#141419] p-3">
            <div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">3 · Payment details</p><p className="text-sm font-semibold">Send the exact amount</p></div>{selectedMethod && <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">{selectedMethod.name}</span>}</div>
            {selectedMethod ? <div className="grid grid-cols-2 gap-1.5">
              <Detail label="Amount" value={`${money(amount || 0)} FCFA`} onCopy={() => copy(amount)} />
              {selectedMethod.accountName && <Detail label="Account name" value={selectedMethod.accountName} onCopy={() => copy(selectedMethod.accountName!)} />}
              <Detail label="Send to number" value={selectedMethod.number} onCopy={() => copy(selectedMethod.number)} />
              {selectedMethod.instructions && <div className="col-span-2 rounded-lg bg-primary/5 p-2 text-[10px] leading-relaxed text-muted-foreground">{selectedMethod.instructions}</div>}
            </div> : <div className="flex h-20 items-center justify-center rounded-lg bg-background text-center text-xs text-muted-foreground">Select a payment method above to see the account details.</div>}
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[1fr_auto] gap-2">
          <div className="min-h-0 rounded-xl border border-[#3c3c47] bg-[#141419] p-3">
            <div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">4 · Payment proof</p><p className="text-sm font-semibold">Upload your screenshot</p></div><Upload className="size-5 text-[#ffd45a]" /></div>
            <label htmlFor="proof" className="flex h-[calc(100%-2.5rem)] min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-center">
              {uploadedFile ? <><FileImage className="size-8 text-primary" /><span className="max-w-full truncate text-xs font-semibold">{uploadedFile.name}</span><span className="text-[10px] text-muted-foreground">Tap to replace</span></> : <><Upload className="size-8 text-primary" /><span className="text-sm font-semibold">Upload screenshot</span><span className="text-[10px] text-muted-foreground">PNG, JPG or WEBP · maximum 5MB</span></>}
              <Input id="proof" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file && file.size > 5 * 1024 * 1024) toast.error("File must be smaller than 5MB."); else setUploadedFile(file ?? null); }} />
            </label>
            {uploadedFile && <div className="mt-2 flex items-center gap-2 rounded-lg border border-border p-2"><FileImage className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate text-xs">{uploadedFile.name}</span><Button size="icon" variant="ghost" className="size-7" onClick={() => setUploadedFile(null)} aria-label="Remove proof"><X className="size-4" /></Button></div>}
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div><span className="text-muted-foreground">Reference</span><p className="truncate font-mono font-semibold">{reference}</p></div>
              <div><span className="text-muted-foreground">Status</span><p className="font-semibold">{depositStatus === "pending" ? "Ready for review" : depositStatus}</p></div>
              <div><span className="text-muted-foreground">Security</span><p className="font-semibold">Encrypted</p></div>
            </div>
            <Button onClick={submitProof} disabled={!uploadedFile || !selectedMethod || !amount || !!amountError || submitting} className="mt-2 h-11 w-full text-sm font-bold">
              {submitting ? "Submitting…" : `Submit ${money(amount || 0)} FCFA deposit`} <Check data-icon="inline-end" />
            </Button>
            <p className="mt-1 text-center text-[9px] text-muted-foreground">By submitting, you confirm the payment screenshot is genuine.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value, onCopy, hint }: { label: string; value: string; onCopy?: () => void; hint?: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-semibold">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>{onCopy && <Button size="icon" variant="ghost" onClick={onCopy} aria-label={`Copy ${label}`}><Copy /></Button>}</div>; }

export function StatusBadge({ status }: { status: string }) { return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{status}</span>; }
