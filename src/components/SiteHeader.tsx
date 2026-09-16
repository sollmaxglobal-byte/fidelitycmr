import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/plans", label: t("nav.plans") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-primary">
            Fidelity <span className="text-accent">Invest</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/70 transition hover:text-primary"
              activeProps={{ className: "text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" onClick={() => nav({ to: "/admin" })}>
                  {t("nav.admin")}
                </Button>
              )}
              <Button variant="ghost" onClick={() => nav({ to: "/dashboard" })}>
                {t("nav.dashboard")}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  nav({ to: "/" });
                }}
              >
                {t("nav.signout")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => nav({ to: "/login" })}>
                {t("nav.signin")}
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => nav({ to: "/login" })}
              >
                {t("nav.getStarted")}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageToggle />
          <button onClick={() => setOpen((o) => !o)} aria-label="menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        nav({ to: "/admin" });
                      }}
                    >
                      {t("nav.admin")}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setOpen(false);
                      nav({ to: "/dashboard" });
                    }}
                  >
                    {t("nav.dashboard")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await signOut();
                      setOpen(false);
                      nav({ to: "/" });
                    }}
                  >
                    {t("nav.signout")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      nav({ to: "/login" });
                    }}
                  >
                    {t("nav.signin")}
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:opacity-90"
                    onClick={() => {
                      setOpen(false);
                      nav({ to: "/login" });
                    }}
                  >
                    {t("nav.getStarted")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
