import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MessageCircle, Save, Settings2 } from "lucide-react";
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

  const propertyId = form.tawkPropertyId.trim();
  const widgetId = form.tawkWidgetId.trim() || "default";
  const chatStatus = !form.tawkEnabled
    ? {
        text: "Live chat is off — visitors won't see the chat bubble.",
        className: "bg-slate-100 text-slate-600",
      }
    : propertyId
      ? {
          text: "Live chat is on — the chat bubble appears on the public site.",
          className: "bg-emerald-50 text-emerald-700",
        }
      : {
          text: "Add your Tawk.to Property ID below to activate the chat bubble.",
          className: "bg-amber-50 text-amber-700",
        };

  return (
    <form
      className="space-y-6"
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
              tawkEnabled: form.tawkEnabled,
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Settings2 className="h-5 w-5 text-blue-600" /> Admin access & email
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Sign-in details and the address used for notification emails.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
              placeholder="Navora Logistics <updates@yourdomain.com>"
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
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MessageCircle className="h-5 w-5 text-blue-600" /> Live chat (Tawk.to)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Turn the chat bubble on or off and connect your Tawk.to property.
        </p>

        <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Enable live chat</div>
            <p className="text-xs text-slate-500">
              Shows the Tawk.to chat bubble on every public page of the site.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.tawkEnabled}
            aria-label="Enable live chat"
            onClick={() =>
              setForm((current) =>
                current ? { ...current, tawkEnabled: !current.tawkEnabled } : current,
              )
            }
            className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              form.tawkEnabled ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                form.tawkEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${chatStatus.className}`}>
          {chatStatus.text}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
        </div>

        {propertyId && (
          <p className="mt-3 break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
            https://embed.tawk.to/{propertyId}/{widgetId}
          </p>
        )}

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Where to find your IDs
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-600">
            <li>Sign in at dashboard.tawk.to.</li>
            <li>Open Administration → Chat Widget.</li>
            <li>Copy the Property ID and Widget ID into the fields above.</li>
            <li>Save — the chat bubble appears on the public site right away.</li>
          </ol>
          <a
            href="https://dashboard.tawk.to"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            Open Tawk.to dashboard <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </button>
        {notice && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
