import { useEffect } from "react";
import { getChatWidget } from "@/lib/shippy.functions";

function loadTawk(propertyId: string, widgetId: string) {
  if (document.getElementById("tawk-livechat-script")) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as unknown as Record<string, any>;
  w.Tawk_API = w.Tawk_API || {};
  w.Tawk_LoadStart = new Date();

  const script = document.createElement("script");
  script.id = "tawk-livechat-script";
  script.async = true;
  script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
  script.charset = "UTF-8";
  script.onerror = () => {
    /* chat unavailable — fail silently */
  };
  document.body.appendChild(script);
}

function loadTidio(key: string) {
  if (document.getElementById("tidio-script")) return;
  const script = document.createElement("script");
  script.id = "tidio-script";
  script.async = true;
  script.src = `//code.tidio.co/${key}.js`;
  script.onerror = () => {
    /* chat unavailable — fail silently */
  };
  document.body.appendChild(script);
}

/**
 * Loads the live chat widget configured in Admin → App Settings.
 *
 * Tawk.to is preferred when a property ID is present; otherwise the Tidio
 * public key is used. Without either setting the widget stays off, so the
 * site never loads a broken embed.
 */
export function ShippyChat() {
  useEffect(() => {
    let cancelled = false;

    // Live chat belongs on the public site only, never inside the admin console.
    if (window.location.pathname.startsWith("/admin")) return;

    (async () => {
      let enabled = false;
      let propertyId = "";
      let widgetId = "default";
      let tidioKey = "";
      try {
        const config = await getChatWidget();
        enabled = config.enabled;
        propertyId = config.propertyId;
        widgetId = config.widgetId;
        tidioKey = config.tidioKey;
      } catch {
        return;
      }
      if (cancelled) return;
      if (enabled && propertyId) {
        loadTawk(propertyId, widgetId);
        return;
      }
      if (tidioKey) loadTidio(tidioKey);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
