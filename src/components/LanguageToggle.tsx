import { useI18n, type Lang } from "@/hooks/useI18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const next: Lang = lang === "en" ? "fr" : "en";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={`Switch to ${next === "fr" ? "Français" : "English"}`}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-card px-2.5 text-xs font-semibold uppercase tracking-wider text-foreground/80 transition hover:bg-muted ${className}`}
    >
      {lang === "en" ? "EN" : "FR"}
    </button>
  );
}
