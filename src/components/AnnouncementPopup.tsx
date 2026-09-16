import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Announcement = {
  announcement_enabled: boolean | null;
  announcement_title: string | null;
  announcement_message: string | null;
  announcement_link: string | null;
  announcement_link_label: string | null;
  announcement_version: number | null;
};

/**
 * Site-wide popup that admins edit from Admin → Settings → Popup notification.
 * Dismissal is remembered per announcement version, so bumping the version
 * (saving a new message) shows it again to everyone.
 */
export function AnnouncementPopup() {
  const [a, setA] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select(
            "announcement_enabled,announcement_title,announcement_message,announcement_link,announcement_link_label,announcement_version",
          )
          .eq("id", 1)
          .maybeSingle();
        if (error || cancelled || !data) return;
        const row = data as unknown as Announcement;
        if (!row.announcement_enabled || !row.announcement_message) return;
        const key = `fidelity-announcement-${row.announcement_version ?? 1}`;
        if (typeof window !== "undefined" && localStorage.getItem(key) === "seen") return;
        setA(row);
        setOpen(true);
      } catch {
        /* announcement is non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    if (a && typeof window !== "undefined") {
      localStorage.setItem(`fidelity-announcement-${a.announcement_version ?? 1}`, "seen");
    }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && a && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant"
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-xl text-primary">
              {a.announcement_title || "Announcement"}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {a.announcement_message}
            </p>
            <div className="mt-5 grid gap-2">
              {a.announcement_link ? (
                <a
                  href={a.announcement_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  {a.announcement_link_label || "Open link"}
                </a>
              ) : null}
              <Button variant="ghost" size="sm" onClick={dismiss}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
