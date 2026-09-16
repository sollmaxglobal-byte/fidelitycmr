import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { sendEmail } from "@/lib/email-client";
import { formatXAF, formatDate, txRef } from "@/lib/format";
import { sendPushToUser } from "@/lib/push.functions";
import { txNotification } from "@/lib/notification-templates";

export const Route = createFileRoute("/admin/withdrawals")({
  component: AdminWithdrawals,
});

type W = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  account_name: string;
  account_number: string;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

function AdminWithdrawals() {
  const [filter, setFilter] = useState<"pending" | "approved" | "paid" | "rejected" | "all">(
    "pending",
  );
  const [list, setList] = useState<W[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    let q = supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    const rows = (data ?? []) as unknown as W[];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name,phone")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => {
        r.profiles = (map.get(r.user_id) as never) ?? null;
      });
    }
    setList(rows);
  }
  useEffect(() => {
    load();
  }, [filter]);

  async function review(w: W, status: "approved" | "rejected" | "paid") {
    setBusy(w.id);
    try {
      if (status === "rejected") {
        // Atomic: marks rejected and refunds the held amount exactly once.
        const { error } = await supabase.rpc("reject_withdrawal", { _id: w.id } as never);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("withdrawals")
          .update({
            status,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", w.id);
        if (error) throw error;
        // Funds were already held when the user submitted; just log it once.
        if (w.status === "pending") {
          await supabase.from("transactions").insert({
            user_id: w.user_id,
            type: "withdrawal",
            amount: -Number(w.amount),
            description: `Withdrawal ${status} (${w.method})`,
            ref_id: w.id,
          });
        }
      }

      void sendPushToUser({
        data: {
          userId: w.user_id,
          ...(status === "rejected"
            ? txNotification.withdrawalRejected(Number(w.amount))
            : status === "paid"
              ? txNotification.withdrawalPaid(Number(w.amount))
              : txNotification.withdrawalApproved(Number(w.amount))),
        },
      }).catch(() => {});

      const key =
        status === "rejected"
          ? "withdrawal_rejected"
          : status === "paid"
            ? "withdrawal_paid"
            : "withdrawal_approved";
      sendEmail({
        to: `user_id:${w.user_id}`,
        template_key: key,
        variables: {
          name: w.profiles?.full_name ?? "Investor",
          amount: Number(w.amount).toLocaleString("fr-CM"),
          transaction_id: txRef(w.id),
          method: w.method.replace("_", " "),
          account: `${w.account_name} (${w.account_number})`,
          account_name: w.account_name,
          account_number: w.account_number,

          status,
          date: new Date().toLocaleString(),
          note:
            status === "rejected"
              ? "Request could not be processed. Funds returned to your wallet."
              : "",
        },
      });
      toast.success(`Withdrawal ${status}`);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary md:text-4xl">Withdrawals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review user withdrawal requests.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {(["pending", "approved", "paid", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No withdrawals.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((w) => (
            <div key={w.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl text-primary">{formatXAF(w.amount)}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {w.profiles?.full_name ?? "User"} • {w.profiles?.phone ?? "—"} •{" "}
                    {formatDate(w.created_at)}
                  </div>
                  <div className="mt-2 text-sm capitalize">
                    <span className="text-muted-foreground">Method:</span>{" "}
                    {w.method.replace("_", " ")}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Pay to:</span> {w.account_name} —{" "}
                    <span className="font-mono">{w.account_number}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {w.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        disabled={busy === w.id}
                        onClick={() => review(w, "approved")}
                        className="bg-success text-white hover:opacity-90"
                      >
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === w.id}
                        onClick={() => review(w, "rejected")}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                  {w.status === "approved" && (
                    <Button
                      size="sm"
                      disabled={busy === w.id}
                      onClick={() => review(w, "paid")}
                      className="bg-primary text-primary-foreground hover:opacity-90"
                    >
                      Mark as paid
                    </Button>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      w.status === "paid" || w.status === "approved"
                        ? "bg-success/15 text-success"
                        : w.status === "rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
