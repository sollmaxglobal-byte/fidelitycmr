import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatXAF } from "@/lib/format";

const searchSchema = z.object({ amount: z.coerce.number().optional() });

export const Route = createFileRoute("/invest/confirm/$planId")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Confirm your investment — Fidelity" },
      { name: "description", content: "Review and confirm your investment plan activation." },
      { property: "og:title", content: "Confirm your investment — Fidelity" },
      {
        property: "og:description",
        content: "Review and confirm your investment plan activation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfirmInvestment,
});

type Plan = {
  id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number;
  daily_roi_percent: number;
  duration_days: number;
  profit_type: "percent" | "fixed";
  fixed_daily_profit: number;
  payout_frequency: string;
  amount_type: "range" | "fixed";
  fixed_amount: number;
};

function ConfirmInvestment() {
  const { planId } = Route.useParams();
  const { amount: amountParam } = Route.useSearch();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    (async () => {
      const [{ data: p }, { data: prof }] = await Promise.all([
        supabase.from("plans").select("*").eq("id", planId).maybeSingle(),
        supabase.from("profiles").select("balance").eq("id", user.id).maybeSingle(),
      ]);
      setPlan((p as Plan) ?? null);
      setBalance(Number(prof?.balance ?? 0));
      setReady(true);
    })();
  }, [user, loading, planId, navigate]);

  const [amountInput, setAmountInput] = useState<number | null>(null);

  useEffect(() => {
    if (plan && amountInput === null) {
      setAmountInput(
        plan.amount_type === "fixed"
          ? Number(plan.fixed_amount)
          : Number(amountParam ?? plan.min_amount),
      );
    }
  }, [plan, amountParam, amountInput]);

  const amount = plan
    ? plan.amount_type === "fixed"
      ? Number(plan.fixed_amount)
      : Number(amountInput ?? plan.min_amount)
    : 0;

  const dailyProfit = plan
    ? plan.profit_type === "fixed"
      ? Number(plan.fixed_daily_profit)
      : (amount * Number(plan.daily_roi_percent)) / 100
    : 0;
  const totalProfit = plan ? dailyProfit * plan.duration_days : 0;

  async function confirm() {
    if (!plan) return;
    setBusy(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("activate_investment_v2", {
        _plan_id: plan.id,
        _amount: amount,
      });
      if (error) throw error;
      const res = data as { investment_id: string };
      navigate({ to: "/invest/success/$id", params: { id: res.investment_id } });
    } catch (err) {
      toast.error((err as Error).message ?? "Could not activate the plan");
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="font-display text-2xl text-primary">Plan not found</h1>
          <Button className="mt-4" onClick={() => navigate({ to: "/dashboard/invest" })}>
            Back to plans
          </Button>
        </div>
      </div>
    );
  }

  const outOfRange =
    plan.amount_type !== "fixed" && (amount < plan.min_amount || amount > plan.max_amount);
  const insufficient = amount > balance;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-3 font-display text-2xl text-primary">Confirm your investment</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Review the details below before activating.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="font-display text-xl text-primary">{plan.name}</div>
          {plan.description && (
            <div className="text-xs text-muted-foreground">{plan.description}</div>
          )}

          {plan.amount_type !== "fixed" && (
            <div className="mt-4">
              <Label htmlFor="amount">Amount to invest (XAF)</Label>
              <Input
                id="amount"
                type="number"
                step={500}
                min={plan.min_amount}
                max={plan.max_amount}
                value={amountInput ?? plan.min_amount}
                onChange={(e) => setAmountInput(Number(e.target.value))}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                Min {formatXAF(plan.min_amount)} · Max {formatXAF(plan.max_amount)}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm">
            <Row label="Amount" value={formatXAF(amount)} />
            <Row label="Daily profit" value={formatXAF(dailyProfit)} accent />
            <Row label="Duration" value={`${plan.duration_days} days`} />
            <Row label="Payout" value={(plan.payout_frequency ?? "daily").replace("_", " ")} />
            <Row
              label={`Total profit (${plan.duration_days} days)`}
              value={formatXAF(totalProfit)}
              accent
            />
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className="font-bold uppercase tabular-nums">{formatXAF(balance)}</span>
            </div>
          </div>

          {insufficient && (
            <div className="mt-3 rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs">
              Your wallet balance is too low for this plan. Please make a deposit first.
            </div>
          )}

          <Button
            onClick={confirm}
            disabled={busy || insufficient || outOfRange}
            className="mt-5 w-full bg-primary text-primary-foreground hover:opacity-90"
          >
            {busy ? "Processing…" : "Confirm investment"}
          </Button>
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => navigate({ to: "/dashboard/invest" })}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold uppercase tabular-nums ${accent ? "text-success" : ""}`}>
        {value}
      </span>
    </div>
  );
}
