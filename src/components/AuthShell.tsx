import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/hooks/useI18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SocialProof } from "@/components/SocialProof";
import { BrandLogo } from "@/components/BrandLogo";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen max-w-7xl md:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground md:flex md:flex-col md:justify-between lg:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-primary-foreground/10" />
          <div className="relative flex items-center gap-3">
            <BrandLogo className="h-12" />
          </div>
          <div className="relative max-w-md">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/60">
              Secure investing, made simple
            </p>
            <h2 className="font-display text-5xl leading-[1.05] lg:text-6xl">
              {t("auth.heroLine1")}{" "}
              <em className="not-italic text-accent">{t("auth.heroLine2")}</em>.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-6 text-primary-foreground/75">
              {t("auth.heroSub")}
            </p>
          </div>
          <p className="relative text-xs text-primary-foreground/50">
            © Fidelity 2026 · Your financial journey starts here.
          </p>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 md:px-12 lg:px-20">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center justify-between">
              <Link to="/login" className="inline-flex items-center">
                <BrandLogo className="h-10" />
              </Link>
              <div className="ml-auto">
                <LanguageToggle />
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-elegant sm:p-9">
              {children}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> Protected account access
            </div>
          </div>
        </main>
      </div>
      <SocialProof />
    </div>
  );
}
