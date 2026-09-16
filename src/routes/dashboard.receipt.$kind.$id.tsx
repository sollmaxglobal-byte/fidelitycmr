import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Download, ShieldCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/Money";
import { formatDate, txRef } from "@/lib/format";
import { useI18n } from "@/hooks/useI18n";

export const Route = createFileRoute("/dashboard/receipt/$kind/$id")({
  head: () => ({
    meta: [
      { title: "Transaction receipt — Fidelity" },
      {
        name: "description",
        content:
          "Official Fidelity transaction receipt with full payment details and transaction ID.",
      },
      { property: "og:title", content: "Transaction receipt — Fidelity" },
      { property: "og:description", content: "Official Fidelity transaction receipt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReceiptPage,
});

type Row = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  reference?: string | null;
  payer_phone?: string | null;
  payment_method_id?: string | null;
  method?: string | null;
  account_name?: string | null;
  account_number?: string | null;
};

function statusMeta(status: string) {
  const s = status.toLowerCase();
  if (s === "approved" || s === "paid" || s === "completed")
    return { tone: "success" as const, label: "Successful", icon: CheckCircle2 };
  if (s === "rejected" || s === "failed" || s === "cancelled")
    return { tone: "destructive" as const, label: "Rejected", icon: XCircle };
  return { tone: "warning" as const, label: "Pending", icon: Clock };
}

function ReceiptPage() {
  const { kind, id } = useParams({ from: "/dashboard/receipt/$kind/$id" });
  const { user } = useAuth();
  const { lang } = useI18n();
  const fr = lang === "fr";
  const isDeposit = kind === "deposit";
  const [row, setRow] = useState<Row | null>(null);
  const [methodLabel, setMethodLabel] = useState<string>("—");
  const [holder, setHolder] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const table = isDeposit ? "deposits" : "withdrawals";
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from(table).select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);
      setRow((r as Row) ?? null);
      setHolder(p?.full_name ?? "—");
      if (r && isDeposit && (r as Row).payment_method_id) {
        const { data: m } = await supabase
          .from("payment_methods")
          .select("label,account_name,account_number")
          .eq("id", (r as Row).payment_method_id ?? "")
          .maybeSingle();
        if (m) setMethodLabel(m.label);
      } else if (r && !isDeposit) {
        setMethodLabel(((r as Row).method as string) ?? "—");
      }
      setLoading(false);
    })();
  }, [user, id, isDeposit]);

  if (loading)
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading receipt…</div>;
  if (!row)
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Receipt not found.</p>
        <Link to="/dashboard/wallet" className="text-sm font-medium text-primary underline">
          Back to wallet
        </Link>
      </div>
    );

  const meta = statusMeta(row.status);
  const Icon = meta.icon;
  const toneBg =
    meta.tone === "success"
      ? "bg-success/15 text-success border-success/30"
      : meta.tone === "destructive"
        ? "bg-destructive/15 text-destructive border-destructive/30"
        : "bg-warning/15 text-warning border-warning/30";

  const raw: Array<[string, React.ReactNode, string | null | undefined]> = [
    [
      fr ? "Identifiant de transaction" : "Transaction ID",
      <span className="font-mono font-bold uppercase">#{txRef(row.id)}</span>,
      row.id,
    ],
    [
      fr ? "Type de transaction" : "Transaction type",
      isDeposit
        ? fr
          ? "Dépôt (Crédit)"
          : "Deposit (Credit)"
        : fr
          ? "Retrait (Débit)"
          : "Withdrawal (Debit)",
      "y",
    ],
    [fr ? "Montant" : "Amount", <Money value={Number(row.amount)} />, "y"],
    [fr ? "Statut" : "Status", meta.label, "y"],
    [fr ? "Date de soumission" : "Date submitted", formatDate(row.created_at), row.created_at],
    [
      fr ? "Date de traitement" : "Date processed",
      row.reviewed_at ? formatDate(row.reviewed_at) : "",
      row.reviewed_at,
    ],
    [fr ? "Titulaire du compte" : "Account holder", holder, holder === "—" ? null : holder],
    [
      fr ? "Moyen de paiement" : "Payment method",
      methodLabel,
      methodLabel === "—" ? null : methodLabel,
    ],
  ];
  if (isDeposit) {
    raw.push([
      fr ? "Référence du paiement" : "Payment reference",
      row.reference ?? "",
      row.reference,
    ]);
  } else {
    raw.push([
      fr ? "Nom du compte de paiement" : "Payout account name",
      row.account_name ?? "",
      row.account_name,
    ]);
    raw.push([
      fr ? "Numéro du compte de paiement" : "Payout account number",
      row.account_number ?? "",
      row.account_number,
    ]);
  }
  if (row.admin_note)
    raw.push([fr ? "Note de Fidelity" : "Note from Fidelity", row.admin_note, row.admin_note]);

  // Only render fields that actually have a value (no empty / placeholder rows).
  const rows: Array<[string, React.ReactNode]> = raw
    .filter(
      ([, , present]) =>
        !!present && String(present).trim() !== "" && String(present).trim() !== "—",
    )
    .map(([k, v]) => [k, v]);

  return (
    <div className="space-y-4 font-bold">
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/dashboard/wallet"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {fr ? "Retour à l\u2019historique" : "Back to history"}
        </Link>
      </div>

      <article
        id="receipt"
        className="mx-auto overflow-hidden rounded-lg border-2 border-foreground/25 bg-card font-sans font-bold shadow-elegant"
      >
        {/* Big status notification */}
        <div
          className={`print-banner flex items-center gap-3 border-b-2 px-5 py-4 ${toneBg}`}
          data-status={meta.tone}
        >
          <Icon className="h-8 w-8 shrink-0" />
          <div>
            <div className="text-lg font-black uppercase">
              {isDeposit ? (fr ? "Dépôt" : "Deposit") : fr ? "Retrait" : "Withdrawal"}{" "}
              {fr
                ? meta.tone === "success"
                  ? "réussi"
                  : meta.tone === "destructive"
                    ? "refusé"
                    : "en attente"
                : meta.label}
            </div>
            <div className="text-xs opacity-90">
              {meta.tone === "success"
                ? isDeposit
                  ? fr
                    ? "Les fonds ont été crédités sur le solde de votre compte."
                    : "Your funds have been credited to your account balance."
                  : fr
                    ? "Votre paiement a été envoyé au compte indiqué."
                    : "Your payout has been processed to your account."
                : meta.tone === "destructive"
                  ? fr
                    ? "Cette opération a été refusée. Contactez l’assistance si nécessaire."
                    : "This transaction was declined. Contact support if you need help."
                  : fr
                    ? "Cette opération est en cours de vérification."
                    : "This transaction is being reviewed. This usually takes a few minutes."}
            </div>
          </div>
        </div>

        {/* Letterhead */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-black uppercase text-primary">Fidelity</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {fr ? "Reçu officiel de transaction" : "Official transaction receipt"}
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>{fr ? "Émis le" : "Issued"}</div>
            <div className="font-bold uppercase tabular-nums text-foreground">
              {formatDate(row.reviewed_at ?? row.created_at)}
            </div>
          </div>
        </div>

        {/* Amount hero */}
        <div className="border-b-2 border-border px-5 py-4 text-center">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {fr ? "Montant" : "Amount"}
          </div>
          <div className="mt-1 text-3xl font-black">
            <Money value={Number(row.amount)} />
          </div>
        </div>

        {/* Details */}
        <div className="divide-y divide-border">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="flex items-start justify-between gap-4 px-5 py-2.5 text-sm font-bold"
            >
              <span className="font-bold text-muted-foreground">{k}</span>
              <span className="max-w-[60%] break-words text-right font-black">{v}</span>
            </div>
          ))}
        </div>

        {/* Stamp + footer */}
        <div className="relative flex items-end justify-between gap-4 px-5 py-4">
          <div className="max-w-[62%] space-y-2 text-[10px] font-bold leading-relaxed text-muted-foreground">
            <p>
              {fr
                ? "Ce reçu généré par ordinateur constitue un justificatif officiel de l’opération indiquée. Conservez l’identifiant pour toute demande d’assistance."
                : "This computer-generated receipt is an official record of the transaction above. Keep the transaction ID for any support enquiry."}
            </p>
            <div>
              <div className="mb-1 h-6 w-36 border-b border-foreground/40" />
              <span className="text-[9px] uppercase tracking-widest">
                {fr ? "Signature autorisée · Fidelity" : "Authorised signature · Fidelity"}
              </span>
            </div>
          </div>
          <div className="print-stamp relative h-24 w-24 shrink-0">
            <div className="absolute inset-0 -rotate-12 rounded-full border-4 border-success/60 text-success">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-success/40 text-center">
                <span className="text-[9px] font-bold uppercase tracking-widest">Fidelity</span>
                <ShieldCheck className="my-0.5 h-5 w-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  {fr ? "Vérifié" : "Verified"}
                </span>
                <span className="mt-0.5 text-[7px] font-bold uppercase tabular-nums">
                  #{txRef(row.id)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-border px-5 py-2.5 text-center text-[9px] font-black uppercase text-muted-foreground">
          {fr
            ? "Fidelity · Douala, Cameroun · Ce document est valable sans signature manuscrite"
            : "Fidelity · Douala, Cameroon · This document is valid without a handwritten signature"}
        </div>
      </article>

      <Button
        className="w-full print:hidden"
        onClick={() => {
          if (typeof window !== "undefined") window.print();
        }}
      >
        <Download className="mr-2 h-4 w-4" /> {fr ? "Télécharger le reçu" : "Download receipt"}
      </Button>
    </div>
  );
}
