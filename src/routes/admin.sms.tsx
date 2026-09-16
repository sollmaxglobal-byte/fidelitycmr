import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDate, formatXAF } from "@/lib/format";

export const Route = createFileRoute("/admin/sms")({ component: AdminSms });

type Sms = {
  id: string;
  raw_text: string;
  sender: string | null;
  txn_id: string | null;
  amount: number | null;
  received_at: string;
  matched_deposit_id: string | null;
};

function AdminSms() {
  const [messages, setMessages] = useState<Sms[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("mm_messages")
      .select("id,raw_text,sender,txn_id,amount,received_at,matched_deposit_id")
      .order("received_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Could not load forwarded SMS messages");
    setMessages((data ?? []) as Sms[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-primary md:text-4xl">Forwarded SMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every message received from the SMS-to-URL forwarder.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <MessageSquareText className="mx-auto mb-3 h-8 w-8" /> No forwarded SMS messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(message.received_at)}</span>
                  <span>From: {message.sender || "Unknown"}</span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${message.matched_deposit_id ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                    {message.matched_deposit_id ? "Matched deposit" : "Not matched"}
                  </span>
                </div>
                {message.amount != null && <span className="font-display text-lg text-primary">{formatXAF(message.amount)}</span>}
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Transaction ID:</span> <span className="font-mono">{message.txn_id || "Not detected"}</span></div>
                <div><span className="text-muted-foreground">Deposit:</span> <span className="font-mono">{message.matched_deposit_id || "None"}</span></div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-secondary p-3 text-xs leading-relaxed text-foreground">{message.raw_text}</pre>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
