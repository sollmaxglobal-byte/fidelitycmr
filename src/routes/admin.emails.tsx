import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Mail, Send, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { translateTemplateToFrench } from "@/lib/email-translate.functions";

export const Route = createFileRoute("/admin/emails")({
  component: AdminEmails,
});

type Template = {
  key: string;
  name: string;
  subject: string;
  html_body: string;
  subject_fr: string | null;
  html_body_fr: string | null;
  enabled: boolean;
};

function AdminEmails() {
  const { user } = useAuth();
  const [list, setList] = useState<Template[]>([]);
  const [active, setActive] = useState<Template | null>(null);
  const [busy, setBusy] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [tab, setTab] = useState<"en" | "fr">("en");
  const [broadcast, setBroadcast] = useState({ subject: "", html: "" });
  const [broadcastBusy, setBroadcastBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("email_templates")
      .select("key,name,subject,html_body,subject_fr,html_body_fr,enabled")
      .order("name");
    setList((data as Template[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (user?.email && !testTo) setTestTo(user.email);
  }, [user, testTo]);

  async function save() {
    if (!active) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          name: active.name,
          subject: active.subject,
          html_body: active.html_body,
          subject_fr: active.subject_fr,
          html_body_fr: active.html_body_fr,
          enabled: active.enabled,
        })
        .eq("key", active.key);
      if (error) throw error;
      toast.success("Template saved");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(tpl: Template, v: boolean) {
    await supabase.from("email_templates").update({ enabled: v }).eq("key", tpl.key);
    load();
    if (active?.key === tpl.key) setActive({ ...active, enabled: v });
  }

  async function translateToFrench() {
    if (!active) return;
    setBusy(true);
    try {
      const out = await translateTemplateToFrench({
        data: { subject: active.subject, html: active.html_body },
      });
      setActive({ ...active, subject_fr: out.subject, html_body_fr: out.html });
      setTab("fr");
      toast.success("French version generated — review and save");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendBroadcast() {
    if (!broadcast.subject.trim() || !broadcast.html.trim())
      return toast.error("Add a subject and message first");
    setBroadcastBusy(true);
    try {
      const { data: users, error: directoryError } = await supabase.rpc("get_admin_user_emails");
      if (directoryError) throw directoryError;
      const recipients = (users as { email: string }[]).map((item) => item.email).filter(Boolean);
      if (!recipients.length) throw new Error("No users found");
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { to: recipients, subject: broadcast.subject.trim(), html: broadcast.html },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success(`Announcement queued for ${recipients.length} users`);
      setBroadcast({ subject: "", html: "" });
    } catch (e) {
      toast.error("Send failed: " + (e as Error).message);
    } finally {
      setBroadcastBusy(false);
    }
  }

  async function sendTest() {
    if (!active || !testTo) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: testTo,
          template_key: active.key,
          variables: { name: "Test User", amount: "5000 XAF", status: "approved" },
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Test email queued — check your inbox");
    } catch (e) {
      toast.error("Send failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary md:text-4xl">Email templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit subject and HTML body. Use variables like{" "}
          {"{{name}}, {{amount}}, {{status}}, {{site_name}}"}.
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div>
          <h2 className="font-display text-xl text-primary">Send announcement to all users</h2>
          <p className="text-xs text-muted-foreground">
            This uses the existing send-email function and the admin-only user directory.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Input
            value={broadcast.subject}
            onChange={(e) => setBroadcast({ ...broadcast, subject: e.target.value })}
            placeholder="Announcement subject"
            maxLength={180}
          />
          <Textarea
            value={broadcast.html}
            onChange={(e) => setBroadcast({ ...broadcast, html: e.target.value })}
            placeholder="HTML message"
            className="min-h-24 lg:row-span-2"
            maxLength={20000}
          />
          <Button
            type="button"
            onClick={sendBroadcast}
            disabled={broadcastBusy}
            className="lg:w-fit"
          >
            <Send className="mr-2 h-4 w-4" />
            {broadcastBusy ? "Queueing…" : "Send to all users"}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {list.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                active?.key === t.key
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate font-medium text-foreground">{t.name}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{t.subject}</div>
                </div>
                <Switch
                  checked={t.enabled}
                  onCheckedChange={(v) => toggleEnabled(t, v)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </button>
          ))}
        </div>

        <div>
          {!active ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Select a template to edit
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-xl text-primary">{active.name}</h2>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={active.enabled}
                    onCheckedChange={(v) => setActive({ ...active, enabled: v })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {active.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              <div>
                <Label>Display name</Label>
                <Input
                  value={active.name}
                  onChange={(e) => setActive({ ...active, name: e.target.value })}
                />
              </div>
              <div className="inline-flex rounded-xl border border-border bg-background p-1">
                {(["en", "fr"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setTab(l)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tab === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {l === "en" ? "English" : "Français"}
                  </button>
                ))}
              </div>

              {tab === "en" ? (
                <>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={active.subject}
                      onChange={(e) => setActive({ ...active, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>HTML body</Label>
                    <Textarea
                      className="min-h-[280px] font-mono text-xs"
                      value={active.html_body}
                      onChange={(e) => setActive({ ...active, html_body: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Sent automatically to users whose language is French. Falls back to English
                      when empty.
                    </p>
                    <Button size="sm" variant="outline" onClick={translateToFrench} disabled={busy}>
                      <Languages className="mr-2 h-4 w-4" /> Translate from English
                    </Button>
                  </div>
                  <div>
                    <Label>Sujet (FR)</Label>
                    <Input
                      value={active.subject_fr ?? ""}
                      onChange={(e) => setActive({ ...active, subject_fr: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Corps HTML (FR)</Label>
                    <Textarea
                      className="min-h-[280px] font-mono text-xs"
                      value={active.html_body_fr ?? ""}
                      onChange={(e) => setActive({ ...active, html_body_fr: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={save}
                  disabled={busy}
                  className="bg-primary text-primary-foreground hover:opacity-90"
                >
                  <Save className="mr-2 h-4 w-4" /> {busy ? "Saving…" : "Save changes"}
                </Button>
                <div className="ml-auto flex items-end gap-2">
                  <div>
                    <Label>Send test to</Label>
                    <Input
                      type="email"
                      value={testTo}
                      onChange={(e) => setTestTo(e.target.value)}
                      placeholder="you@example.com"
                      className="w-56"
                    />
                  </div>
                  <Button variant="outline" onClick={sendTest} disabled={busy || !testTo}>
                    <Send className="mr-2 h-4 w-4" /> Send test
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
