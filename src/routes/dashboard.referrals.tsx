import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Money } from "@/components/Money";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/referrals")({
  head: () => ({
    meta: [
      { title: "My referrals — Fidelity" },
      {
        name: "description",
        content:
          "Track everyone you referred to Fidelity and the investment plan they are running.",
      },
      { property: "og:title", content: "My referrals — Fidelity" },
      {
        property: "og:description",
        content: "See your referral team and their active investment plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReferralsPage,
});

type Referral = {
  user_id: string;
  full_name: string | null;
  joined_at: string | null;
  plan_name: string | null;
  invested: number | null;
  investment_status: string | null;
};

function ReferralsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any).rpc("my_referrals");
      if (err) setError(err.message);
      setRows((data as Referral[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const active = rows.filter((r) => r.investment_status === "active").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="px-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl text-primary md:text-3xl">My referrals</h1>
          <p className="text-xs text-muted-foreground">Everyone who joined with your link.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Users className="h-3 w-3" /> Total referrals
          </div>
          <div className="mt-1 font-display text-2xl font-bold uppercase tabular-nums text-primary">
            {rows.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            With active plan
          </div>
          <div className="mt-1 font-display text-2xl font-bold uppercase tabular-nums text-success">
            {active}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No referrals yet. Share your referral link from the dashboard to start earning.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <motion.div
              key={r.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base text-primary">
                    {r.full_name || "Member"}
                  </div>
                  {r.joined_at && (
                    <div className="text-xs text-muted-foreground">
                      Joined {formatDate(r.joined_at)}
                    </div>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase ${
                    r.investment_status === "active"
                      ? "bg-success/15 text-success"
                      : "bg-muted text-foreground/70"
                  }`}
                >
                  {r.investment_status === "active" ? "Active" : "No plan"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Investment plan
                  </div>
                  <div className="text-sm font-semibold">{r.plan_name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Invested
                  </div>
                  <div className="text-sm font-bold uppercase tabular-nums text-success">
                    {r.invested ? <Money value={Number(r.invested)} /> : "—"}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
