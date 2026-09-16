import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Smartphone, Building2, Bitcoin, Copy, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import { CheckoutShell } from "@/components/CheckoutShell";
import { formatXAF } from "@/lib/format";

const searchSchema = z.object({
  amount: z.coerce.number().min(1000),
  method: z.string().uuid(),
});

export const Route = createFileRoute("/deposit-payment")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Complete your payment — Fidelity" },
      {
        name: "description",
        content: "Send your deposit to the Fidelity payment account and confirm the transfer.",
      },
      { property: "og:title", content: "Complete your payment — Fidelity" },
      { property: "og:description", content: "Send your deposit to the Fidelity payment account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DepositPaymentPage,
});

type PaymentMethod = {
  id: string;
  type: "mobile_money" | "bank_transfer" | "crypto";
  label: string;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
};

const ICONS = { mobile_money: Smartphone, bank_transfer: Building2, crypto: Bitcoin };

function DepositPaymentPage() {
  const { amount, method } = Route.useSearch();
  const { t } = useI18n();
  const [sel, setSel] = useState<PaymentMethod | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("id", method)
        .maybeSingle();
      setSel(data as PaymentMethod | null);
    })();
  }, [method]);

  const Icon = sel ? ICONS[sel.type] : Smartphone;

  return (
    <div className="min-h-screen bg-[#101014] text-[#f8f7f2] py-4"><CheckoutShell step={2} total={3} title={t("deposit.payTitle")} subtitle={t("deposit.paySub")}>
      {!sel ? (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <>
          <div className="rounded-2xl bg-hero p-6 text-primary-foreground shadow-elegant">
            <div className="text-[10px] uppercase tracking-widest opacity-80">
              {t("deposit.amountToSend")}
            </div>
            <div className="mt-1 font-display text-3xl font-bold uppercase tabular-nums">
              {formatXAF(amount)}
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("deposit.sendTo")}
                </div>
                <div className="font-semibold text-foreground">{sel.label}</div>
              </div>
            </div>

            <div className="space-y-2">
              {sel.account_name && (
                <CopyRow
                  label={t("deposit.accountName")}
                  value={sel.account_name}
                  copied={t("common.copied")}
                />
              )}
              {sel.account_number && (
                <CopyRow
                  label={t("deposit.accountNumber")}
                  value={sel.account_number}
                  copied={t("common.copied")}
                />
              )}
            </div>

            {sel.instructions && (
              <div className="rounded-xl bg-secondary p-4 text-sm leading-relaxed">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {t("deposit.instructions")}
                </div>
                {sel.instructions}
              </div>
            )}

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${confirmed ? "border-success bg-success/10" : "border-border bg-background"}`}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm leading-relaxed text-foreground">
                {t("deposit.iConfirmPaid")}{" "}
                <span className="font-bold uppercase">{formatXAF(amount)}</span>
              </span>
            </label>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
            <div className="mx-auto flex max-w-xl gap-2">
              <Button asChild variant="outline" className="h-11 flex-1">
                <Link to="/dashboard/deposit">
                  <ArrowLeft className="mr-1 h-4 w-4" /> {t("common.back")}
                </Link>
              </Button>
              <Button
                asChild={confirmed}
                disabled={!confirmed}
                className="h-11 flex-[2] bg-primary text-primary-foreground"
              >
                {confirmed ? (
                  <Link to="/deposit-proof" search={{ amount, method }}>
                    {t("common.continue")} <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                ) : (
                  <span>{t("deposit.tickConfirm")}</span>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </CheckoutShell></div>
  );
}

function CopyRow({ label, value, copied }: { label: string; value: string; copied: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-background p-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-base font-semibold">{value}</div>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success(copied);
        }}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}
