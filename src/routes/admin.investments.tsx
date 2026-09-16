import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pause, Play, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatXAF, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/investments")({
  component: AdminInvestments,
});

type Row = {
  id: string;
  user_id: string;
  amount: number;
  daily_roi_percent: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;
  total_earned: number;
  is_paused: boolean;
  plans: { name: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

function AdminInvestments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("investments")
      .select("*, plans(name), profiles!investments_user_id_fkey(full_name,phone)")
      .order("start_date", { ascending: false })
      .limit(200);
    // The FK label may differ; fall back to manual join if needed
    if (data) {
      setRows(data as unknown as Row[]);
      return;
    }
    const { data: invs } = await supabase
      .from("investments")
      .select("*, plans(name)")
      .order("start_date", { ascending: false })
      .limit(200);
    const ids = Array.from(new Set((invs ?? []).map((i) => i.user_id)));
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,full_name,phone")
      .in("id", ids);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    setRows(
      (invs ?? []).map(
        (i) =>
          ({
            ...i,
            profiles: map.get(i.user_id) ?? null,
          }) as unknown as Row,
      ),
    );
  }
  useEffect(() => {
    load();
  }, []);

  async function togglePause(r: Row) {
    setBusy(true);
    const { error } = await supabase
      .from("investments")
      .update({ is_paused: !r.is_paused })
      .eq("id", r.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(r.is_paused ? "Investment resumed" : "Investment suspended");
    load();
  }

  async function runDistribution() {
    setBusy(true);
    const { error } = await supabase.rpc("distribute_profits" as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profit distribution executed");
    load();
  }

  const filtered = rows.filter(
    (r) =>
      !q ||
      (r.profiles?.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.profiles?.phone ?? "").includes(q) ||
      (r.plans?.name ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary md:text-4xl">Investments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} total — suspend or resume any active plan.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search user or plan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button
            onClick={runDistribution}
            disabled={busy}
            variant="outline"
            title="Manually run profit distribution"
          >
            <PlayCircle className="mr-1 h-4 w-4" /> Run payouts
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg text-primary">
                    {r.plans?.name ?? "Plan"}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      r.status === "active"
                        ? "bg-success/15 text-success"
                        : r.status === "completed"
                          ? "bg-muted text-foreground/70"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.is_paused && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">
                      Suspended
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.profiles?.full_name ?? "—"} · {r.profiles?.phone ?? "—"} · ends{" "}
                  {formatDate(r.end_date)}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Invested</div>
                    <div className="font-medium">{formatXAF(r.amount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Earned</div>
                    <div className="font-medium text-success">{formatXAF(r.total_earned)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ROI/day</div>
                    <div className="font-medium">{r.daily_roi_percent}%</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.status === "active" && (
                  <Button
                    size="sm"
                    variant={r.is_paused ? "default" : "outline"}
                    disabled={busy}
                    onClick={() => togglePause(r)}
                  >
                    {r.is_paused ? (
                      <>
                        <Play className="mr-1 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-1 h-4 w-4" />
                        Suspend
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No investments yet.
          </div>
        )}
      </div>
    </div>
  );
}
