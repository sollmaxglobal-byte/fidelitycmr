import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { registerPushWorker } from "@/lib/push-client";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "fidelity-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return true;
  const displayModes = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];
  const matched = displayModes.some((m) => window.matchMedia(`(display-mode: ${m})`).matches);
  const iosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return matched || iosStandalone;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOS =
    navigator.platform === "MacIntel" &&
    (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1;
  return iOS || iPadOS;
}

interface AppInstallActionProps {
  compact?: boolean;
}

export function AppInstallAction({ compact = false }: AppInstallActionProps) {
  const { lang } = useI18n();
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void registerPushWorker().catch((error) =>
      console.warn("[v0] Service worker registration failed", error),
    );
    if (isStandalone()) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (isIos()) setShowIosHint(true);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
      return;
    }

    // Browsers only expose the native install sheet after the app is installable.
    // Give users an actionable fallback instead of silently doing nothing.
    window.alert(
      lang === "fr"
        ? "Ouvrez ce site dans Chrome, puis utilisez le menu ⋮ → Installer l’application."
        : "Open this site in Chrome, then use the ⋮ menu → Install app.",
    );
  };

  if (!mounted) return null;
  if (isStandalone()) return null;
  return (
    <Button
      type="button"
      variant={compact ? "outline" : "default"}
      className={compact ? "w-full" : ""}
      onClick={
        showIosHint
          ? () =>
              window.alert(
                lang === "fr"
                  ? "Dans Safari, appuyez sur Partager puis Sur l’écran d’accueil."
                  : "In Safari, tap Share, then Add to Home Screen.",
              )
          : install
      }
      aria-label={showIosHint ? "How to install Fidelity" : "Install Fidelity app"}
    >
      {showIosHint ? (
        <Share className="mr-2 h-4 w-4" aria-hidden />
      ) : (
        <Download className="mr-2 h-4 w-4" aria-hidden />
      )}
      {showIosHint
        ? lang === "fr"
          ? "Partager → écran d’accueil"
          : "Share → Add to Home Screen"
        : lang === "fr"
          ? "Installer l’application"
          : "Download app"}
    </Button>
  );
}

export function AppInstallPrompt() {
  const { lang } = useI18n();
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Register the worker on every supported visit so installability and push events work
    // even before the user opts into notifications.
    void registerPushWorker().catch((error) => {
      console.warn("[v0] Service worker registration failed", error);
    });

    // Never show inside the installed app, or once the user dismissed / installed it.
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Chrome / Edge / Samsung (Android + desktop)
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
      setDismissed(false);
    };
    // Fired by the browser once the PWA is actually installed
    const onInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "1");
      setPrompt(null);
      setShowIosHint(false);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iPhone / iPad Safari has no beforeinstallprompt — show manual instructions.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      timer = setTimeout(() => {
        setShowIosHint(true);
        setDismissed(false);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!mounted || dismissed || (!prompt && !showIosHint)) return null;

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") localStorage.setItem(DISMISS_KEY, "1");
    setPrompt(null);
    setDismissed(true);
  };

  return (
    <aside className="fixed inset-x-3 bottom-20 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-elegant md:bottom-5">
      <img
        src="/fidelity-app-icon-192.png"
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          {lang === "fr" ? "Installer Fidelity" : "Install Fidelity"}
        </p>
        <p className="text-xs font-medium text-muted-foreground">
          {showIosHint
            ? lang === "fr"
              ? "Appuyez sur Partager puis « Sur l’écran d’accueil »."
              : "Tap Share, then “Add to Home Screen”."
            : lang === "fr"
              ? "Accédez rapidement à votre compte depuis votre écran d’accueil."
              : "Open your account quickly from your home screen."}
        </p>
      </div>
      {showIosHint ? (
        <Share className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      ) : (
        <Button
          size="icon"
          aria-label={lang === "fr" ? "Installer l’application" : "Install app"}
          onClick={install}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        aria-label={lang === "fr" ? "Fermer" : "Dismiss"}
        onClick={close}
      >
        <X className="h-4 w-4" />
      </Button>
    </aside>
  );
}
