import { useEffect, useState } from "react";
import { Loader2, Save, Settings2 } from "lucide-react";
import { opsSaveSettings, opsSettings } from "@/lib/shippy.functions";

const field =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

type Settings = Awaited<ReturnType<typeof opsSettings>>;
type FormState = Settings & { newPassword: string };

export function OpsSettingsTab({
  token,
  onExpired,
  onToken,
}: {
  token: string;
  onExpired: () => void;
  onToken: (token: string) => void;
}) {
  const [form, setForm] = useState<FormState | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await opsSettings({ data: { token } });
        if (!cancelled) setForm({ ...data, newPassword: "" });
      } catch {
        onExpired();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, onExpired]);

  if (!form) {
    return <p className="py-10 text-center text-sm text-slate-500">Loading settings…</p>;
  }

  const set = (key: keyof FormState, value: string) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Settings2 className="h-5 w-5 text-blue-600" /> Settings
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Admin access, notification sender and live chat configuration.
      </p>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setNotice("");
          setError("");
          try {
            const result = await opsSaveSettings({
              data: {
                token,
                adminEmail: form.adminEmail,
                emailFrom: form.emailFrom,
                contactEmail: form.contactEmail,
                tawkPropertyId: form.tawkPropertyId,
                tawkWidgetId: form.tawkWidgetId,
                newPassword: form.newPassword,
              },
            });
            onToken(result.token);
            setForm({ ...form, newPassword: "" });
            setNotice("Settings saved.");
          } catch (err) {
            const message = (err as Error).message;
            if (/unauthor/i.test(message)) onExpired();
            setError(message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="text-sm text-slate-600">
          Admin email
          <input
            type="email"
            required
            value={form.adminEmail}
            onChange={(event) => set("adminEmail", event.target.value)}
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          New password
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => set("newPassword", event.target.value)}
            placeholder="Leave blank to keep current password"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Notification from address
          <input
            value={form.emailFrom}
            onChange={(event) => set("emailFrom", event.target.value)}
            placeholder="Shippy Express <updates@yourdomain.com>"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Contact form inbox
          <input
            type="email"
            value={form.contactEmail}
            onChange={(event) => set("contactEmail", event.target.value)}
            placeholder="support@yourdomain.com"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Tawk.to property ID
          <input
            value={form.tawkPropertyId}
            onChange={(event) => set("tawkPropertyId", event.target.value)}
            placeholder="e.g. 66f1a2b3c4d5e6f7a8b9c0d1"
            className={`${field} mt-1`}
          />
        </label>
        <label className="text-sm text-slate-600">
          Tawk.to widget ID
          <input
            value={form.tawkWidgetId}
            onChange={(event) => set("tawkWidgetId", event.target.value)}
            placeholder="default"
            className={`${field} mt-1`}
          />
        </label>
        <p className="text-xs text-slate-500 sm:col-span-2">
          Live chat loads on the public site as soon as a Tawk.to property ID is saved — copy it
          from Tawk.to → Administration → Chat Widget.
        </p>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        </div>
        {notice && <p className="text-sm text-emerald-700 sm:col-span-2">{notice}</p>}
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>
    </div>
  );
}
