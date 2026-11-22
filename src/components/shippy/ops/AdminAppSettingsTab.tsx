import { useEffect, useState } from "react";
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  MessageCircle,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { CURRENCIES } from "@/data/admin";
import { opsSaveAppSettings } from "@/lib/shippy-admin.functions";
import { opsSettings } from "@/lib/shippy.functions";
import { AdminCard, AdminField, AdminNotice, LoadingBlock, adminBtn, adminInput } from "./admin-ui";

type Settings = Awaited<ReturnType<typeof opsSettings>>;
type FormState = Settings & { newPassword: string };

function ImageUpload({
  label,
  hint,
  value,
  onChange,
  size = "logo",
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  size?: "logo" | "favicon";
}) {
  const [error, setError] = useState("");

  const pick = (file: File | undefined) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 300_000) {
      setError("Image must be 300 KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div
          className={
            size === "logo"
              ? "flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              : "flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50"
          }
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-contain p-1" />
          ) : (
            <ImagePlus className="h-5 w-5 text-slate-400" />
          )}
        </div>
        <label className={`${adminBtn} cursor-pointer`}>
          <ImagePlus className="h-4 w-4" /> Upload
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              pick(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function AdminAppSettingsTab({
  token,
  onExpired,
  onToken,
  onBranding,
}: {
  token: string;
  onExpired: () => void;
  onToken: (token: string) => void;
  onBranding?: (branding: { websiteName: string; logoUrl: string }) => void;
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

  if (!form) return <LoadingBlock label="Loading app settings…" />;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
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
          text: "Live chat is on — the Tawk.to chat bubble appears on the public site.",
          className: "bg-emerald-50 text-emerald-700",
        }
      : {
          text: "Add your Tawk.to Property ID below to activate the chat bubble.",
          className: "bg-amber-50 text-amber-700",
        };

  const save = async () => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await opsSaveAppSettings({
        data: {
          token,
          adminEmail: form.adminEmail,
          emailFrom: form.emailFrom,
          contactEmail: form.contactEmail,
          tawkEnabled: form.tawkEnabled,
          tawkPropertyId: form.tawkPropertyId,
          tawkWidgetId: form.tawkWidgetId,
          tidioPublicKey: form.tidioPublicKey,
          websiteName: form.websiteName,
          websiteTitle: form.websiteTitle,
          websiteUrl: form.websiteUrl,
          officeAddress: form.officeAddress,
          whatsappNumber: form.whatsappNumber,
          yearStarted: form.yearStarted,
          websiteCurrency: form.websiteCurrency,
          homepageUrl: form.homepageUrl,
          logoUrl: form.logoUrl,
          faviconUrl: form.faviconUrl,
          newPassword: form.newPassword,
        },
      });
      onToken(result.token);
      setForm({ ...result.settings, newPassword: "" });
      onBranding?.({ websiteName: result.settings.websiteName, logoUrl: result.settings.logoUrl });
      setNotice("Settings saved.");
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
          <h2 className="text-2xl font-bold text-slate-900">App settings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Website details, branding, live chat and administrator access.
          </p>
        </div>
        <a
          href={form.websiteUrl || "/"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Visit our website <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {notice && <AdminNotice tone="success">{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}

      <AdminCard
        title="Website information"
        description="These values appear across the public site."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Website name">
            <input
              value={form.websiteName}
              onChange={(event) => set("websiteName", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Website title">
            <input
              value={form.websiteTitle}
              onChange={(event) => set("websiteTitle", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Website URL (https://yoursite.com)">
            <input
              value={form.websiteUrl}
              onChange={(event) => set("websiteUrl", event.target.value)}
              placeholder="https://yoursite.com"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Office address">
            <input
              value={form.officeAddress}
              onChange={(event) => set("officeAddress", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField
            label="WhatsApp number"
            hint="Leave empty if you don't want a WhatsApp button."
          >
            <input
              value={form.whatsappNumber}
              onChange={(event) => set("whatsappNumber", event.target.value)}
              placeholder="234..."
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Tidio live chat ID" hint="Leave empty to disable Tidio.">
            <input
              value={form.tidioPublicKey}
              onChange={(event) => set("tidioPublicKey", event.target.value)}
              placeholder="e.g. abc123…"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Year started">
            <input
              value={form.yearStarted}
              onChange={(event) => set("yearStarted", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Contact email">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => set("contactEmail", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Website currency">
            <input
              list="shippy-currencies"
              value={form.websiteCurrency}
              onChange={(event) => set("websiteCurrency", event.target.value)}
              className={adminInput}
            />
            <datalist id="shippy-currencies">
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency} />
              ))}
            </datalist>
          </AdminField>
          <AdminField
            label="Homepage URL (redirect)"
            hint="Leave empty to use the default homepage."
          >
            <input
              value={form.homepageUrl}
              onChange={(event) => set("homepageUrl", event.target.value)}
              placeholder="https://..."
              className={adminInput}
            />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Branding" description="Upload the logo and favicon used by the site.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload
            label="Logo"
            hint="Recommended max width 200px and max height 100px."
            value={form.logoUrl}
            onChange={(value) => set("logoUrl", value)}
          />
          <ImageUpload
            label="Favicon"
            hint="Recommended 32 × 32px."
            value={form.faviconUrl}
            onChange={(value) => set("faviconUrl", value)}
            size="favicon"
          />
        </div>
      </AdminCard>

      <AdminCard
        title="Live chat (Tawk.to)"
        description="Turn the chat bubble on or off and connect your Tawk.to property."
      >
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
            onClick={() => set("tawkEnabled", !form.tawkEnabled)}
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
          <AdminField label="Tawk.to property ID">
            <input
              value={form.tawkPropertyId}
              onChange={(event) => set("tawkPropertyId", event.target.value)}
              placeholder="e.g. 66f1a2b3c4d5e6f7a8b9c0d1"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Tawk.to widget ID">
            <input
              value={form.tawkWidgetId}
              onChange={(event) => set("tawkWidgetId", event.target.value)}
              placeholder="default"
              className={adminInput}
            />
          </AdminField>
        </div>

        {propertyId && (
          <p className="mt-3 break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
            https://embed.tawk.to/{propertyId}/{widgetId}
          </p>
        )}

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <MessageCircle className="h-4 w-4" /> Where to find your IDs
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
      </AdminCard>

      <AdminCard
        title="Admin access & email"
        description="Sign-in details and the notification sender."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Admin email">
            <input
              type="email"
              value={form.adminEmail}
              onChange={(event) => set("adminEmail", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="New password" hint="Leave blank to keep the current password.">
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => set("newPassword", event.target.value)}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Notification from address">
            <input
              value={form.emailFrom}
              onChange={(event) => set("emailFrom", event.target.value)}
              placeholder="Shippy Express <updates@yourdomain.com>"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Contact form inbox">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => set("contactEmail", event.target.value)}
              className={adminInput}
            />
          </AdminField>
        </div>
      </AdminCard>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className={adminBtn}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {busy ? "Saving…" : "Save settings"}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Settings2 className="h-3.5 w-3.5" /> Changes apply to the public site immediately.
        </p>
      </div>
    </div>
  );
}
