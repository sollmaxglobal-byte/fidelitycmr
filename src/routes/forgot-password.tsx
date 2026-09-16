import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — Fidelity" },
      {
        name: "description",
        content: "Request a secure reset link to regain access to your Fidelity account.",
      },
      { property: "og:title", content: "Forgot password — Fidelity" },
      { property: "og:description", content: "Request a secure password reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({ email: z.string().email() });

function ForgotPasswordPage() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const v = schema.parse({ email: fd.get("email") });
      const { error } = await supabase.auth.resetPasswordForEmail(v.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success(t("auth.resetSent"));
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0].message : (err as Error).message;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Link
        to="/login"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> {t("auth.backToSignIn")}
      </Link>
      <h1 className="font-display text-3xl text-primary">{t("auth.forgotTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.forgotSub")}</p>

      {sent ? (
        <div className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
          {t("auth.resetSentBody")}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground hover:opacity-90"
          >
            {busy ? t("auth.sending") : t("auth.sendReset")}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
