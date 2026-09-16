import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  MessageCircle,
  Mail,
  Share2,
  Megaphone,
  Send,
  Eye,
  EyeOff,
  Copy,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

type Settings = {
  id: number;
  site_name: string | null;
  site_url: string | null;
  tidio_public_key: string | null;
  sendpulse_chat_id: string | null;
  sendpulse_embed_html: string | null;
  tawk_property_id: string | null;
  tawk_widget_id: string | null;
  referral_percent: number | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from_name: string | null;
  smtp_from_email: string | null;
  announcement_enabled: boolean | null;
  announcement_title: string | null;
  announcement_message: string | null;
  announcement_link: string | null;
  announcement_link_label: string | null;
  announcement_version: number | null;
  auto_approve_enabled: boolean | null;
  auto_approve_max_amount: number | null;
  mm_webhook_secret: string | null;
  auto_withdraw_enabled: boolean | null;
  auto_withdraw_max_amount: number | null;
  auto_withdraw_ussd_template: string | null;
  deposit_min_amount: number | null;
  deposit_max_amount: number | null;
  mtn_number: string | null;
  orange_number: string | null;
  mtn_enabled: boolean | null;
  orange_enabled: boolean | null;
};

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AdminSettings() {
  const [s, setS] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [reshow, setReshow] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  async function load() {
    // Full row (including SMTP credentials) is admin-only via SECURITY DEFINER RPC.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).rpc("get_app_settings_admin");
    const row = Array.isArray(data) ? data[0] : data;
    setS((row as Settings) ?? ({ id: 1 } as Settings));
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!s) return;
    const secret = s.mm_webhook_secret?.trim() ?? "";
    if (s.auto_approve_enabled && secret.length < 24) {
      toast.error("Set a webhook secret with at least 24 characters before enabling automation");
      return;
    }
    if (s.site_url && !/^https:\/\//i.test(s.site_url)) {
      toast.error("Site URL must use HTTPS");
      return;
    }
    setBusy(true);
    try {
      const settingsPayload = {
        site_name: s.site_name ?? "Fidelity",
        site_url: s.site_url,
        tidio_public_key: s.tidio_public_key,
        sendpulse_chat_id: s.sendpulse_chat_id,
        sendpulse_embed_html: s.sendpulse_embed_html,
        tawk_property_id: s.tawk_property_id,
        tawk_widget_id: s.tawk_widget_id,
        referral_percent: s.referral_percent ?? 5,
        smtp_host: s.smtp_host,
        smtp_port: s.smtp_port,
        smtp_secure: s.smtp_secure,
        smtp_user: s.smtp_user,
        smtp_password: s.smtp_password,
        smtp_from_name: s.smtp_from_name,
        smtp_from_email: s.smtp_from_email,
        announcement_enabled: !!s.announcement_enabled,
        announcement_title: s.announcement_title,
        announcement_message: s.announcement_message,
        announcement_link: s.announcement_link,
        announcement_link_label: s.announcement_link_label,
        announcement_version: (s.announcement_version ?? 1) + (reshow ? 1 : 0),
        auto_approve_enabled: s.auto_approve_enabled ?? true,
        auto_approve_max_amount: s.auto_approve_max_amount,
        auto_withdraw_enabled: !!s.auto_withdraw_enabled,
        auto_withdraw_max_amount: s.auto_withdraw_max_amount,
        auto_withdraw_ussd_template: s.auto_withdraw_ussd_template || "*126*9*{phone}*{amount}#",
        deposit_min_amount: Number(s.deposit_min_amount) || 1000,
        deposit_max_amount: Number(s.deposit_max_amount) || 10000000,
        mtn_number: s.mtn_number,
        orange_number: s.orange_number,
        mtn_enabled: !!s.mtn_enabled,
        orange_enabled: !!s.orange_enabled,
      };
      let { error } = await supabase.from("app_settings").update(settingsPayload).eq("id", 1);
      if (error && /schema cache|column .* does not exist/i.test(error.message)) {
        const { deposit_min_amount: _min, deposit_max_amount: _max, ...legacyPayload } = settingsPayload;
        ({ error } = await supabase.from("app_settings").update(legacyPayload).eq("id", 1));
        if (!error) toast.info("Settings saved; deposit limits will apply after the database migration is installed");
      }
      if (error) throw error;
      await supabase.rpc("reload_schema_cache");
      if (!error) toast.success("Settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!s) return <div className="text-muted-foreground">Loading…</div>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS({ ...s, [k]: v });
  const endpointUrl = `${(s.site_url || "https://fidelity-invest.lovable.app").replace(/\/$/, "")}/api/public/mm-sms`;
  const baseUrl = (s.site_url || "https://fidelity-invest.lovable.app").replace(/\/$/, "");
  const queueUrl = `${baseUrl}/api/public/withdraw-queue`;
  const resultUrl = `${baseUrl}/api/public/withdraw-result`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary md:text-4xl">Site settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Branding, live chat & email.</p>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg text-primary">Deposit limits</h2>
        <p className="text-sm text-muted-foreground">Control the minimum and maximum amount users can submit for deposits.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Minimum deposit (XAF)</Label><Input type="number" min={1} value={s.deposit_min_amount ?? 1000} onChange={(e) => set("deposit_min_amount", Number(e.target.value))} /></div>
          <div><Label>Maximum deposit (XAF)</Label><Input type="number" min={1} value={s.deposit_max_amount ?? 10000000} onChange={(e) => set("deposit_max_amount", Number(e.target.value))} /></div>
        </div>
  </section>

  <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
  <div><h2 className="font-display text-lg text-primary">Deposit methods</h2><p className="text-sm text-muted-foreground">Only enabled methods appear in the deposit flow.</p></div>
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2"><div className="flex items-center justify-between"><Label>Enable MTN</Label><Switch checked={!!s.mtn_enabled} onCheckedChange={(v) => set("mtn_enabled", v)} /></div><Input value={s.mtn_number ?? ""} placeholder="MTN number" onChange={(e) => set("mtn_number", e.target.value)} /></div>
    <div className="space-y-2"><div className="flex items-center justify-between"><Label>Enable Orange</Label><Switch checked={!!s.orange_enabled} onCheckedChange={(v) => set("orange_enabled", v)} /></div><Input value={s.orange_number ?? ""} placeholder="Orange Money number" onChange={(e) => set("orange_number", e.target.value)} /></div>
  </div>
  </section>
  
  <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
  <h2 className="font-display text-lg text-primary">Branding</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Site name</Label>
            <Input value={s.site_name ?? ""} onChange={(e) => set("site_name", e.target.value)} />
          </div>
          <div>
            <Label>Site URL</Label>
            <Input
              value={s.site_url ?? ""}
              onChange={(e) => set("site_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <Label>WhatsApp support link</Label>
            <Input
              value={s.announcement_link ?? ""}
              onChange={(e) => set("announcement_link", e.target.value)}
              placeholder="https://wa.me/237..."
            />
            <p className="mt-1 text-xs text-muted-foreground">Used by the Contact Support on WhatsApp button on deposit processing pages.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-primary">
          <MessageCircle className="h-5 w-5" /> Automatic deposit approval
        </h2>
        <p className="text-xs text-muted-foreground">Forwarded SMS are stored in Admin → Forwarded SMS so you can inspect the raw message, parsed amount, transaction ID, and matching status.</p>
        <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
          <div>
            <div className="text-sm font-medium">Enable auto-approval</div>
            <p className="text-xs text-muted-foreground">
              Approves a deposit only when the screenshot transaction ID matches a received
              mobile-money message and the amounts are identical.
            </p>
          </div>
          <Switch
            checked={s.auto_approve_enabled ?? true}
            onCheckedChange={(v) => set("auto_approve_enabled", v)}
          />
        </div>
        <div className="max-w-xs">
          <Label>Maximum auto-approved amount (XAF)</Label>
          <Input
            type="number"
            min={0}
            step={500}
            value={s.auto_approve_max_amount ?? ""}
            onChange={(e) =>
              set("auto_approve_max_amount", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="No limit"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Bigger deposits always wait for your manual review.
          </p>
        </div>
        <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
            Phone setup (SMS forwarder)
          </h3>
          <p className="text-xs text-muted-foreground">
            Install <span className="font-medium">SMS to URL Forwarder</span> (by Bogomolov) on the
            Android phone that receives your MTN / Orange Money confirmations, then copy the values
            below into it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <a
                href="https://play.google.com/store/apps/details?id=tech.bogomolov.incomingsmsgateway"
                target="_blank"
                rel="noreferrer"
              >
                Get it on Google Play
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a
                href="https://f-droid.org/en/packages/tech.bogomolov.incomingsmsgateway/"
                target="_blank"
                rel="noreferrer"
              >
                F-Droid fallback
              </a>
            </Button>
          </div>

          <div className="grid gap-3">
            <CopyField label="Endpoint URL" value={endpointUrl} />
            <CopyField label="JSON body template" value={'{"text":"%text%","sender":"%from%"}'} />
            <CopyField label="Header name" value="x-mm-secret" />
            <div>
              <Label>Header value (forwarder secret)</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showSecret ? "text" : "password"}
                  value={s.mm_webhook_secret ?? ""}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSecret((v) => !v)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(s.mm_webhook_secret ?? "");
                    toast.success("Secret copied");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2 px-0 text-xs"
                onClick={async () => {
                  const next =
                    crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
                  const { error } = await supabase
                    .from("app_settings")
                    .update({ mm_webhook_secret: next })
                    .eq("id", 1);
                  if (error) toast.error(error.message);
                  else {
                    set("mm_webhook_secret", next);
                    toast.success("New secret generated — update it in the phone app");
                  }
                }}
              >
                Regenerate secret
              </Button>
            </div>
          </div>

          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>
              Open the app, tap “+”, set Sender to{" "}
              <span className="font-mono">MTN Mobile Money</span> (add a second rule for{" "}
              <span className="font-mono">Orange Money</span>, or use{" "}
              <span className="font-mono">*</span> for all).
            </li>
            <li>Paste the endpoint URL above.</li>
            <li>
              Set method to <span className="font-mono">POST</span>, content type to{" "}
              <span className="font-mono">application/json</span>, paste the JSON body template, and
              add the header <span className="font-mono">x-mm-secret</span> with the secret value.
            </li>
            <li>
              Save, then send yourself a test mobile-money message and check Admin → Deposits for
              the received message.
            </li>
          </ol>
          <p className="text-xs text-amber-500">
            Important: turn off battery optimisation for the forwarder app (Settings → Apps → SMS to
            URL Forwarder → Battery → Unrestricted), otherwise Android will stop it in the
            background.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-primary">
          <Send className="h-5 w-5" /> Automatic MTN withdrawals (MacroDroid)
        </h2>
        <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
          <div>
            <div className="text-sm font-medium">Enable automatic payouts</div>
            <p className="text-xs text-muted-foreground">
              Only pending mobile-money withdrawals sent to an MTN number are paid automatically.
              Everything else — and any failure such as insufficient float — stays pending for your
              manual approval.
            </p>
          </div>
          <Switch
            checked={!!s.auto_withdraw_enabled}
            onCheckedChange={(v) => set("auto_withdraw_enabled", v)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Maximum auto-paid amount (XAF)</Label>
            <Input
              type="number"
              min={0}
              step={500}
              value={s.auto_withdraw_max_amount ?? ""}
              onChange={(e) =>
                set(
                  "auto_withdraw_max_amount",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="No limit"
            />
          </div>
          <div>
            <Label>USSD template</Label>
            <Input
              value={s.auto_withdraw_ussd_template ?? "*126*9*{phone}*{amount}#"}
              onChange={(e) => set("auto_withdraw_ussd_template", e.target.value)}
              className="font-mono text-xs"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-mono">{"{phone}"}</span> and{" "}
              <span className="font-mono">{"{amount}"}</span> are replaced automatically.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              MacroDroid setup
            </h3>
            <Button asChild size="sm" variant="outline">
              <a
                href="/automatic-withdrawal-safe.macro.json"
                download="automatic-withdrawal-safe.macro.json"
                type="application/json"
              >
                <Download className="mr-2 h-4 w-4" />
                Download safe macro
              </a>
            </Button>
          </div>
          <div className="grid gap-3">
            <CopyField label="1. Queue URL (HTTP GET, every 1 minute)" value={queueUrl} />
            <CopyField label="Header name" value="x-mm-secret" />
            <CopyField label="Header value" value={s.mm_webhook_secret ?? ""} />
            <CopyField label="2. Result URL (HTTP POST)" value={resultUrl} />
            <CopyField label="Result JSON body" value={'{"id":"{lv=wid}","status":"success"}'} />
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>
              Macro 1 — Trigger: <span className="font-mono">Regular Interval, 1 minute</span>.
            </li>
            <li>
              Action: <span className="font-mono">HTTP Request → GET</span> the Queue URL with the
              header above, save response to variable <span className="font-mono">resp</span>.
            </li>
            <li>
              Action: JSON parse <span className="font-mono">resp</span> → store{" "}
              <span className="font-mono">claimed</span>, <span className="font-mono">code</span>,{" "}
              <span className="font-mono">id</span> (as <span className="font-mono">wid</span>).
            </li>
            <li>
              Condition: if <span className="font-mono">claimed = true</span> → Action{" "}
              <span className="font-mono">Make Call / USSD</span> with{" "}
              <span className="font-mono">{"{lv=code}"}</span> (already built as{" "}
              <span className="font-mono">*126*9*number*amount#</span>).
            </li>
            <li>
              Action: UI Interaction → wait for the PIN screen,{" "}
              <span className="font-mono">Input Text</span> your Mobile Money PIN, then click{" "}
              <span className="font-mono">Send / OK</span> (grant MacroDroid the Accessibility
              permission).
            </li>
            <li>
              Macro 2 — Trigger: SMS received from{" "}
              <span className="font-mono">MTN Mobile Money</span> → HTTP POST it to the SMS endpoint
              above; the confirmation closes the withdrawal and notifies the user automatically.
            </li>
            <li>
              Optional fallback: after the USSD screen closes, POST the Result URL with the JSON
              body above (use <span className="font-mono">status: "failed"</span> when the transfer
              did not go through).
            </li>
          </ol>
          <p className="text-xs text-amber-500">
            If the SIM has insufficient balance or the transfer fails, the request simply stays
            pending — approve or reject it yourself in Admin → Withdrawals.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg text-primary">Withdrawal access</h2>
        <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
          <div>
            <div className="text-sm font-medium">Require an active investment</div>
            <p className="text-xs text-muted-foreground">
              When enabled, users without an active plan cannot submit withdrawals.
            </p>
          </div>
  <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
    Active-investment withdrawal enforcement is temporarily unavailable until the database migration is applied.
  </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Use the Users page to disable withdrawals for an individual account.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-primary">
          <Share2 className="h-5 w-5" /> Referral program
        </h2>
        <div className="max-w-xs">
          <Label>Referral commission (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={s.referral_percent ?? 5}
            onChange={(e) => set("referral_percent", Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Paid to referrer on every profit payout from their invitees.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-primary">
          <MessageCircle className="h-5 w-5" /> Live chat widgets
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
              Tawk.to (recommended — supports file uploads)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Tawk Property ID</Label>
                <Input
                  value={s.tawk_property_id ?? ""}
                  onChange={(e) => set("tawk_property_id", e.target.value)}
                  placeholder="e.g. 65abc123def456…"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Tawk.to → Admin → Chat Widget → Property ID.
                </p>
              </div>
              <div>
                <Label>Tawk Widget ID</Label>
                <Input
                  value={s.tawk_widget_id ?? ""}
                  onChange={(e) => set("tawk_widget_id", e.target.value)}
                  placeholder="default"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave as "default" unless you have multiple widgets.
                </p>
              </div>
            </div>
          </div>
          <div>
            <Label>SendPulse Chat ID</Label>
            <Input
              value={s.sendpulse_chat_id ?? ""}
              onChange={(e) => set("sendpulse_chat_id", e.target.value)}
              placeholder="e.g. abc123…"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              From SendPulse → Live Chat → Install.
            </p>
          </div>
          <div>
            <Label>Tidio public key</Label>
            <Input
              value={s.tidio_public_key ?? ""}
              onChange={(e) => set("tidio_public_key", e.target.value)}
              placeholder="Optional"
            />
            <p className="mt-1 text-xs text-muted-foreground">Leave empty to disable Tidio.</p>
          </div>
          <div className="sm:col-span-2">
            <Label>SendPulse full embed snippet (recommended)</Label>
            <Textarea
              className="min-h-[120px] font-mono text-xs"
              value={s.sendpulse_embed_html ?? ""}
              onChange={(e) => set("sendpulse_embed_html", e.target.value)}
              placeholder="<script ...></script>  — paste the exact code from SendPulse → Live Chat → Install"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              If filled, this is used instead of the Chat ID. Paste it exactly as SendPulse
              provides.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-primary">
          <Mail className="h-5 w-5" /> SMTP (transactional email)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Host</Label>
            <Input value={s.smtp_host ?? ""} onChange={(e) => set("smtp_host", e.target.value)} />
          </div>
          <div>
            <Label>Port</Label>
            <Input
              type="number"
              value={s.smtp_port ?? 465}
              onChange={(e) => set("smtp_port", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={s.smtp_user ?? ""} onChange={(e) => set("smtp_user", e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={s.smtp_password ?? ""}
              onChange={(e) => set("smtp_password", e.target.value)}
            />
          </div>
          <div>
            <Label>From name</Label>
            <Input
              value={s.smtp_from_name ?? ""}
              onChange={(e) => set("smtp_from_name", e.target.value)}
            />
          </div>
          <div>
            <Label>From email</Label>
            <Input
              value={s.smtp_from_email ?? ""}
              onChange={(e) => set("smtp_from_email", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch checked={!!s.smtp_secure} onCheckedChange={(v) => set("smtp_secure", v)} />
            <span className="text-sm">Use TLS/SSL</span>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-primary">
          <Megaphone className="h-5 w-5" /> Popup notification
        </h2>
        <p className="text-xs text-muted-foreground">
          Shown once to every user. Save with “Show to everyone again” checked to re-display it
          after editing.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch
              checked={!!s.announcement_enabled}
              onCheckedChange={(v) => set("announcement_enabled", v)}
            />
            <span className="text-sm">Enable popup</span>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={s.announcement_title ?? ""}
              onChange={(e) => set("announcement_title", e.target.value)}
              placeholder="Join our official group"
            />
          </div>
          <div>
            <Label>Button label</Label>
            <Input
              value={s.announcement_link_label ?? ""}
              onChange={(e) => set("announcement_link_label", e.target.value)}
              placeholder="Join now"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Message</Label>
            <Textarea
              className="min-h-[100px]"
              value={s.announcement_message ?? ""}
              onChange={(e) => set("announcement_message", e.target.value)}
              placeholder="Write the announcement your users will see…"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Link (WhatsApp / Telegram / any URL)</Label>
            <Input
              value={s.announcement_link ?? ""}
              onChange={(e) => set("announcement_link", e.target.value)}
              placeholder="https://chat.whatsapp.com/…"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Switch checked={reshow} onCheckedChange={setReshow} />
            <span className="text-sm">Show to everyone again on save</span>
          </div>
        </div>
      </section>

      <div className="sticky bottom-20 z-10 md:bottom-4">
        <Button
          onClick={save}
          disabled={busy}
          className="w-full bg-primary text-primary-foreground hover:opacity-90"
        >
          <Save className="mr-2 h-4 w-4" /> {busy ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
