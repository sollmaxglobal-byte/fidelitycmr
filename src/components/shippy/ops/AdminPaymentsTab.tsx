import { useEffect, useState } from "react";
import { CreditCard, Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  PAYMENT_CHARGE_TYPES,
  PAYMENT_METHOD_STATUSES,
  PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_USAGE,
  type PaymentChargeType,
  type PaymentMethodStatus,
  type PaymentMethodType,
  type PaymentMethodUsage,
  type PaymentOption,
} from "@/data/admin";
import { opsSavePaymentSettings } from "@/lib/shippy-admin.functions";
import { opsSettings } from "@/lib/shippy.functions";
import {
  AdminCard,
  AdminField,
  AdminModal,
  AdminNotice,
  LoadingBlock,
  StatusPill,
  adminBtn,
  adminBtnGhost,
  adminInput,
} from "./admin-ui";

type Settings = Awaited<ReturnType<typeof opsSettings>>;
type PaymentMethod = Settings["paymentMethods"][number];

const emptyMethod = (): PaymentMethod => ({
  id: `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  type: "currency",
  usedFor: "deposit",
  status: "enabled",
  currency: "USD ($)",
  minAmount: 10,
  maxAmount: 10000,
  charges: 0,
  chargesType: "percentage",
  imageUrl: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  swiftCode: "",
  walletAddress: "",
  network: "",
  note: "",
});

export function AdminPaymentsTab({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [options, setOptions] = useState<{
    depositOption: PaymentOption;
    withdrawalOption: PaymentOption;
    minimumDeposit: number;
  }>({ depositOption: "manual", withdrawalOption: "manual", minimumDeposit: 100 });
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await opsSettings({ data: { token } });
        if (cancelled) return;
        setSettings(data);
        setMethods(data.paymentMethods);
        setOptions({
          depositOption: data.depositOption,
          withdrawalOption: data.withdrawalOption,
          minimumDeposit: data.minimumDeposit,
        });
      } catch {
        onExpired();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onExpired]);

  if (!settings) return <LoadingBlock label="Loading payment settings…" />;

  const saveMethod = (method: PaymentMethod) => {
    setMethods((current) => {
      const exists = current.some((item) => item.id === method.id);
      return exists
        ? current.map((item) => (item.id === method.id ? method : item))
        : [...current, method];
    });
    setEditing(null);
  };

  const removeMethod = (id: string) => {
    setMethods((current) => current.filter((method) => method.id !== id));
  };

  const toggleMethod = (id: string) => {
    setMethods((current) =>
      current.map((method) =>
        method.id === id
          ? { ...method, status: method.status === "enabled" ? "disabled" : "enabled" }
          : method,
      ),
    );
  };

  const save = async () => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await opsSavePaymentSettings({
        data: {
          token,
          depositOption: options.depositOption,
          withdrawalOption: options.withdrawalOption,
          minimumDeposit: options.minimumDeposit,
          paymentMethods: methods,
        },
      });
      setMethods(result.paymentMethods);
      setNotice("Payment settings saved.");
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Payment settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Control payment methods, deposit rules and payout preferences.
          </p>
        </div>
        <button type="button" onClick={save} disabled={busy} className={adminBtn}>
          <Save className="h-4 w-4" /> {busy ? "Saving…" : "Save payment settings"}
        </button>
      </div>

      {notice && <AdminNotice tone="success">{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}

      <AdminCard title="Payment preference" description="How deposits and withdrawals are handled.">
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminField label="Deposit option">
            <select
              value={options.depositOption}
              onChange={(event) =>
                setOptions({ ...options, depositOption: event.target.value as PaymentOption })
              }
              className={adminInput}
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </AdminField>
          <AdminField label="Withdrawal option">
            <select
              value={options.withdrawalOption}
              onChange={(event) =>
                setOptions({ ...options, withdrawalOption: event.target.value as PaymentOption })
              }
              className={adminInput}
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </AdminField>
          <AdminField label="Minimum deposit amount">
            <input
              type="number"
              min={0}
              value={options.minimumDeposit}
              onChange={(event) =>
                setOptions({ ...options, minimumDeposit: Number(event.target.value) })
              }
              className={adminInput}
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard
        title="Payment methods"
        description="Add, edit, enable or disable the methods shown to customers."
        actions={
          <button type="button" onClick={() => setEditing(emptyMethod())} className={adminBtnGhost}>
            <Plus className="h-4 w-4" /> Add new
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2">Method name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Used for</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Option</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {methods.map((method) => (
                <tr key={method.id}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{method.name}</p>
                        <p className="text-xs text-slate-500">
                          {method.currency} · min {method.minAmount} · max {method.maxAmount}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 capitalize text-slate-600">{method.type}</td>
                  <td className="py-3 pr-3 capitalize text-slate-600">{method.usedFor}</td>
                  <td className="py-3 pr-3">
                    <StatusPill status={method.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditing(method)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMethod(method.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        {method.status === "enabled" ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMethod(method.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.name ? `Edit ${editing.name}` : "Add payment method"}
        description="Configure the method details shown in the payment settings."
        wide
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Name">
              <input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                placeholder="e.g. USDT"
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Type">
              <select
                value={editing.type}
                onChange={(event) =>
                  setEditing({ ...editing, type: event.target.value as PaymentMethodType })
                }
                className={adminInput}
              >
                {PAYMENT_METHOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Used for">
              <select
                value={editing.usedFor}
                onChange={(event) =>
                  setEditing({ ...editing, usedFor: event.target.value as PaymentMethodUsage })
                }
                className={adminInput}
              >
                {PAYMENT_METHOD_USAGE.map((usage) => (
                  <option key={usage} value={usage}>
                    {usage}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Status">
              <select
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value as PaymentMethodStatus })
                }
                className={adminInput}
              >
                {PAYMENT_METHOD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Currency">
              <input
                value={editing.currency}
                onChange={(event) => setEditing({ ...editing, currency: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Image URL (logo)">
              <input
                value={editing.imageUrl}
                onChange={(event) => setEditing({ ...editing, imageUrl: event.target.value })}
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Minimum amount">
              <input
                type="number"
                min={0}
                value={editing.minAmount}
                onChange={(event) =>
                  setEditing({ ...editing, minAmount: Number(event.target.value) })
                }
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Maximum amount">
              <input
                type="number"
                min={0}
                value={editing.maxAmount}
                onChange={(event) =>
                  setEditing({ ...editing, maxAmount: Number(event.target.value) })
                }
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Charges">
              <input
                type="number"
                min={0}
                value={editing.charges}
                onChange={(event) =>
                  setEditing({ ...editing, charges: Number(event.target.value) })
                }
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Charges type">
              <select
                value={editing.chargesType}
                onChange={(event) =>
                  setEditing({ ...editing, chargesType: event.target.value as PaymentChargeType })
                }
                className={adminInput}
              >
                {PAYMENT_CHARGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </AdminField>

            {editing.type === "currency" ? (
              <>
                <AdminField label="Bank name">
                  <input
                    value={editing.bankName}
                    onChange={(event) => setEditing({ ...editing, bankName: event.target.value })}
                    className={adminInput}
                  />
                </AdminField>
                <AdminField label="Account name">
                  <input
                    value={editing.accountName}
                    onChange={(event) =>
                      setEditing({ ...editing, accountName: event.target.value })
                    }
                    className={adminInput}
                  />
                </AdminField>
                <AdminField label="Account number">
                  <input
                    value={editing.accountNumber}
                    onChange={(event) =>
                      setEditing({ ...editing, accountNumber: event.target.value })
                    }
                    className={adminInput}
                  />
                </AdminField>
                <AdminField label="Swift / other code">
                  <input
                    value={editing.swiftCode}
                    onChange={(event) => setEditing({ ...editing, swiftCode: event.target.value })}
                    className={adminInput}
                  />
                </AdminField>
              </>
            ) : (
              <>
                <AdminField label="Wallet address">
                  <input
                    value={editing.walletAddress}
                    onChange={(event) =>
                      setEditing({ ...editing, walletAddress: event.target.value })
                    }
                    className={adminInput}
                  />
                </AdminField>
                <AdminField label="Wallet address network type">
                  <input
                    value={editing.network}
                    onChange={(event) => setEditing({ ...editing, network: event.target.value })}
                    className={adminInput}
                  />
                </AdminField>
              </>
            )}

            <AdminField label="Optional note" className="sm:col-span-2">
              <textarea
                value={editing.note}
                onChange={(event) => setEditing({ ...editing, note: event.target.value })}
                rows={2}
                className={adminInput}
              />
            </AdminField>

            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setEditing(null)} className={adminBtnGhost}>
                Cancel
              </button>
              <button type="button" onClick={() => saveMethod(editing)} className={adminBtn}>
                Save method
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
