import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, XCircle, History, Home, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/Money";

export const Route = createFileRoute("/deposit-pending/$id")({
  component: PendingDepositPage,
});

const WAIT_MS = 15 * 60 * 1000; // up to 15 minutes
const POLL_MS = 6 * 1000;
const REDIRECT_AFTER_APPROVAL_MS = 4000;

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | string;
  created_at: string;
};

function PendingDepositPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Poll status
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchOnce = async () => {
      const [{ data }, { data: settings }] = await Promise.all([
        supabase.from("deposits").select("id,user_id,amount,status,created_at").eq("id", id).maybeSingle(),
        supabase.from("app_settings").select("announcement_link").eq("id", 1).maybeSingle(),
      ]);
      if (settings?.announcement_link) setWhatsappLink(settings.announcement_link);
      if (cancelled) return;
      const d = data as Deposit | null;
      if (d) {
        setDeposit(d);
        startRef.current = Math.min(startRef.current, new Date(d.created_at).getTime());
        if (d.status === "approved" || d.status === "rejected") return; // stop polling
      }
      timer = setTimeout(fetchOnce, POLL_MS);
    };
    fetchOnce();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, user]);

  // Elapsed timer
  useEffect(() => {
    const tick = () => setElapsed(Date.now() - startRef.current);
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Timeout → wallet history (after full 10 min if still pending)
  useEffect(() => {
    if (!deposit) return;
    if (deposit.status !== "pending") return;
    if (elapsed >= WAIT_MS) {
      navigate({ to: "/dashboard/wallet", search: { filter: "Deposits" } as never });
    }
  }, [elapsed, deposit, navigate]);

  // Auto redirect to deposit history once approved
  useEffect(() => {
    if (deposit?.status !== "approved") return;
    const t = setTimeout(() => {
      navigate({ to: "/dashboard/wallet", search: { filter: "Deposits" } as never });
    }, REDIRECT_AFTER_APPROVAL_MS);
    return () => clearTimeout(t);
  }, [deposit?.status, navigate]);

  if (loading || !deposit) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const remaining = Math.max(0, WAIT_MS - elapsed);
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const pct = Math.min(100, (elapsed / WAIT_MS) * 100);

  if (deposit.status === "approved") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-md space-y-4 py-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15"
        >
          <CheckCircle2 className="h-12 w-12 text-success" />
        </motion.div>
        <h1 className="font-display text-2xl text-primary">Deposit approved successfully</h1>
        <p className="text-sm text-muted-foreground">
          Your deposit has been confirmed and credited to your wallet. Redirecting to your deposit
          history…
        </p>
        <div className="rounded-2xl border border-border bg-card p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Amount credited
            </span>
            <Money value={deposit.amount} className="font-display text-xl text-success" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link to="/dashboard/wallet" search={{ filter: "Deposits" } as never}>
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  if (deposit.status === "rejected") {
    return (
      <div className="mx-auto max-w-md space-y-4 py-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="font-display text-2xl text-primary">Deposit rejected</h1>
        <p className="text-sm text-muted-foreground">
          We couldn't verify this payment. Contact support if you believe this is a mistake.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link to="/dashboard/wallet" search={{ filter: "Deposits" } as never}>
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>
          <Button asChild className="bg-primary text-primary-foreground hover:opacity-90">
            <Link to="/dashboard/deposit">Try again</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto min-h-screen max-w-md space-y-5 bg-[#101014] px-4 py-6 text-[#f8f7f2]"
    >
      <div className="text-center">
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
          {/* Outer pulsing halo */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-2 rounded-full bg-warning/15"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut", delay: 0.4 }}
          />
          {/* Spinning preloader ring */}
          <motion.span
            aria-hidden
            className="absolute inset-3 rounded-full border-4 border-primary/15 border-t-primary border-r-primary/60"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 1.4 }}
          />
          {/* Counter-rotating inner ring */}
          <motion.span
            aria-hidden
            className="absolute inset-6 rounded-full border-2 border-warning/20 border-b-warning"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 2.2 }}
          />
          {/* Orbiting dots */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 3, delay: i * 0.3 }}
              style={{ transformOrigin: `0px ${52}px` }}
            />
          ))}
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-warning/25 to-primary/20 shadow-inner"
          >
            <Clock className="h-8 w-8 text-warning" />
          </motion.div>
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 font-display text-2xl text-primary"
        >
          Deposit submitted successfully
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-1 text-sm text-muted-foreground"
        >
          Now waiting for approval — this might take up to 15 minutes.
        </motion.p>
        {/* Animated three-dots */}
        <div className="mt-2 flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Amount</span>
          <Money value={deposit.amount} className="font-display text-xl text-primary" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
            <Loader2 className="h-3 w-3 animate-spin" /> Awaiting approval
          </span>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Time remaining</span>
            <span className="font-mono text-foreground">
              {mm}:{ss}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-success"
              animate={{ width: `${pct}%` }}
              transition={{ ease: "linear", duration: 0.6 }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            You'll be automatically redirected to your dashboard as soon as the payment is approved.
            If it isn't approved within 15 minutes, you'll be taken to your deposit history —
            pending deposits stay safe and will be credited once our team confirms them.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#7f6731] bg-[#25252a] p-4"><div className="flex items-center justify-between text-sm"><span>Estimated time: 5–15 minutes</span><Clock className="size-5 text-[#ffd45a]" /></div><p className="mt-1 text-sm text-[#bdb7bd]">You&apos;ll receive a notification once credited.</p><p className="mt-3 text-sm text-[#bdb7bd]">Transaction ID: <span className="font-mono text-[#f8f7f2]">{deposit.id}</span></p></div>
      <div><div className="mb-2 flex justify-between font-semibold"><span>Progress</span><span className="text-[#ffd45a]">{Math.round(pct)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-[#3b3b42]"><motion.div className="h-full rounded-full bg-[#ffd45a]" animate={{ width: `${pct}%` }} /></div></div>
      <div className="grid grid-cols-2 gap-3"><Button asChild className="bg-[#eab532] text-[#101014] hover:bg-[#ffd45a]"><Link to="/dashboard"><Home className="mr-2 size-4" />Back to Dashboard</Link></Button>{whatsappLink ? <Button asChild variant="outline" className="border-[#d9b54a] text-[#ffd45a]"><a href={whatsappLink} target="_blank" rel="noreferrer">Contact Support on WhatsApp</a></Button> : <Button asChild variant="outline"><Link to="/dashboard/wallet" search={{ filter: "Deposits" } as never}><History className="mr-2 size-4" />History</Link></Button>}</div>
    </motion.div>
  );
}
