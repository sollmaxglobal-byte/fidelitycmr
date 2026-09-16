import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/format";

export const Route = createFileRoute("/dashboard/invest")({
  component: InvestPage,
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
  payout_frequency: "daily" | "weekly" | "monthly" | "end_of_term";
  amount_type: "range" | "fixed";
  fixed_amount: number;
};

const POPULAR = "Growth Plan";

function InvestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: prof }] = await Promise.all([
        supabase.from("plans").select("*").eq("active", true).order("min_amount"),
        supabase.from("profiles").select("balance").eq("id", user.id).maybeSingle(),
      ]);
      setPlans((p as Plan[]) ?? []);
      setBalance(Number(prof?.balance ?? 0));
    })();
  }, [user]);

  function openPlan(p: Plan) {
    const amount = Number(p.amount_type === "fixed" ? p.fixed_amount : p.min_amount);
    navigate({
      to: "/invest/confirm/$planId",
      params: { planId: p.id },
      search: { amount },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-primary md:text-3xl">Investment plans</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Capital + profit paid at end of term.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-3 py-1.5 text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Wallet</div>
          <div className="font-display text-base text-primary">{formatXAF(balance)}</div>
        </div>
      </div>

      <div className="space-y-4">
        {plans.map((p) => {
          const popular = p.name === POPULAR;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-5 ${
                popular ? "border-primary bg-card shadow-elegant" : "border-border bg-card"
              }`}
            >
              {popular && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Popular
                </span>
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl text-primary">{p.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-3xl text-success">
                      {p.profit_type === "fixed"
                        ? formatXAF(p.fixed_daily_profit)
                        : `${p.daily_roi_percent}%`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / day · {p.duration_days} days
                    </span>
                  </div>
                  <div className="mt-1 inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                    Paid {(p.payout_frequency ?? "daily").replace("_", " ")}
                  </div>
                </div>
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {p.amount_type === "fixed" ? (
                  <div className="col-span-2 rounded-lg bg-secondary p-2">
                    <div className="text-muted-foreground">Fixed amount</div>
                    <div className="font-medium">{formatXAF(p.fixed_amount)}</div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg bg-secondary p-2">
                      <div className="text-muted-foreground">Min</div>
                      <div className="font-medium">{formatXAF(p.min_amount)}</div>
                    </div>
                    <div className="rounded-lg bg-secondary p-2">
                      <div className="text-muted-foreground">Max</div>
                      <div className="font-medium">{formatXAF(p.max_amount)}</div>
                    </div>
                  </>
                )}
              </div>
              <Button
                onClick={() => openPlan(p)}
                className="mt-4 w-full bg-primary text-primary-foreground hover:opacity-90"
              >
                Activate
              </Button>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Profit paid {(p.payout_frequency ?? "daily").replace("_", " ")}. Investments carry
                risk.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
