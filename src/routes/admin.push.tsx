import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendPushBroadcast } from "@/lib/push.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/push")({
  component: AdminPush,
});

type Broadcast = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  sent_count: number;
  created_at: string;
};

function AdminPush() {
  const [devices, setDevices] = useState(0);
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [{ count }, { data }] = await Promise.all([
      supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
      supabase
        .from("push_broadcasts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setDevices(count ?? 0);
    setHistory((data ?? []) as Broadcast[]);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const body = String(fd.get("body") ?? "").trim();
    const url = String(fd.get("url") ?? "").trim();
    if (!title || !body) return toast.error("Title and message are required");
    setBusy(true);
    try {
      const res = await sendPushBroadcast({ data: { title, body, url: url || undefined } });
      toast.success(`Sent to ${res.sent} of ${res.devices} device(s)`);
      form.reset();
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary md:text-4xl">Push notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send an instant notification to every user who installed the app and enabled alerts.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Smartphone className="h-5 w-5" />
        </span>
        <div>
          <div className="font-display text-2xl text-primary">{devices}</div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Subscribed devices
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            maxLength={80}
            required
            placeholder="New investment plan available"
          />
        </div>
        <div>
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            name="body"
            maxLength={300}
            required
            rows={3}
            placeholder="Join our group for daily updates…"
          />
        </div>
        <div>
          <Label htmlFor="url">Link (optional)</Label>
          <Input
            id="url"
            name="url"
            placeholder="https://chat.whatsapp.com/… or /dashboard/invest"
          />
        </div>
        <div>
          <Button
            type="submit"
            disabled={busy}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            <BellRing className="mr-2 h-4 w-4" /> {busy ? "Sending…" : "Send push notification"}
          </Button>
        </div>
      </form>

      <div>
        <h2 className="mb-3 font-display text-xl text-primary">Recent broadcasts</h2>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No notifications sent yet.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-sm text-muted-foreground">{b.body}</div>
                    {b.url && <div className="mt-1 break-all text-xs text-primary">{b.url}</div>}
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div>{formatDate(b.created_at)}</div>
                    <div className="font-medium text-foreground">{b.sent_count} sent</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
