export const DEPOSIT_STATUSES = ["Pending", "Completed", "Rejected"] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

export type Deposit = {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  method: string;
  status: DepositStatus;
  createdAt: string;
  note?: string;
};

export const seedDeposits: Deposit[] = [
  {
    id: "dep_001",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "USDT",
    status: "Pending",
    createdAt: "2026-07-31T15:59:00Z",
  },
  {
    id: "dep_002",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Bitcoin",
    status: "Pending",
    createdAt: "2026-07-13T19:49:00Z",
  },
  {
    id: "dep_003",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Bitcoin",
    status: "Pending",
    createdAt: "2026-05-04T10:55:00Z",
  },
  {
    id: "dep_004",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Bitcoin",
    status: "Pending",
    createdAt: "2025-10-02T12:41:00Z",
  },
  {
    id: "dep_005",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Credit Card",
    status: "Pending",
    createdAt: "2025-09-20T20:16:00Z",
  },
  {
    id: "dep_006",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Bitcoin",
    status: "Pending",
    createdAt: "2025-09-18T06:20:00Z",
  },
  {
    id: "dep_007",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Bitcoin",
    status: "Pending",
    createdAt: "2025-09-08T17:08:00Z",
  },
  {
    id: "dep_008",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Ethereum",
    status: "Pending",
    createdAt: "2025-09-08T14:15:00Z",
  },
  {
    id: "dep_009",
    clientName: "Ofofonobs Developer (Guest)",
    clientEmail: "ofofonobs@gmail.com",
    amount: 1800,
    method: "Bitcoin",
    status: "Pending",
    createdAt: "2025-09-03T16:51:00Z",
  },
];
