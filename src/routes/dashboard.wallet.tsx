import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Sparkles,
  Send,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { formatXAF, formatDate } from "@/lib/format";
import { Money } from "@/components/Money";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const searchSchema = z.object({
  filter: z.enum(["All", "Deposits", "Withdrawals", "Profits"]).optional(),
});

export const Route = createFileRoute("/dashboard/wallet")({
  validateSearch: (s) => searchSchema.parse(s),
  component: WalletPage,
});

type Tx = {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "profit" | "investment_return" | string;
  amount: number;
  description: string | null;
  created_at: string;
};
type Pending = { id: string; amount: number; status: string; created_at: string };

const FILTERS = ["All", "Deposits", "Withdrawals", "Profits"] as const;
type Filter = (typeof FILTERS)[number];

function WalletPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const search = Route.useSearch();
  const [tx, setTx] = useState<Tx[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<Pending[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Pending[]>([]);
  const [filter, setFilter] = useState<Filter>(search.filter ?? "All");
  const [balance, setBalance] = useState(0);
  const [transferBusy, setTransferBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [transferDraft, setTransferDraft] = useState<{ email: string; amount: number; note: string | null } | null>(null);
  const [confirmPin, setConfirmPin] = useState("");

  useEffect(() => {
    if (search.filter) setFilter(search.filter);
  }, [search.filter]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: t }, { data: pd }, { data: pw }, { data: prof }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("deposits")
          .select("id,amount,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("withdrawals")
          .select("id,amount,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("profiles").select("balance").eq("id", user.id).maybeSingle(),
      ]);
      setTx((t as Tx[]) ?? []);
      setPendingDeposits((pd as Pending[]) ?? []);
      setPendingWithdrawals((pw as Pending[]) ?? []);
      setBalance(Number(prof?.balance ?? 0));
    })();
  }, [user]);

  async function submitTransferDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setPinBusy(true);
    const pin = String(new FormData(e.currentTarget).get("new_pin") ?? "");
    const { error } = await supabase.rpc("set_transfer_pin", { _pin: pin });
    setPinBusy(false);
    if (error) return toast.error(error.message);
    e.currentTarget.reset();
    toast.success("Transfer PIN saved");
  }

  async function sendTransfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setTransferBusy(true);
    const values = new FormData(e.currentTarget);
    const amount = Number(values.get("transfer_amount"));
    setTransferDraft({ email: String(values.get("recipient_email") ?? "").trim(), amount, note: String(values.get("transfer_note") ?? "").trim() || null });
    setTransferBusy(false);
  }

  // Merge deposits/withdrawals (all statuses, receipt-linked) + profit/investment transactions
  const rows = useMemo(() => {
    type Row = {
      id: string;
      kind: "deposit" | "withdrawal" | "profit" | "investment";
      amount: number;
      date: string;
      status: string;
      label: string;
      receipt?: { kind: "deposit" | "withdrawal"; id: string };
    };
    const out: Row[] = [];

    for (const t of tx) {
      if (t.type === "deposit" || t.type === "withdrawal") continue; // sourced from their own tables
      let kind: Row["kind"] = "profit";
      let label = t.description ?? "";
      if (t.type === "investment") {
        kind = "investment";
        label = label || "Investment";
      } else if (t.type === "profit" || t.type === "investment_return") {
        kind = "profit";
        label = label || "Profit";
      } else continue;
      out.push({
        id: t.id,
        kind,
        amount: Number(t.amount),
        date: t.created_at,
        status: "approved",
        label,
      });
    }
    for (const d of pendingDeposits) {
      const label =
        d.status === "pending"
          ? "Deposit submitted"
          : d.status === "rejected"
            ? "Deposit rejected"
            : "Deposit approved";
      out.push({
        id: `pd-${d.id}`,
        kind: "deposit",
        amount: Number(d.amount),
        date: d.created_at,
        status: d.status,
        label,
        receipt: { kind: "deposit", id: d.id },
      });
    }
    for (const w of pendingWithdrawals) {
      const label =
        w.status === "pending"
          ? "Withdrawal requested"
          : w.status === "rejected"
            ? "Withdrawal rejected"
            : "Withdrawal paid";
      out.push({
        id: `pw-${w.id}`,
        kind: "withdrawal",
        amount: -Number(w.amount),
        date: w.created_at,
        status: w.status,
        label,
        receipt: { kind: "withdrawal", id: w.id },
      });
    }

    out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (filter === "Deposits") return out.filter((r) => r.kind === "deposit");
    if (filter === "Withdrawals") return out.filter((r) => r.kind === "withdrawal");
    if (filter === "Profits") return out.filter((r) => r.kind === "profit");
    return out;
  }, [tx, pendingDeposits, pendingWithdrawals, filter]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-primary md:text-3xl">{t("wallet.title")}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("wallet.subtitle")}</p>
      </div>

      <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-elegant">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-90">
          {t("wallet.balance")}
        </div>
        <div className="mt-1 font-display text-3xl">
          <Money value={balance} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/dashboard/deposit"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25"
          >
            <ArrowDownToLine className="h-4 w-4" /> {t("common.deposit")}
          </Link>
          <Link
            to="/dashboard/withdraw"
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-white/90"
          >
            <ArrowUpFromLine className="h-4 w-4" /> {t("common.withdraw")}
          </Link>
        </div>
      </div>

      <section className="grid gap-5 rounded-2xl border border-border bg-card p-5 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base text-primary">Transfer funds</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Send money to another user by email. Your transfer PIN is required.
          </p>
          <form onSubmit={sendTransfer} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="recipient_email">Recipient email</Label>
              <Input
                id="recipient_email"
                name="recipient_email"
                type="email"
                required
                maxLength={254}
              />
            </div>
            <div>
              <Label htmlFor="transfer_amount">Amount</Label>
              <Input
                id="transfer_amount"
                name="transfer_amount"
                type="number"
                min="1"
                step="0.01"
                required
              />
            </div>
            <Input name="transfer_note" placeholder="Note (optional)" maxLength={160} />
            <Button type="submit" disabled={transferBusy} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              {transferBusy ? "Sending…" : "Send transfer"}
            </Button>
          </form>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base text-primary">Set transfer PIN</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a 4–6 digit PIN and keep it private.
          </p>
          <form onSubmit={submitTransferDraft} className="mt-4 flex gap-2">
            <Input
              name="new_pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              minLength={4}
              maxLength={6}
              placeholder="4–6 digits"
              required
            />
            <Button type="submit" disabled={pinBusy}>
              {pinBusy ? "Saving…" : "Save PIN"}
            </Button>
          </form>
        </div>
      </section>

      <Dialog open={Boolean(transferDraft)} onOpenChange={(open) => { if (!open && !transferBusy) { setTransferDraft(null); setConfirmPin(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm transfer</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Enter your transfer PIN to send {transferDraft ? formatXAF(transferDraft.amount) : ""}.</p>
          <Input value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\\D/g, "").slice(0, 6))} type="password" inputMode="numeric" autoComplete="off" placeholder="4–6 digit PIN" aria-label="Transfer PIN" />
          <DialogFooter><Button variant="outline" type="button" onClick={() => { setTransferDraft(null); setConfirmPin(""); }}>Cancel</Button><Button type="button" disabled={transferBusy || confirmPin.length < 4} onClick={async () => { if (!transferDraft) return; setTransferBusy(true); const { error } = await supabase.rpc("create_transfer", { _recipient_email: transferDraft.email, _amount: transferDraft.amount, _pin: confirmPin, _note: transferDraft.note }); setTransferBusy(false); if (error) return toast.error(error.message); setBalance((current) => current - transferDraft.amount); setTransferDraft(null); setConfirmPin(""); toast.success("Transfer sent securely"); }}> {transferBusy ? "Sending…" : "Confirm transfer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
        {FILTERS.map((f) => {
          const labels: Record<(typeof FILTERS)[number], string> = {
            All: t("wallet.filter.all"),
            Deposits: t("wallet.filter.deposits"),
            Withdrawals: t("wallet.filter.withdrawals"),
            Profits: t("wallet.filter.profits"),
          };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Transactions list */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("wallet.empty")}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const inner = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      r.kind === "profit"
                        ? "bg-success/15 text-success"
                        : r.kind === "deposit"
                          ? "bg-primary/10 text-primary"
                          : r.kind === "withdrawal"
                            ? "bg-warning/15 text-warning"
                            : "bg-accent/15 text-accent"
                    }`}
                  >
                    {r.kind === "profit" ? (
                      <Sparkles className="h-4 w-4" />
                    ) : r.kind === "deposit" ? (
                      <ArrowDownToLine className="h-4 w-4" />
                    ) : r.kind === "withdrawal" ? (
                      <ArrowUpFromLine className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDate(r.date)}
                      {r.receipt ? " · View receipt" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className={`text-sm font-medium ${r.amount >= 0 ? "text-success" : "text-destructive"}`}
                  >
                    {r.amount >= 0 ? "+" : "-"}
                    <Money value={Math.abs(r.amount)} />
                  </span>
                  <StatusPill status={r.status} />
                </div>
              </>
            );
            const cls =
              "flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3";
            return r.receipt ? (
              <Link
                key={r.id}
                to="/dashboard/receipt/$kind/$id"
                params={{ kind: r.receipt.kind, id: r.receipt.id }}
                className={`${cls} transition hover:border-primary/40 hover:bg-muted/40`}
              >
                {inner}
              </Link>
            ) : (
              <div key={r.id} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/15 text-success",
    paid: "bg-success/15 text-success",
    completed: "bg-success/15 text-success",
    pending: "bg-warning/15 text-warning",
    rejected: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase ${map[status] ?? "bg-muted"}`}
    >
      {status}
    </span>
  );
}
