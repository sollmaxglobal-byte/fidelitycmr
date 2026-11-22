import { useEffect } from "react";
import { getChatWidget } from "@/lib/shippy.functions";

/**
 * Loads the Tawk.to live chat widget on the public site.
 *
 * The property ID is managed in Admin → Settings → Live chat (Tawk.to →
 * Administration → Chat Widget). Without it the widget stays off, so the site
 * never loads a broken embed.
 */
export function ShippyChat() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      let propertyId = "";
      let widgetId = "default";
      try {
        const config = await getChatWidget();
        propertyId = config.propertyId;
        widgetId = config.widgetId;
      } catch {
        return;
      }
      if (cancelled || !propertyId) return;
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
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
