import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loads the SendPulse live chat widget site-wide.
 * - Preferred: paste the full embed HTML snippet into app_settings.sendpulse_embed_html
 * - Fallback: store just the chat ID in app_settings.sendpulse_chat_id
 */
export function SendPulseLoader() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id = "";
      let embedHtml = "";
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("sendpulse_chat_id, sendpulse_embed_html")
          .eq("id", 1)
          .maybeSingle();
        const row = (data ?? {}) as { sendpulse_chat_id?: string; sendpulse_embed_html?: string };
        id = (row.sendpulse_chat_id ?? "").replace(/^["'\s]+|["'\s]+$/g, "").trim();
        embedHtml = (row.sendpulse_embed_html ?? "").trim();
      } catch {
        return;
      }
      if (cancelled) return;
      if (document.getElementById("sendpulse-livechat-script")) return;

      // 1) Full embed snippet from SendPulse — most reliable
      if (embedHtml) {
        const wrap = document.createElement("div");
        wrap.id = "sendpulse-livechat-script";
        wrap.style.display = "contents";
        wrap.innerHTML = embedHtml;
        // Re-create script tags so the browser executes them
        wrap.querySelectorAll("script").forEach((old) => {
          const s = document.createElement("script");
          for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value);
          s.text = old.text;
          old.replaceWith(s);
        });
        document.body.appendChild(wrap);
        return;
      }

      // 2) Fallback: build loader from chat ID
      if (!id) return;
      const s = document.createElement("script");
      s.id = "sendpulse-livechat-script";
      s.src = "https://livechatv2.pulse.is/live-chat-loader-prod-iframe/loader.js";
      s.async = true;
      s.setAttribute("data-live-chat-id", id);
      document.body.appendChild(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
