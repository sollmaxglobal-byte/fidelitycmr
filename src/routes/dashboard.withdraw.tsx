import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { sendEmail } from "@/lib/email-client";
import { notifyAdminOfRequest, requestName } from "@/lib/admin-request-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatXAF, formatDate, txRef } from "@/lib/format";
import { StatusBadge } from "./dashboard.deposit";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/withdraw")({
  component: WithdrawPage,
});

type WMethod = {
  id: string;
  type: "mobile_money" | "bank_transfer" | "crypto";
  label: string;
  instructions: string | null;
};

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  account_name: string;
  account_number: string;
  status: string;
  created_at: string;
};
type PayoutAccount = {
  id: string;
  method: WMethod["type"];
  account_name: string;
  account_number: string;
  is_default: boolean;
};

const schema = z.object({
  amount: z.number().min(250, "Minimum 250 XAF").max(50_000_000),
  method: z.enum(["mobile_money", "bank_transfer", "crypto"]),
  account_name: z.string().min(2).max(120),
  account_number: z.string().min(4).max(120),
});

function WithdrawPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [list, setList] = useState<Withdrawal[]>([]);
  const [methods, setMethods] = useState<WMethod[]>([]);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<z.infer<typeof schema> | null>(null);
  const [pin, setPin] = useState("");

  async function refresh() {
    if (!user) return;
    const [{ data: p }, { data: w }] = await Promise.all([
      supabase.from("profiles").select("balance").eq("id", user.id).maybeSingle(),
      supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setBalance(Number(p?.balance ?? 0));
    setList((w as Withdrawal[]) ?? []);
    const { data: payoutAccounts } = await supabase
      .from("payout_accounts")
      .select("id,method,account_name,account_number,is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    setAccounts((payoutAccounts as PayoutAccount[]) ?? []);
  }
  useEffect(() => {
    refresh();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("id,type,label,instructions")
        .eq("active", true)
        .in("scope", ["withdrawal", "both"])
        .order("type");
      setMethods((data as WMethod[]) ?? []);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const v = schema.parse({
        amount: Number(fd.get("amount")),
        method: fd.get("method") as never,
        account_name: String(fd.get("account_name") ?? ""),
        account_number: String(fd.get("account_number") ?? ""),
      });
      if (v.amount > balance) throw new Error(t("withdraw.errExceed"));
      const { data: canWithdraw, error: eligibilityError } = await supabase.rpc("can_withdraw", {
        _user_id: user.id,
      });
      if (eligibilityError) throw eligibilityError;
      if (!canWithdraw)
        throw new Error(
          "Withdrawals are unavailable for this account. An active investment may be required.",
        );
      setPending(v);
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : (err as Error).message;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function confirmWithdrawal() {
    if (!user || !pending || !/^\d{6}$/.test(pin)) return toast.error("Enter your 6-digit PIN");
    setBusy(true);
    try {
      const { data: newId, error } = await supabase.rpc("create_withdrawal", {
        _amount: pending.amount, _method: pending.method, _account_name: pending.account_name,
        _account_number: pending.account_number, _pin: pin,
      } as never);
      if (error) throw error;
      const withdrawalId = newId as unknown as string;
      void notifyAdminOfRequest("withdrawal", { id: withdrawalId, name: requestName(user), email: user.email ?? "Not provided", amount: formatXAF(pending.amount), method: pending.method.replace("_", " "), account: `${pending.account_name} (${pending.account_number})` });
      toast.success(t("withdraw.submitted"));
      setPending(null); setPin("");
      navigate({ to: "/dashboard/wallet", search: { filter: "Withdrawals" } as never });
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary md:text-4xl">{t("withdraw.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("withdraw.subtitle")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-2 text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("withdraw.available")}
          </div>
          <div className="font-display text-xl text-primary">{formatXAF(balance)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          ⏱
        </span>
        <div>
          <div className="font-medium text-primary">
            Estimated processing time: up to 10 minutes
          </div>
          <div className="text-xs text-muted-foreground">
            Once approved, funds are sent to your account within 10 minutes maximum.
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2"
      >
        <div>
          <Label htmlFor="amount">{t("common.amount")}</Label>
          <Input id="amount" name="amount" type="number" min={250} step={1} required />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum withdrawal: 250 XAF — any amount above is allowed.
          </p>
        </div>
        <div>
          <Label htmlFor="method">{t("common.method")}</Label>
          <select
            id="method"
            name="method"
            required
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {methods.length > 0 ? (
              methods.map((m) => (
                <option key={m.id} value={m.type}>
                  {m.label}
                </option>
              ))
            ) : (
              <>
                <option value="mobile_money">{t("withdraw.method.mobile")}</option>
                <option value="bank_transfer">{t("withdraw.method.bank")}</option>
                <option value="crypto">{t("withdraw.method.crypto")}</option>
              </>
            )}
          </select>
        </div>
        {accounts.length > 0 && (
          <div className="md:col-span-2">
            <Label htmlFor="saved_account">Saved payout account</Label>
            <select
              id="saved_account"
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
              onChange={(e) => {
                const account = accounts.find((item) => item.id === e.target.value);
                if (!account) return;
                const form = e.currentTarget.form;
                if (!form) return;
                (form.elements.namedItem("method") as HTMLSelectElement).value = account.method;
                (form.elements.namedItem("account_name") as HTMLInputElement).value =
                  account.account_name;
                (form.elements.namedItem("account_number") as HTMLInputElement).value =
                  account.account_number;
              }}
            >
              <option value="">Choose a saved account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name} · {account.account_number}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label htmlFor="account_name">{t("withdraw.accountName")}</Label>
          <Input id="account_name" name="account_name" required maxLength={120} />
        </div>
        <div>
          <Label htmlFor="account_number">{t("withdraw.accountNumber")}</Label>
          <Input id="account_number" name="account_number" required maxLength={120} />
        </div>
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground hover:opacity-90 md:w-auto"
          >
            {busy ? t("deposit.submitting") : t("withdraw.submit")}
          </Button>
        </div>
      </form>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open && !busy) { setPending(null); setPin(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm withdrawal</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Enter your 6-digit PIN to confirm {pending ? formatXAF(pending.amount) : ""} withdrawal.</p>
          <Input value={pin} onChange={(e) => setPin(e.target.value.replace(/\\D/g, "").slice(0, 6))} inputMode="numeric" type="password" autoComplete="off" placeholder="6-digit PIN" aria-label="Withdrawal PIN" />
          <DialogFooter><Button variant="outline" type="button" onClick={() => { setPending(null); setPin(""); }}>Cancel</Button><Button type="button" onClick={confirmWithdrawal} disabled={busy || pin.length !== 6}>{busy ? "Confirming…" : "Confirm withdrawal"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="mb-3 font-display text-xl text-primary">{t("withdraw.recent")}</h2>
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("withdraw.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-4 py-2">{formatDate(w.created_at)}</td>
                    <td className="px-4 py-2 capitalize">{w.method.replace("_", " ")}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatXAF(w.amount)}</td>
                    <td className="px-4 py-2 text-right">
                      <StatusBadge status={w.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
