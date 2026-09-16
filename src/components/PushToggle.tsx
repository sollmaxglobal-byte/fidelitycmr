import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { disablePush, enablePush, pushEnabled, pushSupported } from "@/lib/push-client";

export function PushToggle() {
  const { lang } = useI18n();
  const fr = lang === "fr";
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(pushSupported());
    if (!pushSupported()) return;
    void pushEnabled().then(setOn);
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (on) {
        await disablePush();
        setOn(false);
        toast.success(fr ? "Notifications désactivées" : "Notifications turned off");
      } else {
        const res = await enablePush();
        if (res === "enabled") {
          setOn(true);
          toast.success(fr ? "Notifications activées" : "Notifications turned on");
        } else if (res === "denied") {
          toast.error(
            fr
              ? "Notifications bloquées par le navigateur"
              : "Notifications blocked in your browser",
          );
        }
      }
    } catch {
      toast.error(fr ? "Action impossible" : "Could not update notifications");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {on ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-display text-base text-primary">
            {fr ? "Notifications push" : "Push notifications"}
          </span>
        </div>
        <Button
          size="sm"
          variant={on ? "outline" : "default"}
          disabled={busy || !supported}
          onClick={toggle}
        >
          {!supported
            ? fr
              ? "Non pris en charge"
              : "Unsupported"
            : on
              ? fr
                ? "Désactiver"
                : "Turn off"
              : fr
                ? "Activer"
                : "Turn on"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {fr
          ? "Recevez une alerte instantanée pour chaque dépôt, retrait et annonce."
          : "Get instant alerts for every deposit, withdrawal and announcement."}
      </p>
    </div>
  );
}
