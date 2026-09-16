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
      const { error: uploadError } = await supabase.storage.from("deposit-proofs").upload(path, uploadedFile, { upsert: true, contentType: uploadedFile.type });
      if (uploadError) throw uploadError;
      const { data: publicFile } = supabase.storage.from("deposit-proofs").getPublicUrl(path);
      const { error } = await supabase.from("deposits").insert({ user_id: user.id, amount: amountNumber, method: method, reference, screenshot_url: publicFile.publicUrl, status: "pending" });
      if (error) throw error;
      setStep(5); toast.success("Proof uploaded successfully");
    } catch (error) { console.error("[v0] Deposit submission failed", error); toast.error(error instanceof Error ? error.message : "Could not submit your deposit."); }
    finally { setSubmitting(false); }
  }

  const timer = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const steps = ["Amount", "Method", "Payment", "Proof", "Processing"];
  if (loading) return <div className="mx-auto max-w-xl py-16 text-center text-muted-foreground">Loading deposit options…</div>;

  return <main className="mx-auto flex w-full max-w-xl flex-col gap-6 bg-[#101014] px-4 pb-32 pt-4 text-[#f8f7f2] md:rounded-[2rem] md:px-8 md:pb-10">
    <header className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffd45a]">Secure deposit</p><h1 className="mt-3 text-balance font-display text-3xl font-bold text-[#f8f7f2]">Fund your wallet</h1><p className="mt-2 text-sm text-[#a9a9b0]">Fast, secure mobile-money deposits.</p></div><ShieldCheck className="size-8 text-[#ffd45a]" /></header>
    <nav aria-label="Deposit progress" className="flex items-center justify-between gap-1 rounded-2xl border border-[#3c3c47] bg-[#17171d] p-3">{steps.map((label, index) => { const n = index + 1; return <div className="flex flex-1 items-center gap-2" key={label}><div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step > n ? "bg-primary text-primary-foreground" : step === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{step > n ? <Check className="size-4" /> : n}</div><span className={`hidden text-xs sm:inline ${step === n ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>{n < steps.length && <div className={`mx-1 h-px flex-1 ${step > n ? "bg-primary" : "bg-border"}`} />}</div>})}</nav>
    <section className="rounded-[2rem] border border-[#3c3c47] bg-[#141419] p-5 shadow-2xl shadow-black/20 sm:p-7">
      <AnimatePresence mode="wait">
        {step === 1 && <motion.div key="amount" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-6"><div><h2 className="font-display text-2xl">How much do you want to deposit?</h2><p className="mt-2 text-sm text-muted-foreground">Choose an amount to add to your wallet.</p></div><div className="flex flex-col gap-2"><Label htmlFor="deposit-amount">Amount in FCFA</Label><div className="relative"><Input id="deposit-amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="0" inputMode="numeric" className="h-20 border-border bg-background pr-20 text-[32px] font-bold" aria-invalid={!!amountError} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">FCFA</span></div><p className="text-xs text-muted-foreground">Min: {money(minAmount)} FCFA — Max: {money(maxAmount)} FCFA</p>{amountError && <p className="text-sm text-destructive">{amountError}</p>}</div><div className="flex flex-wrap gap-2">{QUICK_AMOUNTS.map((value) => <Button key={value} type="button" variant={amountNumber === value ? "default" : "outline"} onClick={() => setAmount(String(value))}>{money(value)}</Button>)}</div></motion.div>}
        {step === 2 && <motion.div key="method" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5"><div><h2 className="font-display text-2xl">Choose a payment method</h2><p className="mt-2 text-sm text-muted-foreground">You are depositing {money(amount)} FCFA.</p></div>{activeMethods.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center"><Clock3 className="size-8 text-muted-foreground" /><h3 className="font-semibold">No payment methods available</h3><p className="text-sm text-muted-foreground">There are no active deposit methods right now. Please check back shortly.</p></div> : <div className="flex flex-col gap-3">{activeMethods.map((item) => <motion.button whileTap={{ scale: 0.98 }} key={item.id} type="button" onClick={() => setMethod(item.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${method === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}><span className="flex size-12 items-center justify-center overflow-hidden rounded-xl bg-background" aria-label={`${item.name} logo`}>{item.name.toLowerCase().includes("mtn") ? <img src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/mtn-mobile-money/default.svg" alt="MTN Mobile Money" className="size-10 object-contain" /> : item.name.toLowerCase().includes("orange") ? <span className="flex size-full items-center justify-center bg-[#FF7900] text-xs font-black text-foreground">OM</span> : <span className="flex size-full items-center justify-center text-primary"><Smartphone className="size-6" /></span>}</span><span className="flex min-w-0 flex-1 flex-col gap-1"><span className="font-semibold">{item.name}</span><span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-success/15 px-2 py-0.5 text-success">Instant</span> {item.number}</span></span>{method === item.id && <Check className="size-5 text-primary" />}</motion.button>)}</div>}</motion.div>}
        {step === 3 && selectedMethod && <motion.div key="payment" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5"><div><h2 className="font-display text-2xl">Complete your payment</h2><p className="mt-2 text-sm text-muted-foreground">Send exact amount to complete deposit.</p></div><div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3"><span className="flex items-center gap-2 text-sm"><Clock3 className="size-4 text-primary" /> Payment window</span><strong className="font-mono text-primary">{timer}</strong></div><Detail label="Amount to send" value={`${money(amount)} FCFA`} onCopy={() => copy(amount)} />{selectedMethod.accountName && <Detail label="Account name" value={selectedMethod.accountName} onCopy={() => copy(selectedMethod.accountName)} />}<Detail label="Send to number" value={selectedMethod.number} onCopy={() => copy(selectedMethod.number)} /></motion.div>}
        {step === 4 && <motion.div key="proof" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5"><div><h2 className="font-display text-2xl">Upload payment proof</h2><p className="mt-2 text-sm text-muted-foreground">Depositing {money(amount)} FCFA via {methodName(selectedMethod)}.</p></div><label htmlFor="proof" className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-6 text-center"><Upload className="size-8 text-primary" /><span className="font-semibold">Upload screenshot</span><span className="text-xs text-muted-foreground">PNG, JPG or WEBP · maximum 5MB</span><Input id="proof" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file && file.size > 5 * 1024 * 1024) toast.error("File must be smaller than 5MB."); else setUploadedFile(file ?? null); }} /></label>{uploadedFile && <div className="flex items-center gap-3 rounded-xl border border-border p-3"><FileImage className="size-5 text-primary" /><span className="min-w-0 flex-1 truncate text-sm">{uploadedFile.name}</span><Button size="icon" variant="ghost" onClick={() => setUploadedFile(null)} aria-label="Remove proof"><X /></Button></div>}</motion.div>}
        {step === 5 && <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 text-center"><div className="relative flex size-24 items-center justify-center rounded-full bg-primary/15"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-9" /></motion.div>{[0,1,2,3,4].map((i) => <motion.i key={i} initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0,1,0], y: -35 - i * 5, x: (i - 2) * 18 }} transition={{ delay: i * .08, duration: 1.2, repeat: Infinity }} className="absolute size-2 rounded-full bg-primary" />)}</div><div><h2 className="font-display text-2xl">Deposit received</h2><p className="mt-2 text-sm text-muted-foreground">Your proof is being reviewed securely.</p></div><div className="grid w-full gap-3 rounded-2xl border border-border bg-background p-4 text-left text-sm"><Detail label="Amount" value={`${money(amount)} FCFA`} /><Detail label="Reference" value={reference} /><Detail label="Method" value={methodName(selectedMethod)} /></div><div className="flex w-full flex-col gap-4 text-left">{[["Uploaded", true], ["Verifying", depositStatus === "pending"], ["Credited", depositStatus === "approved" || depositStatus === "paid"]].map(([label, done]) => <div key={String(label)} className="flex items-center gap-3"><span className={`flex size-6 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{done ? <Check className="size-3" /> : <span className="size-2 rounded-full bg-muted-foreground" />}</span><span className="text-sm">{label}</span>{label === "Verifying" && done && <span className="ml-auto size-2 animate-pulse rounded-full bg-primary" />}</div>)}</div><div className="w-full rounded-xl bg-primary/10 p-4 text-sm"><strong>Estimated time: 5–15 minutes</strong><p className="mt-1 text-muted-foreground">We’ll notify you when your wallet is credited.</p></div></motion.div>}
      </AnimatePresence>
    </section>
    {step < 5 && <div className="fixed inset-x-0 bottom-16 z-10 border-t border-border bg-background/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0"><div className="mx-auto flex max-w-xl gap-3">{step > 1 && <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)} className="flex-1"><ArrowLeft data-icon="inline-start" /> Back</Button>}{step === 1 && <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })} className="flex-1"><Wallet data-icon="inline-start" /> Dashboard</Button>}{step < 4 ? <Button onClick={next} disabled={step === 2 && activeMethods.length === 0} className="flex-1">Continue <ArrowRight data-icon="inline-end" /></Button> : <Button onClick={submitProof} disabled={!uploadedFile || submitting} className="flex-1">{submitting ? "Submitting…" : "Submit proof"} <Check data-icon="inline-end" /></Button>}</div></div>}
    {step === 5 && <div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => navigate({ to: "/dashboard" })} className="flex-1">Back to Dashboard</Button><Button variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Deposit ${reference}`)}`, "_blank")} className="flex-1">WhatsApp</Button></div>}
  </main>;
}

function Detail({ label, value, onCopy, hint }: { label: string; value: string; onCopy?: () => void; hint?: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4"><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-semibold">{value}</p>{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}</div>{onCopy && <Button size="icon" variant="ghost" onClick={onCopy} aria-label={`Copy ${label}`}><Copy /></Button>}</div>; }

export function StatusBadge({ status }: { status: string }) { return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{status}</span>; }
