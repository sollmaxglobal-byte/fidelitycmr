import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { enablePush, pushEnabled, pushSupported, registerPushWorker } from "@/lib/push-client";

const DISMISS_KEY = "fidelity_push_prompt_dismissed";

export function PushSetup() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !pushSupported()) return;
    let cancelled = false;
    (async () => {
      await registerPushWorker();
      const already = await pushEnabled();
      if (cancelled) return;
      if (already) {
        // Re-sync the browser subscription with the current user and server key.
        await enablePush();
        return;
      }
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      if (Notification.permission === "denied") return;
      setShow(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!show) return null;
  const fr = lang === "fr";

  const turnOn = async () => {
    setBusy(true);
    try {
      const result = await enablePush();
      if (result === "enabled") {
        toast.success(fr ? "Notifications activées" : "Notifications enabled");
        setShow(false);
      } else if (result === "denied") {
        toast.error(fr ? "Notifications refusées" : "Notifications blocked");
        setShow(false);
      }
    } catch {
      toast.error(fr ? "Impossible d’activer les notifications" : "Could not enable notifications");
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed inset-x-3 top-3 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3 shadow-elegant">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Bell className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{fr ? "Alertes de transaction" : "Transaction alerts"}</p>
        <p className="text-xs text-muted-foreground">
          {fr
            ? "Recevez une notification dès qu’un dépôt ou retrait est traité."
            : "Get notified the moment a deposit or withdrawal is processed."}
        </p>
      </div>
      <Button size="sm" onClick={turnOn} disabled={busy}>
        {fr ? "Activer" : "Enable"}
      </Button>
      <Button size="icon" variant="ghost" onClick={dismiss} aria-label={fr ? "Fermer" : "Dismiss"}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
