import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatXAF } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

type Stats = {
  users: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeInvestments: number;
  totalDeposited: number;
  totalWithdrawn: number;
};

function AdminOverview() {
  const [s, setS] = useState<Stats>({
    users: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activeInvestments: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
  });

  useEffect(() => {
    (async () => {
      const [u, pd, pw, ai, td, tw] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("deposits")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("withdrawals")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("investments")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.from("deposits").select("amount").eq("status", "approved"),
        supabase.from("withdrawals").select("amount").in("status", ["approved", "paid"]),
      ]);
      const failed = [u, pd, pw, ai, td, tw].find((result) => result.error);
      if (failed?.error) {
        console.error("[v0] Failed to load admin overview", failed.error);
        toast.error(`Unable to load admin overview: ${failed.error.message}`);
        return;
      }
      setS({
        users: u.count ?? 0,
        pendingDeposits: pd.count ?? 0,
        pendingWithdrawals: pw.count ?? 0,
        activeInvestments: ai.count ?? 0,
        totalDeposited: (td.data ?? []).reduce((a, r) => a + Number(r.amount), 0),
        totalWithdrawn: (tw.data ?? []).reduce((a, r) => a + Number(r.amount), 0),
      });
    })();
  }, []);

  const cards = [
    { i: Users, l: "Total users", v: String(s.users) },
    { i: TrendingUp, l: "Active investments", v: String(s.activeInvestments) },
    {
      i: Clock,
      l: "Pending deposits",
      v: String(s.pendingDeposits),
      accent: s.pendingDeposits > 0,
    },
    {
      i: Clock,
      l: "Pending withdrawals",
      v: String(s.pendingWithdrawals),
      accent: s.pendingWithdrawals > 0,
    },
    { i: ArrowDownToLine, l: "Total deposited", v: formatXAF(s.totalDeposited) },
    { i: ArrowUpFromLine, l: "Total withdrawn", v: formatXAF(s.totalWithdrawn) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary md:text-4xl">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live status of the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.l}
            className={`rounded-2xl border p-5 ${c.accent ? "border-warning bg-warning/5" : "border-border bg-card"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.l}</span>
              <c.i className={`h-4 w-4 ${c.accent ? "text-warning" : "text-muted-foreground"}`} />
            </div>
            <div className="mt-3 font-display text-3xl text-primary">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Wallet className="h-4 w-4" /> Net platform position
        </div>
        <div className="mt-2 font-display text-2xl text-primary">
          {formatXAF(s.totalDeposited - s.totalWithdrawn)}
        </div>
      </div>
    </div>
  );
}
