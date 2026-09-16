import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { formatXAF } from "@/lib/format";

type StatusRow = { id: string; user_id: string; amount: number; status: string };

export function TransactionNotifications() {
  const { user } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [latest, setLatest] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const { lang } = useI18n();
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    if (!user) return;

    if ("Notification" in window) setPermission(Notification.permission);
    else setPermission("unsupported");

    const notify = (kind: "deposit" | "withdrawal", row: StatusRow) => {
      const fr = langRef.current === "fr";
      const type = kind === "deposit" ? (fr ? "Dépôt" : "Deposit") : fr ? "Retrait" : "Withdrawal";
      const status =
        row.status === "approved" || row.status === "paid"
          ? fr
            ? "approuvé"
            : "approved"
          : row.status === "rejected"
            ? fr
              ? "refusé"
              : "rejected"
            : row.status;
      const message = `${type} ${status} · ${formatXAF(row.amount)}`;
      setLatest(message);
      setUnread(true);
      toast(row.status === "rejected" ? message : message);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Fidelity", {
          body: message,
          icon: "/fidelity-app-icon-192.png",
          tag: `${kind}-${row.id}-${row.status}`,
        });
      }
    };

    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    const channel = supabase
      .channel(`transaction-alerts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deposits", filter: `user_id=eq.${user.id}` },
        (payload) => notify("deposit", payload.new as StatusRow),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "withdrawals",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => notify("withdrawal", payload.new as StatusRow),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || !path.startsWith("/dashboard")) return null;

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const next = await Notification.requestPermission();
    setPermission(next);
  };

  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.5rem)] z-40 mx-auto max-w-md md:inset-x-auto md:right-6 md:left-auto md:top-20" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-3 py-2.5 shadow-elegant backdrop-blur">
        <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${unread ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {unread ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {unread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-card" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Notifications</p>
          <p className="truncate text-xs font-medium text-foreground">{latest ?? "Your account updates will appear here"}</p>
        </div>
        {permission === "default" && <Button size="sm" variant="ghost" onClick={requestPermission} aria-label="Enable notifications"><Check className="h-4 w-4" /></Button>}
        {unread && <Button size="icon" variant="ghost" onClick={() => setUnread(false)} aria-label="Mark notification as read"><X className="h-4 w-4" /></Button>}
      </div>
    </div>
  );
}
