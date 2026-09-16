import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Tidio public test key. Admin can override via app_settings.tidio_public_key.
const FALLBACK_TIDIO_KEY = "xyzabc12";

/** Loads the Tidio chat widget site-wide. Uses admin-saved key if present, otherwise a test key. */
export function TidioLoader() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let key = FALLBACK_TIDIO_KEY;
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("tidio_public_key")
          .maybeSingle();
        const saved = data?.tidio_public_key?.trim();
        if (saved) key = saved;
      } catch {
        // table may be unreachable for anon — fall back to test key
      }
      if (cancelled) return;
      if (document.getElementById("tidio-script")) return;
      const s = document.createElement("script");
      s.id = "tidio-script";
      s.src = `//code.tidio.co/${key}.js`;
      s.async = true;
      document.body.appendChild(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
