import { supabase } from "@/integrations/supabase/client";
import { adminRequestNotification } from "@/lib/notification-templates";

const fallbackReviewUrl = "/admin/deposits";

type RequestDetails = {
  id: string;
  name: string;
  email: string;
  amount: string;
  method: string;
  account?: string;
};

async function getAdminEmail() {
  const { data } = await supabase
    .from("app_settings")
    .select("admin_email")
    .eq("id", 1)
    .maybeSingle();
  return (data as { admin_email?: string | null } | null)?.admin_email?.trim() || null;
}

export async function notifyAdminOfRequest(
  type: "deposit" | "withdrawal",
  details: RequestDetails,
) {
  try {
    const to = await getAdminEmail();
    if (!to) return;

    const reviewUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${type === "deposit" ? "/admin/deposits" : "/admin/withdrawals"}`
        : fallbackReviewUrl;
    const template =
      type === "deposit"
        ? adminRequestNotification.deposit({
            name: details.name,
            email: details.email,
            amount: details.amount,
            method: details.method,
            transactionId: details.id,
            reviewUrl,
          })
        : adminRequestNotification.withdrawal({
            name: details.name,
            email: details.email,
            amount: details.amount,
            method: details.method,
            account: details.account ?? "Not provided",
            transactionId: details.id,
            reviewUrl,
          });

    const { error } = await supabase.functions.invoke("send-email", {
      body: {
        to,
        subject: template.subject,
        text: template.text,
        template_key: `admin_${type}_submitted`,
        variables: template.variables,
      },
    });
    if (error) console.warn("[admin-notification] email failed:", error.message);
  } catch (error) {
    console.warn("[admin-notification] delivery failed:", error);
  }
}

export function requestName(user: {
  user_metadata?: { full_name?: string | null };
  email?: string | null;
}) {
  return user.user_metadata?.full_name?.trim() || user.email || "Investor";
}
