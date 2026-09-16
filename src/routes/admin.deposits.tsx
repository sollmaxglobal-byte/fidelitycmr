import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/email-client";
import { sendPushToUser } from "@/lib/push.functions";
import { txNotification } from "@/lib/notification-templates";
import { ingestMmMessages, revalidateDeposit } from "@/lib/deposit-verify.functions";
import { Textarea } from "@/components/ui/textarea";

import { Button } from "@/components/ui/button";
import { formatXAF, formatDate, txRef } from "@/lib/format";

export const Route = createFileRoute("/admin/deposits")({
  component: AdminDeposits,
});

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  reference: string | null;
  proof_url: string | null;
  status: string;
  created_at: string;
  payment_methods: { label: string } | null;
  ocr_txn_id: string | null;
  ocr_amount: number | null;
  auto_note: string | null;
  matched_message_id: string | null;
  auto_approved_at: string | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

function AdminDeposits() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [list, setList] = useState<Deposit[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [smsText, setSmsText] = useState("");
  const [smsBusy, setSmsBusy] = useState(false);

  async function submitSms() {
    if (smsText.trim().length < 10) {
      toast.error("Paste the operator confirmation message");
      return;
    }
    setSmsBusy(true);
    try {
      const res = await ingestMmMessages({ data: { text: smsText } });
      const approved = res.results.filter((r) => r.matched).length;
      toast.success(
        approved
          ? `${approved} deposit(s) auto-approved`
          : (res.results[0]?.reason ?? "Message stored"),
      );
      setSmsText("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSmsBusy(false);
    }
  }

  async function recheck(id: string) {
    setBusy(id);
    try {
      const res = await revalidateDeposit({ data: { depositId: id } });
      toast[res.approved ? "success" : "message"](res.reason);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function load() {
    let q = supabase
      .from("deposits")
      .select("*, payment_methods(label)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    const rows = (data ?? []) as unknown as Deposit[];
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

  async function review(d: Deposit, status: "approved" | "rejected") {
    setBusy(d.id);
    try {
      const { error } = await supabase
        .from("deposits")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", d.id);
      if (error) throw error;

      if (status === "approved") {
        const { data: prof } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", d.user_id)
          .single();
        await supabase
          .from("profiles")
          .update({
            balance: Number(prof?.balance ?? 0) + Number(d.amount),
          })
          .eq("id", d.user_id);
        await supabase.from("transactions").insert({
          user_id: d.user_id,
          type: "deposit",
          amount: Number(d.amount),
          description: `Deposit approved (${d.payment_methods?.label ?? ""})`,
          ref_id: d.id,
        });
      }
      void sendPushToUser({
        data: {
          userId: d.user_id,
          ...(status === "approved"
            ? txNotification.depositApproved(Number(d.amount))
            : txNotification.depositRejected(Number(d.amount))),
        },
      }).catch(() => {});

      // Notify user (edge function looks up email server-side via user_id)
      sendEmail({
        to: `user_id:${d.user_id}`,
        template_key: status === "approved" ? "deposit_approved" : "deposit_rejected",
        variables: {
          name: d.profiles?.full_name ?? "Investor",
          amount: Number(d.amount).toLocaleString("fr-CM"),
          transaction_id: txRef(d.id),
          method: d.payment_methods?.label ?? "",
          date: new Date().toLocaleString(),
          note: status === "rejected" ? "Could not verify payment" : "",
        },
      });
      toast.success(`Deposit ${status}`);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function viewProof(path: string) {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast.error("Could not load proof");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary md:text-4xl">Deposits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve incoming deposits.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
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

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-primary">Mobile money messages</h2>
        <p className="text-xs text-muted-foreground">
          Paste one or more operator confirmation messages (separate them with a blank line).
          Deposits auto-approve when the transaction ID and amount match.
        </p>
        <Textarea
          rows={4}
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          placeholder="You have received 5,000 FCFA from 6XXXXXXXX. Transaction ID: 1234567890"
        />
        <Button size="sm" disabled={smsBusy} onClick={submitSms}>
          {smsBusy ? "Matching…" : "Match messages"}
        </Button>
      </section>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No deposits.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-xl text-primary">{formatXAF(d.amount)}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {d.profiles?.full_name ?? "User"} • {d.profiles?.phone ?? "—"} •{" "}
                    {formatDate(d.created_at)}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Method:</span>{" "}
                    {d.payment_methods?.label ?? "—"}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ref:</span>{" "}
                    <span className="font-mono">{d.reference ?? "—"}</span>
                  </div>
                  <div className="mt-2 rounded-lg bg-secondary p-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          d.auto_approved_at
                            ? "bg-success/15 text-success"
                            : d.auto_note?.toLowerCase().includes("mismatch")
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {d.auto_approved_at
                          ? "Auto-approved"
                          : d.auto_note?.toLowerCase().includes("mismatch")
                            ? "Mismatch"
                            : "Awaiting message"}
                      </span>
                      <span className="text-muted-foreground">
                        Read: <span className="font-mono">{d.ocr_txn_id ?? "—"}</span>
                        {d.ocr_amount != null
                          ? ` • ${Number(d.ocr_amount).toLocaleString("fr-CM")} XAF`
                          : ""}
                      </span>
                    </div>
                    {d.auto_note && <div className="mt-1 text-muted-foreground">{d.auto_note}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {d.proof_url && (
                    <Button size="sm" variant="outline" onClick={() => viewProof(d.proof_url!)}>
                      <Eye className="mr-1 h-4 w-4" /> Proof
                    </Button>
                  )}
                  {d.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === d.id}
                        onClick={() => recheck(d.id)}
                      >
                        Re-check
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy === d.id}
                        onClick={() => review(d, "approved")}
                        className="bg-success text-white hover:opacity-90"
                      >
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === d.id}
                        onClick={() => review(d, "rejected")}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        d.status === "approved"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {d.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
