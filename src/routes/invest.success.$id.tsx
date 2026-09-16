import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatXAF } from "@/lib/format";

export const Route = createFileRoute("/invest/success/$id")({
  head: () => ({
    meta: [
      { title: "Investment activated — Fidelity" },
      { name: "description", content: "Your investment plan was purchased successfully." },
      { property: "og:title", content: "Investment activated — Fidelity" },
      { property: "og:description", content: "Your investment plan was purchased successfully." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvestSuccess,
});

type Details = {
  amount: number;
  duration_days: number;
  end_date: string;
  start_date: string;
  plan_name: string;
  tx_id: string | null;
};

function InvestSuccess() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const [d, setD] = useState<Details | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const { data: inv } = await supabase
        .from("investments")
        .select("amount, duration_days, start_date, end_date, plan_id")
        .eq("id", id)
        .maybeSingle();
      if (inv) {
        const [{ data: plan }, { data: tx }] = await Promise.all([
          supabase.from("plans").select("name").eq("id", inv.plan_id).maybeSingle(),
          supabase
            .from("transactions")
            .select("id")
            .eq("ref_id", id)
            .eq("type", "investment")
            .maybeSingle(),
        ]);
        setD({
          amount: Number(inv.amount),
          duration_days: inv.duration_days,
          start_date: inv.start_date,
          end_date: inv.end_date,
          plan_name: plan?.name ?? "Investment plan",
          tx_id: tx?.id ?? null,
        });
      }
      setReady(true);
    })();
  }, [id, user, loading]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const ref = (d?.tx_id ?? id).replace(/-/g, "").slice(0, 12).toUpperCase();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 animate-in zoom-in items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </div>
        <h1 className="mt-4 font-display text-2xl text-primary">
          Investment plan purchased successfully
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your plan is now active and profit will be credited automatically.
        </p>

        {d && (
          <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-5 text-left text-sm">
            <Row label="Plan" value={d.plan_name} />
            <Row label="Amount invested" value={formatXAF(d.amount)} />
            <Row label="Duration" value={`${d.duration_days} days`} />
            <Row label="Start" value={new Date(d.start_date).toLocaleString()} />
            <Row label="Maturity" value={new Date(d.end_date).toLocaleString()} />
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Transaction ID</span>
              <button
                className="flex items-center gap-1 font-bold uppercase tabular-nums text-primary"
                onClick={() => {
                  navigator.clipboard.writeText(ref);
                  toast.success("Transaction ID copied");
                }}
              >
                #{ref} <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <Button asChild className="w-full bg-primary text-primary-foreground hover:opacity-90">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/dashboard/invest">View more plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold uppercase tabular-nums">{value}</span>
    </div>
  );
}
