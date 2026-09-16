import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";
import { AppInstallAction } from "@/components/AppInstallPrompt";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Fidelity" },
      {
        name: "description",
        content: "Sign in to your Fidelity dashboard to track deposits, plans and payouts.",
      },
      { property: "og:title", content: "Sign in — Fidelity" },
      { property: "og:description", content: "Access your Fidelity account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function LoginPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const v = loginSchema.parse({ email: fd.get("email"), password: fd.get("password") });
      const { error } = await supabase.auth.signInWithPassword({
        email: v.email,
        password: v.password,
      });
      if (error) throw error;
      toast.success(t("auth.welcomeToast"));
    } catch (err) {
      const msg = err instanceof z.ZodError
        ? err.issues[0]?.message ?? "Enter a valid email and password."
        : (err as { message?: string }).message ?? "Unable to sign in. Please try again.";
      const normalized = msg.toLowerCase();
      const friendly = normalized.includes("invalid login credentials")
        ? "Email or password is incorrect. Check both fields and try again."
        : normalized.includes("email not confirmed")
          ? "Please confirm your email address before signing in."
          : normalized.includes("rate limit")
            ? "Too many attempts. Please wait a moment and try again."
            : normalized.includes("missing supabase")
              ? "Sign-in is temporarily unavailable. Please try again shortly."
              : msg;
      toast.error(friendly);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Welcome back
        </p>
        <h1 className="font-display text-4xl leading-tight text-foreground">
          {t("auth.welcomeBack")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("auth.signInSub")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-primary text-primary-foreground hover:opacity-90"
        >
          {busy ? t("common.pleaseWait") : t("auth.signIn")}
        </Button>
      </form>

      <div className="mt-6">
        <AppInstallAction compact />
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="font-medium text-primary underline underline-offset-4">
          {t("auth.registerLink")}
        </Link>
      </div>
    </AuthShell>
  );
}
