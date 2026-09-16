import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  Share2,
  Copy,
  Users,
  TrendingUp,
  ChevronRight,
  Bell,
  ShieldCheck,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatDate, formatXAF } from "@/lib/format";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Money } from "@/components/Money";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

// Animated count-up for the balance hero — feels like a live investing app.
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const delta = value - start;
    if (delta === 0) return;
    const duration = 900;
    const startTs = performance.now();
    let raf = 0;
    const step = (ts: number) => {
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + delta * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <Money value={Math.round(display)} />;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

type Profile = {
  full_name: string | null;
  balance: number;
  referral_code: string | null;
  referral_earnings: number | null;
};

type ActiveInvestment = {
  id: string;
  amount: number;
  total_earned: number;
  start_date: string;
  end_date: string;
  is_paused: boolean;
  plans: { name: string } | null;
};

const RANGES = [
  { key: "1D", hours: 24, points: 12 },
  { key: "1W", hours: 24 * 7, points: 14 },
  { key: "1M", hours: 24 * 30, points: 15 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

function DashboardHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [investments, setInvestments] = useState<ActiveInvestment[]>([]);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const toggleBalance = () => setBalanceVisible((visible) => !visible);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { count: refCount }, { data: inv }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,balance,referral_code,referral_earnings")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("referred_by", user.id),
        supabase
          .from("investments")
          .select("id,amount,total_earned,start_date,end_date,is_paused,plans(name)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("end_date", { ascending: true }),
      ]);
      setProfile(p as Profile);
      setReferralCount(refCount ?? 0);
      setInvestments((inv as unknown as ActiveInvestment[]) ?? []);
    })();
  }, [user]);

  const totalInvested = useMemo(
    () => investments.reduce((s, i) => s + Number(i.amount), 0),
    [investments],
  );
  const totalProfit = useMemo(
    () => investments.reduce((s, i) => s + Number(i.total_earned), 0),
    [investments],
  );

  return (
    <motion.div
      className="dashboard-home space-y-4 pb-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Greeting */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("home.welcomeBack")}
          </p>
          <h1 className="font-display text-xl text-primary md:text-2xl">
            {profile?.full_name ?? t("home.investor")}
          </h1>
        </div>
        <motion.span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-success"
          animate={{ opacity: [0.72, 1, 0.72] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
        </motion.span>
      </motion.div>

      {/* Balance + chart card */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-elegant"
      >
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("home.availableBalance")}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              onClick={toggleBalance}
              aria-label={balanceVisible ? "Hide available balance" : "Show available balance"}
            >
              {balanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-1.5 font-display text-3xl leading-tight text-foreground sm:text-4xl">
            {balanceVisible ? (
              <AnimatedNumber value={profile?.balance ?? 0} />
            ) : (
              <span aria-label="Balance hidden">••••••••</span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div className="rounded-2xl bg-secondary/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Main wallet
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {balanceVisible ? <Money value={Number(profile?.balance ?? 0)} /> : "••••••"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">Available balance</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total profit
            </p>
            <p className="mt-2 text-lg font-semibold text-success">
              {balanceVisible ? <Money value={totalProfit} /> : "••••••"}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">Lifetime earnings</p>
          </div>
        </div>
      </motion.div>

      {/* Private banking summary */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Portfolio health
            </div>
            <span className="text-xs font-semibold text-success">On track</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {totalInvested > 0 ? "Balanced growth" : "Ready to invest"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Your account is protected with secure transaction monitoring.
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
          </div>
        </div>

      </motion.div>

      {/* Quick actions — bottom sheets */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        <ActionSheet
          label={t("common.deposit")}
          icon={<ArrowDownToLine className="h-5 w-5" />}
          title={t("common.deposit")}
          description="Fund your account with Mobile Money or bank transfer. Funds appear once approved."
          to="/dashboard/deposit"
          cta={t("common.deposit")}
          primary
        />
        <ActionSheet
          label="Transfer"
          icon={<Send className="h-5 w-5" />}
          title="Transfer funds"
          description="Send funds securely to another Fidelity Invest user by email."
          to="/dashboard/wallet"
          cta="Open wallet"
        />
        <ActionSheet
          label={t("common.withdraw")}
          icon={<ArrowUpFromLine className="h-5 w-5" />}
          title={t("common.withdraw")}
          description="Minimum withdrawal is 250 XAF. Payouts are processed within 10 minutes."
          to="/dashboard/withdraw"
          cta={t("common.withdraw")}
        />
      </motion.div>

      {/* Investment allocation */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Investment weight
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              Portfolio allocation
            </h2>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="mt-5 space-y-4">
          {investments.length === 0 ? (
            <div className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              Your allocation will appear after you activate an investment plan.
            </div>
          ) : (
            investments.slice(0, 3).map((inv, index) => {
              const share = totalInvested ? (Number(inv.amount) / totalInvested) * 100 : 0;
              return (
                <div key={inv.id}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">
                      {inv.plans?.name ?? "Investment plan"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">{Math.round(share)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${index === 0 ? "bg-primary" : index === 1 ? "bg-accent" : "bg-success"}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Referral card */}
      <motion.div variants={itemVariants}>
        <ReferralCard
          code={profile?.referral_code ?? null}
          earnings={Number(profile?.referral_earnings ?? 0)}
          count={referralCount}
        />
      </motion.div>

      {/* Active investments with progress */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg text-primary">Active investments</h2>
        </div>
        {investments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No active plan yet.{" "}
            <Link to="/dashboard/invest" className="font-medium text-primary underline">
              Start investing
            </Link>
          </div>
        ) : (
          investments.map((inv) => <InvestmentCard key={inv.id} inv={inv} />)
        )}
      </motion.div>
    </motion.div>
  );
}

function InvestmentCard({ inv }: { inv: ActiveInvestment }) {
  const start = new Date(inv.start_date).getTime();
  const end = new Date(inv.end_date).getTime();
  const progress = Math.max(
    0,
    Math.min(100, ((Date.now() - start) / Math.max(1, end - start)) * 100),
  );

  return (
    <motion.div whileTap={{ scale: 0.99 }} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-base text-primary">
            {inv.plans?.name ?? "Investment plan"}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            <Money value={Number(inv.amount)} /> ·{" "}
            <span className="text-success">
              <Money value={Number(inv.total_earned)} />
            </span>{" "}
            earned
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            inv.is_paused ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"
          }`}
        >
          {inv.is_paused ? "Paused" : "Running"}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Investment progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Started {formatDate(inv.start_date)}</span>
          <span>Ends {formatDate(inv.end_date)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ActionSheet({
  label,
  icon,
  title,
  description,
  to,
  cta,
  primary,
}: {
  label: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={`flex h-12 flex-row items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition active:scale-95 ${
            primary
              ? "bg-primary text-primary-foreground shadow-elegant"
              : "border border-border bg-card text-foreground"
          }`}
        >
          {icon} {label}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-primary">{title}</SheetTitle>
        </SheetHeader>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <Button asChild size="lg" className="mt-4 w-full rounded-xl">
          <Link to={to as never}>
            {cta} <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}

function ReferralCard({
  code,
  earnings,
  count,
}: {
  code: string | null;
  earnings: number;
  count: number;
}) {
  const link = useMemo(
    () =>
      code && typeof window !== "undefined"
        ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}`
        : "",
    [code],
  );
  const share = async () => {
    if (!link) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Join me on Fidelity", url: link });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied");
  };
  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Copied");
  };
  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-5">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg text-primary">Refer &amp; earn</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Earn commission on every profit your invitees make.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-3 w-3" /> Total referrals
          </div>
          <div className="mt-1 font-display text-xl font-bold uppercase tabular-nums text-primary">
            {count}
          </div>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Commissions
          </div>
          <div className="mt-1 font-display text-xl text-success">
            <Money value={earnings} />
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-border bg-secondary/50 p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Your referral link
        </div>
        <div className="mt-1 truncate font-mono text-xs">{link || "—"}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={copy} disabled={!link}>
          <Copy className="mr-1 h-4 w-4" /> Copy
        </Button>
        <Button
          size="sm"
          onClick={share}
          disabled={!link}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          <Share2 className="mr-1 h-4 w-4" /> Share
        </Button>
      </div>
      <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
        <Link to="/dashboard/referrals">
          <Users className="mr-1 h-4 w-4" /> My referrals
        </Link>
      </Button>
    </div>
  );
}
