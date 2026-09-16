import { Link } from "@tanstack/react-router";
import { useI18n } from "@/hooks/useI18n";

export function SiteFooter() {
  const { t } = useI18n();
  // Use a fixed year on first render to avoid hydration mismatch.
  const year = 2026;
  return (
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <img src="/fidelity-logo.png" alt="Fidelity Invest" className="h-11 w-auto object-contain" />
            <p className="mt-3 text-sm opacity-80">{t("footer.tagline")}</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-90">
              {t("footer.platform")}
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link to="/plans">{t("footer.investmentPlans")}</Link>
              </li>
              <li>
                <Link to="/about">{t("footer.aboutUs")}</Link>
              </li>
              <li>
                <Link to="/contact">{t("footer.contact")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-90">
              {t("footer.account")}
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link to="/login">{t("nav.signin")}</Link>
              </li>
              <li>
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-90">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>{t("footer.location")}</li>
              <li>support@safegrowinvest.com</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs opacity-60">
          © {year} Fidelity. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
