import { useEffect, useState } from "react";

// Keep the brand visible long enough to register, but never let it linger.
const MIN_VISIBLE_MS = 650;
const MAX_VISIBLE_MS = 2600;

/**
 * Site-wide first-load preloader.
 *
 * Rendered inside the server shell so its markup paints before hydration, then
 * fades out once the document is ready (or after MAX_VISIBLE_MS). A CSS-only
 * failsafe in styles.css also hides it if JavaScript never runs.
 */
export function SitePreloader() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (hidden) return;

    const startedAt = performance.now();
    let timer: number | undefined;

    const dismiss = () => {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (performance.now() - startedAt));
      timer = window.setTimeout(() => setHidden(true), remaining);
    };

    if (document.readyState === "complete") {
      dismiss();
    } else {
      window.addEventListener("load", dismiss, { once: true });
      // Never hold the page hostage on slow assets.
      timer = window.setTimeout(() => setHidden(true), MAX_VISIBLE_MS);
    }

    const skip = () => setHidden(true);
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });

    return () => {
      window.removeEventListener("load", dismiss);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      if (timer) window.clearTimeout(timer);
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <div id="site-preloader" role="status" aria-label="Loading Navora Logistics">
      <div className="site-preloader-inner">
        <div className="site-preloader-logo">
          <svg
            viewBox="0 0 44 44"
            aria-hidden="true"
            className="site-preloader-mark"
            width="48"
            height="48"
          >
            <rect width="44" height="44" rx="6" fill="#0F1113" />
            <path
              d="M13 31V13l18 18V13"
              fill="none"
              stroke="#2ECC71"
              strokeWidth="2.5"
              strokeLinecap="square"
            />
          </svg>
          <span className="site-preloader-word">
            <span className="site-preloader-name">Navora</span>
            <span className="site-preloader-sub">Logistics</span>
          </span>
        </div>
        <div className="site-preloader-track" aria-hidden="true">
          <span className="site-preloader-bar" />
        </div>
      </div>
    </div>
  );
}
