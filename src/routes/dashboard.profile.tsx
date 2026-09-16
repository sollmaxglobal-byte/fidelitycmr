import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Copy,
  LogOut,
  KeyRound,
  Share2,
  Leaf,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PushToggle } from "@/components/PushToggle";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

type Profile = {
  full_name: string | null;
  phone: string | null;
  kyc_status: string;
  referral_code: string | null;
};

type PayoutAccount = {
  id: string;
  method: "mobile_money" | "bank_transfer" | "crypto";
  account_name: string;
  account_number: string;
  is_default: boolean;
};

function ProfilePage() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [accountBusy, setAccountBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,phone,kyc_status,referral_code")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as Profile));
    supabase
      .from("payout_accounts")
      .select("id,method,account_name,account_number,is_default")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAccounts((data as PayoutAccount[]) ?? []));
  }, [user]);

  async function saveAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setAccountBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      user_id: user.id,
      method: String(fd.get("payout_method")),
      account_name: String(fd.get("payout_name")),
      account_number: String(fd.get("payout_number")),
      is_default: accounts.length === 0,
    };
    const { data, error } = await supabase
      .from("payout_accounts")
      .insert(payload)
      .select("id,method,account_name,account_number,is_default")
      .single();
    setAccountBusy(false);
    if (error) return toast.error(error.message);
    setAccounts((prev) => [data as PayoutAccount, ...prev]);
    e.currentTarget.reset();
    toast.success("Payout account added");
  }

  async function removeAccount(id: string) {
    const { error } = await supabase.from("payout_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Payout account removed");
  }

  const referralLink = profile?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${profile.referral_code}`
    : "";

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const v = z
        .object({
          password: z.string().min(8, "Min 8 characters").max(72),
        })
        .parse({ password: fd.get("password") });
      const { error } = await supabase.auth.updateUser({ password: v.password });
      if (error) throw error;
      toast.success("Password updated");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof z.ZodError ? err.issues[0].message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendPinReset(kind: "withdrawal" | "transfer") {
    if (!user?.email) return toast.error("No email address is associated with this account");
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-pin?kind=${kind}`,
    });
    if (error) return toast.error("We could not send the reset link. Please try again.");
    toast.success(`A ${kind} PIN reset link was sent to your email`);
  }

  function copyReferral() {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied");
  }
  async function shareReferral() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Fidelity",
          text: "Join me on Fidelity",
          url: referralLink,
        });
      } catch {
        /* ignore */
      }
    } else {
      copyReferral();
    }
  }

  const kycMap: Record<string, { label: string; cls: string }> = {
    not_submitted: { label: "Not submitted", cls: "bg-muted text-foreground/70" },
    pending: { label: "Pending review", cls: "bg-warning/15 text-warning" },
    verified: { label: "Verified", cls: "bg-success/15 text-success" },
    rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive" },
  };
  const kyc = kycMap[profile?.kyc_status ?? "not_submitted"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-primary md:text-3xl">Profile</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Account details, security and referrals.
        </p>
      </div>

      {/* Identity card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-lg text-primary">
              {profile?.full_name ?? "—"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Row icon={User} label="Full name" value={profile?.full_name ?? "—"} />
          <Row icon={Mail} label="Email" value={user?.email ?? "—"} />
          <Row icon={Phone} label="Phone" value={profile?.phone ?? "—"} />
        </div>
      </div>

      {/* KYC */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-display text-base text-primary">KYC verification</span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase ${kyc.cls}`}
          >
            {kyc.label}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          KYC unlocks higher withdrawal limits. Contact support to submit your documents.
        </p>
      </div>

      {/* Referral */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="font-display text-base text-primary">Refer & earn</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Share your link — earn rewards on each verified signup.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-secondary p-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-muted-foreground">Your code</div>
            <div className="truncate font-mono text-sm font-medium">
              {profile?.referral_code ?? "—"}
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={copyReferral}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={shareReferral}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="font-display text-base text-primary">Payout accounts</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Add an account where approved withdrawals should be sent.
        </p>
        <div className="mt-3 space-y-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3"
            >
              <div>
                <div className="text-sm font-medium">{account.account_name}</div>
                <div className="text-xs text-muted-foreground">
                  {account.method.replace("_", " ")} · {account.account_number}
                  {account.is_default ? " · Default" : ""}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove payout account"
                onClick={() => removeAccount(account.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <form onSubmit={saveAccount} className="mt-4 grid gap-3 md:grid-cols-3">
          <select
            name="payout_method"
            required
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="mobile_money">Mobile money</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="crypto">Crypto</option>
          </select>
          <Input name="payout_name" placeholder="Account name" required maxLength={120} />
          <Input name="payout_number" placeholder="Account number" required maxLength={120} />
          <Button type="submit" disabled={accountBusy} className="md:col-span-3">
            <Plus className="mr-2 h-4 w-4" />
            {accountBusy ? "Adding…" : "Add payout account"}
          </Button>
        </form>
      </section>

      <PushToggle />

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <span className="font-display text-base text-primary">Security PINs</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          We&apos;ll email you a secure link before either PIN can be changed.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => sendPinReset("withdrawal")}>
            Reset withdrawal PIN
          </Button>
          <Button type="button" variant="outline" onClick={() => sendPinReset("transfer")}>
            Reset transfer PIN
          </Button>
        </div>
      </section>

      {/* Change password */}
      <form onSubmit={changePassword} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <span className="font-display text-base text-primary">Change password</span>
        </div>
        <div className="mt-3">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="mt-3 w-full bg-primary text-primary-foreground hover:opacity-90"
        >
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>

      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          nav({ to: "/" });
        }}
        className="w-full border-destructive text-destructive hover:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}
