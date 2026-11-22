import { useCallback, useEffect, useState } from "react";
import { Mail, Send, Settings2 } from "lucide-react";
import { opsCustomers, opsSaveEmailSettings, opsSendBroadcast } from "@/lib/shippy-admin.functions";
import { opsOverview, opsSettings } from "@/lib/shippy.functions";
import { formatStamp } from "@/lib/shippy-format";
import {
  AdminCard,
  AdminField,
  AdminNotice,
  EmptyState,
  LoadingBlock,
  adminBtn,
  adminInput,
} from "./admin-ui";

type Customers = Awaited<ReturnType<typeof opsCustomers>>;
type Settings = Awaited<ReturnType<typeof opsSettings>>;
type Overview = Awaited<ReturnType<typeof opsOverview>>;

type MailForm = {
  mailServer: "sendmail" | "smtp";
  emailFrom: string;
  emailFromName: string;
  smtpHost: string;
  smtpPort: string;
  smtpEncryption: "ssl" | "tls" | "none";
  smtpUsername: string;
  smtpPassword: string;
};

const mailFromSettings = (settings: Settings): MailForm => ({
  mailServer: settings.mailServer,
  emailFrom: settings.emailFrom,
  emailFromName: settings.emailFromName,
  smtpHost: settings.smtpHost,
  smtpPort: settings.smtpPort,
  smtpEncryption: settings.smtpEncryption,
  smtpUsername: settings.smtpUsername,
  smtpPassword: settings.smtpPassword,
});

