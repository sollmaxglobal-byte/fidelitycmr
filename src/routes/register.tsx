import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { sendEmail } from "@/lib/email-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";
import { AppInstallAction } from "@/components/AppInstallPrompt";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Fidelity" },
      {
        name: "description",
        content: "Register a free Fidelity account in under a minute and start investing in XAF.",
      },
      { property: "og:title", content: "Create your account — Fidelity" },
      {
        property: "og:description",
        content: "Register a free Fidelity account in under a minute.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const signupSchema = z.object({
  full_name: z.string().min(2, "Enter your full name").max(80),
  phone: z.string().min(7).max(20),
  email: z.string().email(),
  password: z.string().min(1, "Enter a password").max(72),
  withdrawal_pin: z.string().regex(/^\d{6}$/, "Withdrawal PIN must be exactly 6 digits"),
  withdrawal_pin_confirm: z.string(),
}).refine((value) => value.withdrawal_pin === value.withdrawal_pin_confirm, {
  message: "Withdrawal PINs do not match",
  path: ["withdrawal_pin_confirm"],
});

function RegisterPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [refName, setRefName] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  useEffect(() => {
    let cancelled = false;
    const code = new URLSearchParams(window.location.search).get("ref")?.trim() ?? "";
    if (!code) return;

    setRefCode(code);
    supabase.rpc("referrer_name", { _code: code }).then(({ data, error }) => {
      if (cancelled || error) return;
      setRefName(typeof data === "string" && data.trim() ? data.trim() : null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const v = signupSchema.parse({
        full_name: fd.get("full_name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        password: fd.get("password"),
        withdrawal_pin: fd.get("withdrawal_pin"),
        withdrawal_pin_confirm: fd.get("withdrawal_pin_confirm"),
      });
      const { error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: v.full_name, phone: v.phone, referral_code: refCode, withdrawal_pin: v.withdrawal_pin },
        },
      });
      if (error) throw error;
      sendEmail({ to: v.email, template_key: "welcome", variables: { name: v.full_name } });
      toast.success(t("auth.created"));
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : (err as Error).message;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      {refName && (
        <div className="mb-7 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
          <UserPlus className="mt-0.5 h-4 w-4 text-success" />
          <div className="text-sm">
            <p>
              {t("auth.invitedBy")} <strong className="font-semibold uppercase">{refName}</strong>
            </p>
            <p className="text-xs text-muted-foreground">{t("auth.invitedSub")}</p>
          </div>
        </div>
      )}

      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Get started
        </p>
        <h1 className="font-display text-4xl leading-tight text-foreground">
          {t("auth.registerTitle")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("auth.signUpSub")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="full_name">{t("auth.fullName")}</Label>
          <Input id="full_name" name="full_name" required maxLength={80} />
        </div>
        <div>
          <Label htmlFor="phone">{t("auth.phone")}</Label>
          <Input id="phone" name="phone" type="tel" required placeholder="+237 6XX XXX XXX" />
        </div>
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="withdrawal_pin">Withdrawal PIN</Label>
          <Input id="withdrawal_pin" name="withdrawal_pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="off" />
          <p className="mt-1 text-xs text-muted-foreground">Use exactly 6 numbers. You will need this PIN before every withdrawal.</p>
        </div>
        <div>
          <Label htmlFor="withdrawal_pin_confirm">Confirm withdrawal PIN</Label>
          <Input id="withdrawal_pin_confirm" name="withdrawal_pin_confirm" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="off" />
        </div>
        {refCode && (
          <div>
            <Label htmlFor="ref">{t("auth.referralCode")}</Label>
            <Input id="ref" value={refCode} readOnly className="uppercase" />
          </div>
        )}
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-primary text-primary-foreground hover:opacity-90"
        >
          {busy ? t("common.pleaseWait") : t("auth.signUp")}
        </Button>
      </form>

      <div className="mt-6">
        <AppInstallAction compact />
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-primary underline underline-offset-4">
          {t("auth.loginLink")}
        </Link>
      </div>
    </AuthShell>
  );
}
