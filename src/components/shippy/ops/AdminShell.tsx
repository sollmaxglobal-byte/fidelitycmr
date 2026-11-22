import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  PackagePlus,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTab =
  | "dashboard"
  | "shipments"
  | "new-shipment"
  | "customers"
  | "deposits"
  | "emails"
  | "managers"
  | "payments"
  | "settings";

export const ADMIN_TABS: AdminTab[] = [
  "dashboard",
  "shipments",
  "new-shipment",
  "customers",
  "deposits",
  "emails",
  "managers",
  "payments",
  "settings",
];

type NavItem = { id: AdminTab; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "shipments", label: "Manage Shipments", icon: Package },
      { id: "new-shipment", label: "Create New Shipment", icon: PackagePlus },
      { id: "customers", label: "Customers", icon: Users },
      { id: "deposits", label: "Shipment Deposits", icon: Wallet },
      { id: "emails", label: "Email Services", icon: Mail },
    ],
  },
  {
    label: "Administrators",
    items: [{ id: "managers", label: "Manage Admin(s)", icon: ShieldCheck }],
  },
  {
    label: "Settings",
    items: [
      { id: "settings", label: "App Settings", icon: Settings2 },
      { id: "payments", label: "Payment Settings", icon: CreditCard },
    ],
  },
];

const allItems = NAV.flatMap((group) => group.items);

export function AdminShell({
  active,
  onNavigate,
  onSignOut,
  websiteName,
  logoUrl,
  adminName,
  adminEmail,
  children,
}: {
  active: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  onSignOut: () => void;
  websiteName: string;
  logoUrl?: string;
  adminName: string;
  adminEmail: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const activeItem = allItems.find((item) => item.id === active) ?? allItems[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={websiteName}
              className="h-11 w-11 rounded-lg bg-white object-contain p-1"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Truck className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-white">{websiteName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Admin Console
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                      active === item.id
                        ? "bg-blue-600 text-white shadow"
                        : "text-slate-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" /> View website
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg border border-slate-300 p-2 text-slate-600 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                {websiteName}
              </p>
              <h1 className="truncate text-lg font-bold text-slate-900">{activeItem.label}</h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{adminName}</p>
                <p className="text-xs text-slate-500">{adminEmail}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {(adminName || adminEmail || "A").slice(0, 1).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-50"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
