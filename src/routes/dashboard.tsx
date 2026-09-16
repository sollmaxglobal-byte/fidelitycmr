import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home,
  TrendingUp,
  Wallet,
  User,
  ShieldCheck,
  Menu,
  Info,
  Phone,
  Layers,
  FileText,
  LogOut,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { SocialProof } from "@/components/SocialProof";
import { PushSetup } from "@/components/PushSetup";
import { isStandalone } from "@/lib/push-client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

type NavKey = "nav.home" | "nav.invest" | "nav.wallet" | "nav.profile";
type NavItem = { to: string; label: NavKey; icon: typeof Home; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "nav.home", icon: Home, exact: true },
  { to: "/dashboard/invest", label: "nav.invest", icon: TrendingUp },
  { to: "/dashboard/wallet", label: "nav.wallet", icon: Wallet },
  { to: "/dashboard/profile", label: "nav.profile", icon: User },
];

const SITE_MENU = [
  { to: "/", label: "Home", icon: Home },
  { to: "/plans", label: "Investment plans", icon: Layers },
  { to: "/about", label: "About us", icon: Info },
  { to: "/contact", label: "Contact", icon: Phone },
];

function DashboardLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [appMode, setAppMode] = useState(false);

  useEffect(() => {
    const standalone = isStandalone();
    setAppMode(standalone);
    if (standalone) document.documentElement.classList.add("app-standalone");
    return () => document.documentElement.classList.remove("app-standalone");
  }, []);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path.startsWith(to));

  return (
    <div
      className={`app-shell min-h-screen bg-background pb-24 md:pb-0 ${appMode ? "app-shell-standalone" : ""}`}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="app-header mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:block">
              Private wealth
            </span>
            <Link to="/" className="flex items-center">
              <img
                src="/fidelity-dashboard-logo.png"
                alt="Fidelity Invest"
                className="h-9 w-[150px] object-contain object-left sm:h-10 sm:w-[170px]"
              />
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Open notifications"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <Bell className="h-4 w-4" />
            </Button>
            <LanguageToggle />
            <ThemeToggle />
            {isAdmin && (
              <Button size="sm" variant="ghost" onClick={() => nav({ to: "/admin" })}>
                {t("nav.admin")}
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Open site menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="font-display text-primary">Site menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col gap-1">
                  {(appMode ? [] : SITE_MENU).map((m) => (
                    <SheetClose asChild key={m.to}>
                      <Link
                        to={m.to as never}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
                      >
                        <m.icon className="h-4 w-4 text-primary" />
                        {m.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <div className="my-2 h-px bg-border" />
                  <div className="px-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Account
                  </div>
                  {NAV.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to as never}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
                      >
                        <item.icon className="h-4 w-4 text-primary" />
                        {t(item.label)}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      to="/dashboard/deposit"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      Make a deposit
                    </Link>
                  </SheetClose>
                  <div className="my-2 h-px bg-border" />
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="app-content mx-auto flex max-w-6xl gap-6 px-3 py-4 sm:px-4 md:py-6">
        {/* Side nav (desktop) */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-20 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item.to, item.exact);
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) — app-style with active pill */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className="flex flex-col items-center justify-center gap-1 py-2 active:scale-95 transition-transform"
              >
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-elegant"
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </span>
                <span
                  className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {t(item.label)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <PushSetup />
      <SocialProof />
    </div>
  );
}
