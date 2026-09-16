import { formatXAF } from "@/lib/format";

export type TxNotification = { title: string; body: string; url: string; tag?: string };

/** Short, native-app style push templates for transaction updates. */
export type AdminRequestNotification = {
  subject: string;
  text: string;
  variables: Record<string, string>;
};

export const adminRequestNotification = {
  deposit: (input: {
    name: string;
    email: string;
    amount: string;
    method: string;
    transactionId: string;
    reviewUrl: string;
  }): AdminRequestNotification => ({
    subject: `New deposit request · ${input.amount}`,
    text: `A new deposit request requires review.\n\nInvestor: ${input.name}\nEmail: ${input.email}\nAmount: ${input.amount}\nMethod: ${input.method}\nReference: ${input.transactionId}\nReview: ${input.reviewUrl}`,
    variables: { ...input },
  }),
  withdrawal: (input: {
    name: string;
    email: string;
    amount: string;
    method: string;
    account: string;
    transactionId: string;
    reviewUrl: string;
  }): AdminRequestNotification => ({
    subject: `New withdrawal request · ${input.amount}`,
    text: `A new withdrawal request requires review.\n\nInvestor: ${input.name}\nEmail: ${input.email}\nAmount: ${input.amount}\nMethod: ${input.method}\nAccount: ${input.account}\nReference: ${input.transactionId}\nReview: ${input.reviewUrl}`,
    variables: { ...input },
  }),
};

export const adminSmsTemplates = {
  en: {
    deposit:
      "Fidelity: New deposit request from {{name}} for {{amount}} via {{method}}. Ref {{transaction_id}}. Review: {{review_url}}",
    withdrawal:
      "Fidelity: New withdrawal request from {{name}} for {{amount}} via {{method}}. Ref {{transaction_id}}. Review: {{review_url}}",
  },
  fr: {
    deposit:
      "Fidelity : Nouvelle demande de dépôt de {{name}} pour {{amount}} via {{method}}. Réf. {{transaction_id}}. Vérifier : {{review_url}}",
    withdrawal:
      "Fidelity : Nouvelle demande de retrait de {{name}} pour {{amount}} via {{method}}. Réf. {{transaction_id}}. Vérifier : {{review_url}}",
  },
};

export const txNotification = {
  depositApproved: (amount: number): TxNotification => ({
    title: "Deposit successful",
    body: `Your deposit of ${formatXAF(amount)} has been approved and added to your balance.`,
    url: "/dashboard/wallet",
    tag: "deposit",
  }),
  depositRejected: (amount: number): TxNotification => ({
    title: "Deposit rejected",
    body: `Your deposit of ${formatXAF(amount)} could not be verified. Please try again.`,
    url: "/dashboard/wallet",
    tag: "deposit",
  }),
  withdrawalApproved: (amount: number): TxNotification => ({
    title: "Withdrawal approved",
    body: `Your withdrawal of ${formatXAF(amount)} has been approved and is being processed.`,
    url: "/dashboard/wallet",
    tag: "withdrawal",
  }),
  withdrawalPaid: (amount: number): TxNotification => ({
    title: "Withdrawal paid",
    body: `Your withdrawal of ${formatXAF(amount)} has been sent to your account.`,
    url: "/dashboard/wallet",
    tag: "withdrawal",
  }),
  withdrawalRejected: (amount: number): TxNotification => ({
    title: "Withdrawal rejected",
    body: `Your withdrawal of ${formatXAF(amount)} was rejected and the funds were returned to your balance.`,
    url: "/dashboard/wallet",
    tag: "withdrawal",
  }),
};
