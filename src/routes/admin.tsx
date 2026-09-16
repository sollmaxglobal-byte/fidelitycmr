import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Settings,
  Wallet,
  ShieldCheck,
  LogOut,
  Menu,
  Cog,
  TrendingUp,
  Mail,
  BellRing,
  MessageSquareText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine },
  { to: "/admin/sms", label: "Forwarded SMS", icon: MessageSquareText },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine },
  { to: "/admin/investments", label: "Investments", icon: TrendingUp },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/plans", label: "Plans", icon: Wallet },
  { to: "/admin/methods", label: "Payment methods", icon: Settings },
  { to: "/admin/emails", label: "Email templates", icon: Mail },
  { to: "/admin/push", label: "Push notifications", icon: BellRing },
  { to: "/admin/settings", label: "Site settings", icon: Cog },
];

function AdminLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    else if (!loading && user && !isAdmin) nav({ to: "/dashboard" });
  }, [user, loading, isAdmin, nav]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>
    );
  }

  const isActive = (to: string, exact?: boolean) => (exact ? path === to : path.startsWith(to));
  const current = NAV.find((n) => isActive(n.to, n.exact)) ?? NAV[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-sidebar-foreground hover:bg-white/10 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-border bg-sidebar p-4 text-sidebar-foreground">
                  <SheetTitle className="flex items-center gap-2 text-gold">
                    <ShieldCheck className="h-5 w-5" /> Admin menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-3">
                  {NAV.map((item) => {
                    const active = isActive(item.to, item.exact);
                    return (
                      <Link
                        key={item.to}
                        to={item.to as never}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="my-2 h-px bg-border" />
                  <button
                    onClick={() => {
                      setOpen(false);
                      nav({ to: "/dashboard" });
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4" /> My account
                  </button>
                  <button
                    onClick={async () => {
                      setOpen(false);
                      await signOut();
                      nav({ to: "/" });
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-xl text-gold leading-none">Fidelity</div>
                <div className="text-[10px] uppercase tracking-wider opacity-70">Admin Console</div>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              size="sm"
              variant="ghost"
              className="text-sidebar-foreground hover:bg-white/10"
              onClick={() => nav({ to: "/dashboard" })}
            >
              My account
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-sidebar-foreground hover:bg-white/10"
              onClick={async () => {
                await signOut();
                nav({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Sign out</span>
            </Button>
          </div>

          <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gold md:hidden">
            {current.label}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
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
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
