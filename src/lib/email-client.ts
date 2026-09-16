import { supabase } from "@/integrations/supabase/client";

type Vars = Record<string, string | number | null | undefined>;

function currentLang(): "en" | "fr" {
  try {
    return (localStorage.getItem("safegrow-lang") as "en" | "fr" | null) ?? "en";
  } catch {
    return "en";
  }
}

/** Fire-and-forget email send. Logs failures silently to console. */
export async function sendEmail(opts: {
  to: string;
  template_key: string;
  variables?: Vars;
  lang?: "en" | "fr";
}) {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { ...opts, lang: opts.lang ?? currentLang() },
    });
    if (error) console.warn("[email] send failed:", error.message);
  } catch (e) {
    console.warn("[email] send threw:", e);
  }
}
