import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, PackagePlus, Settings2 } from "lucide-react";
import { ShippyLayout } from "@/components/shippy/ShippyLayout";
import { OpsLoginCard } from "@/components/shippy/ops/OpsLoginCard";
import { OpsOverviewTab } from "@/components/shippy/ops/OpsOverviewTab";
import { OpsNewShipmentTab } from "@/components/shippy/ops/OpsNewShipmentTab";
import { OpsSettingsTab } from "@/components/shippy/ops/OpsSettingsTab";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Shippy Express" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TOKEN_KEY = "shippy_ops_token";

type Tab = "overview" | "tracking" | "settings";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tracking", label: "Add tracking", icon: PackagePlus },
  { id: "settings", label: "Settings", icon: Settings2 },
];

function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    setReady(true);
  }, []);

  const signIn = useCallback((next: string) => {
    localStorage.setItem(TOKEN_KEY, next);
    setToken(next);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTab("overview");
  }, []);

  if (!ready) {
    return (
      <ShippyLayout>
        <p className="py-20 text-center text-sm text-slate-500">Loading…</p>
      </ShippyLayout>
    );
  }

  if (!token) {
    return (
      <ShippyLayout>
        <OpsLoginCard onSignedIn={signIn} />
      </ShippyLayout>
    );
  }

  return (
    <ShippyLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shipment Operations</h1>
            <p className="mt-1 text-slate-600">
              Add tracking, publish updates and manage the site settings.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "overview" && <OpsOverviewTab token={token} onExpired={signOut} />}
          {tab === "tracking" && <OpsNewShipmentTab token={token} onExpired={signOut} />}
          {tab === "settings" && (
            <OpsSettingsTab token={token} onExpired={signOut} onToken={signIn} />
          )}
        </div>
      </section>
    </ShippyLayout>
  );
}
