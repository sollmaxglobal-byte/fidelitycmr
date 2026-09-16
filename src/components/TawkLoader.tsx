import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loads the Tawk.to live chat widget site-wide.
 * Tawk.to is a professional live chat that natively supports file uploads
 * from visitors (images, PDFs, docs, etc.).
 *
 * Admins configure it in Admin → Settings → Live chat.
 * Property ID + Widget ID come from Tawk.to → Administration → Chat Widget.
 */
export function TawkLoader() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let propertyId = "";
      let widgetId = "default";
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("tawk_property_id, tawk_widget_id")
          .eq("id", 1)
          .maybeSingle();
        const row = (data ?? {}) as { tawk_property_id?: string; tawk_widget_id?: string };
        propertyId = (row.tawk_property_id ?? "").trim();
        widgetId = (row.tawk_widget_id ?? "").trim() || "default";
      } catch {
        return;
      }
      if (cancelled || !propertyId) return;
      if (document.getElementById("tawk-livechat-script")) return;

      // Standard Tawk.to embed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as unknown as Record<string, any>;
      w.Tawk_API = w.Tawk_API || {};
      w.Tawk_LoadStart = new Date();

      const s = document.createElement("script");
      s.id = "tawk-livechat-script";
      s.async = true;
      s.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      s.charset = "UTF-8";
      // No crossorigin attribute: it forces a CORS fetch and Tawk only sends
      // CORS headers for whitelisted domains, which breaks local/preview loads.
      s.onerror = () => {
        /* chat widget unavailable — fail silently */
      };
      document.body.appendChild(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
