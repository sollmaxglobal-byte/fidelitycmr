import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { AdminShell, ADMIN_TABS, type AdminTab } from "@/components/shippy/ops/AdminShell";
import { AdminDashboardTab } from "@/components/shippy/ops/AdminDashboardTab";
import { AdminShipmentsTab } from "@/components/shippy/ops/AdminShipmentsTab";
import { AdminCustomersTab } from "@/components/shippy/ops/AdminCustomersTab";
import { AdminDepositsTab } from "@/components/shippy/ops/AdminDepositsTab";
import { AdminEmailsTab } from "@/components/shippy/ops/AdminEmailsTab";
import { AdminManagersTab } from "@/components/shippy/ops/AdminManagersTab";
import { AdminPaymentsTab } from "@/components/shippy/ops/AdminPaymentsTab";
import { AdminAppSettingsTab } from "@/components/shippy/ops/AdminAppSettingsTab";
import { OpsLoginCard, type OpsSession } from "@/components/shippy/ops/OpsLoginCard";
import { OpsNewShipmentTab } from "@/components/shippy/ops/OpsNewShipmentTab";
import { getSiteBranding } from "@/lib/shippy-admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Console — Shippy Express" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

const TOKEN_KEY = "shippy_ops_token";
const PROFILE_KEY = "shippy_ops_profile";

const isTab = (value: string): value is AdminTab => ADMIN_TABS.includes(value as AdminTab);

function tabFromHash(): AdminTab {
  if (typeof window === "undefined") return "dashboard";
  const hash = window.location.hash.replace("#", "");
  return isTab(hash) ? hash : "dashboard";
}

function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<OpsSession | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<AdminTab>(tabFromHash);
  const [branding, setBranding] = useState({
    websiteName: "Shippy Express",
    logoUrl: "",
  });

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
    const rawProfile = localStorage.getItem(PROFILE_KEY);
    if (rawProfile) {
      try {
        setProfile(JSON.parse(rawProfile) as OpsSession);
      } catch {
        localStorage.removeItem(PROFILE_KEY);
      }
    }
    setReady(true);

    getSiteBranding()
      .then((data) => setBranding({ websiteName: data.websiteName, logoUrl: data.logoUrl }))
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((next: AdminTab) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${next}`);
    }
  }, []);

  const signIn = useCallback((session: OpsSession) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(session));
    setToken(session.token);
    setProfile(session);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setToken(null);
    setProfile(null);
    setTab("dashboard");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#dashboard");
    }
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-300">
        Loading admin console…
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-14">
          <div className="flex items-center gap-3 text-white">
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.websiteName}
                className="h-12 w-12 rounded-xl bg-white object-contain p-1"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Truck className="h-6 w-6" />
              </span>
            )}
            <div>
              <p className="text-xl font-bold">{branding.websiteName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                Admin Console
              </p>
            </div>
          </div>
        </div>
        <OpsLoginCard onSignedIn={signIn} />
      </div>
    );
  }

  return (
    <AdminShell
      active={tab}
      onNavigate={navigate}
      onSignOut={signOut}
      websiteName={branding.websiteName}
      logoUrl={branding.logoUrl}
      adminName={profile?.name ?? "Administrator"}
      adminEmail={profile?.email ?? ""}
    >
      {tab === "dashboard" && (
        <AdminDashboardTab token={token} onExpired={signOut} onNavigate={navigate} />
      )}
      {tab === "shipments" && (
        <AdminShipmentsTab
          token={token}
          onExpired={signOut}
          onCreate={() => navigate("new-shipment")}
        />
      )}
      {tab === "new-shipment" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create new shipment</h2>
            <p className="mt-1 text-sm text-slate-500">
              Register a consignment so its tracking number works on the public site.
            </p>
          </div>
          <OpsNewShipmentTab token={token} onExpired={signOut} />
        </div>
      )}
      {tab === "customers" && <AdminCustomersTab token={token} onExpired={signOut} />}
      {tab === "deposits" && <AdminDepositsTab token={token} onExpired={signOut} />}
      {tab === "emails" && <AdminEmailsTab token={token} onExpired={signOut} />}
      {tab === "managers" && <AdminManagersTab token={token} onExpired={signOut} />}
      {tab === "payments" && <AdminPaymentsTab token={token} onExpired={signOut} />}
      {tab === "settings" && (
        <AdminAppSettingsTab
          token={token}
          onExpired={signOut}
          onToken={(next) => {
            localStorage.setItem(TOKEN_KEY, next);
            setToken(next);
          }}
          onBranding={setBranding}
        />
      )}
    </AdminShell>
  );
}