export function AdminEmailsTab({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [customers, setCustomers] = useState<Customers | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [category, setCategory] = useState<"all" | "choose">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [compose, setCompose] = useState({ greeting: "Hello,", subject: "", message: "" });
  const [mail, setMail] = useState<MailForm | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mailBusy, setMailBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [nextCustomers, nextSettings, nextOverview] = await Promise.all([
        opsCustomers({ data: { token } }),
        opsSettings({ data: { token } }),
        opsOverview({ data: { token } }),
      ]);
      setCustomers(nextCustomers);
      setSettings(nextSettings);
      setOverview(nextOverview);
      setMail((current) => current ?? mailFromSettings(nextSettings));
    } catch {
      onExpired();
    }
  }, [token, onExpired]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!customers || !settings || !overview || !mail) {
    return <LoadingBlock label="Loading email services…" />;
  }

  const allEmails = Array.from(
    new Set(customers.map((customer) => customer.email).filter(Boolean)),
  ).sort();
  const recipients = category === "all" ? allEmails : selected;

  const toggleRecipient = (email: string) => {
    setSelected((current) =>
      current.includes(email) ? current.filter((item) => item !== email) : [...current, email],
    );
  };

  const send = async () => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await opsSendBroadcast({
        data: {
          token,
          recipients,
          subject: compose.subject,
          greeting: compose.greeting,
          message: compose.message,
        },
      });
      setNotice(
        `Email sent to ${result.total} recipient${result.total === 1 ? "" : "s"}: ${result.sent} sent, ${result.queued} queued, ${result.failed} failed.`,
      );
      setCompose({ greeting: "Hello,", subject: "", message: "" });
      await refresh();
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const saveMail = async () => {
    setMailBusy(true);
    setNotice("");
    setError("");
    try {
      await opsSaveEmailSettings({ data: { token, ...mail } });
      setNotice("Mail server settings saved.");
    } catch (err) {
      const message = (err as Error).message;
      if (/unauthor/i.test(message)) onExpired();
      setError(message);
    } finally {
      setMailBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Email services</h2>
        <p className="mt-1 text-sm text-slate-500">
          Send updates to customers and configure the mail server used by the site.
        </p>
      </div>

      {notice && <AdminNotice tone="success">{notice}</AdminNotice>}
      {error && <AdminNotice tone="error">{error}</AdminNotice>}

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminCard
          className="xl:col-span-2"
          title="Send email to customers"
          description="Reach every customer or pick specific recipients."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Category">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as "all" | "choose")}
                className={adminInput}
              >
                <option value="all">All customers ({allEmails.length})</option>
                <option value="choose">Choose customers</option>
              </select>
            </AdminField>
            <AdminField label="Recipients">
              <div className="rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
                {recipients.length} selected
              </div>
            </AdminField>
            {category === "choose" && (
              <div className="sm:col-span-2">
                <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
                  {allEmails.length === 0 ? (
                    <p className="p-3 text-sm text-slate-500">No customer emails yet.</p>
                  ) : (
                    allEmails.map((email) => (
                      <label
                        key={email}
                        className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(email)}
                          onChange={() => toggleRecipient(email)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {email}
                      </label>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(allEmails)}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Select all recipients
                </button>
              </div>
            )}
            <AdminField label="Greeting / Title" className="sm:col-span-2">
              <input
                value={compose.greeting}
                onChange={(event) => setCompose({ ...compose, greeting: event.target.value })}
                placeholder="Hello,"
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Subject" className="sm:col-span-2">
              <input
                value={compose.subject}
                onChange={(event) => setCompose({ ...compose, subject: event.target.value })}
                placeholder="Important update about your shipment"
                className={adminInput}
              />
            </AdminField>
            <AdminField label="Message" className="sm:col-span-2">
              <textarea
                value={compose.message}
                onChange={(event) => setCompose({ ...compose, message: event.target.value })}
                rows={7}
                placeholder="Write the email your customers will receive…"
                className={adminInput}
              />
            </AdminField>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={send} disabled={busy} className={adminBtn}>
              <Send className="h-4 w-4" /> {busy ? "Sending…" : "Send email"}
            </button>
            <p className="text-xs text-slate-500">
              Delivery uses the configured mail provider. Without a provider key, messages are
              queued in the activity log.
            </p>
          </div>
        </AdminCard>

        <AdminCard title="Recent email activity" description="Latest messages from the console.">
          {overview.outbox.length === 0 ? (
            <EmptyState title="No emails sent yet" />
          ) : (
            <ul className="space-y-2">
              {overview.outbox.slice(0, 8).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.subject}</p>
                  <p className="text-xs text-slate-500">
                    {item.to} · {formatStamp(item.createdAt)}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-600">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <AdminCard
        title="Mail server"
        description="Stored in app settings and used for outgoing notification email."
        actions={
          <button type="button" onClick={saveMail} disabled={mailBusy} className={adminBtn}>
            <Settings2 className="h-4 w-4" /> {mailBusy ? "Saving…" : "Save mail settings"}
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Mail server">
            <select
              value={mail.mailServer}
              onChange={(event) =>
                setMail({ ...mail, mailServer: event.target.value as "sendmail" | "smtp" })
              }
              className={adminInput}
            >
              <option value="sendmail">Sendmail</option>
              <option value="smtp">SMTP</option>
            </select>
          </AdminField>
          <AdminField label="Email from">
            <input
              value={mail.emailFrom}
              onChange={(event) => setMail({ ...mail, emailFrom: event.target.value })}
              placeholder="Shippy Express <updates@yourdomain.com>"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Email from name">
            <input
              value={mail.emailFromName}
              onChange={(event) => setMail({ ...mail, emailFromName: event.target.value })}
              placeholder="Shippy Express"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="SMTP host">
            <input
              value={mail.smtpHost}
              onChange={(event) => setMail({ ...mail, smtpHost: event.target.value })}
              placeholder="smtp.yourdomain.com"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="SMTP port">
            <input
              value={mail.smtpPort}
              onChange={(event) => setMail({ ...mail, smtpPort: event.target.value })}
              placeholder="465"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="SMTP encryption">
            <select
              value={mail.smtpEncryption}
              onChange={(event) =>
                setMail({
                  ...mail,
                  smtpEncryption: event.target.value as "ssl" | "tls" | "none",
                })
              }
              className={adminInput}
            >
              <option value="ssl">SSL</option>
              <option value="tls">TLS</option>
              <option value="none">None</option>
            </select>
          </AdminField>
          <AdminField label="SMTP username">
            <input
              value={mail.smtpUsername}
              onChange={(event) => setMail({ ...mail, smtpUsername: event.target.value })}
              className={adminInput}
            />
          </AdminField>
          <AdminField label="SMTP password">
            <input
              type="password"
              value={mail.smtpPassword}
              onChange={(event) => setMail({ ...mail, smtpPassword: event.target.value })}
              className={adminInput}
            />
          </AdminField>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <Mail className="h-3.5 w-3.5" /> The active deployment provider delivers mail; SMTP
          credentials are stored for your mail infrastructure.
        </p>
      </AdminCard>
    </div>
  );
}
