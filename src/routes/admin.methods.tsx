import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/methods")({
  component: AdminMethods,
});

type Scope = "deposit" | "withdrawal" | "both";

type Method = {
  id: string;
  type: "mobile_money" | "bank_transfer" | "crypto";
  label: string;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
  active: boolean;
  scope: Scope;
};

const SCOPES: { value: Scope; label: string }[] = [
  { value: "deposit", label: "Deposits only" },
  { value: "withdrawal", label: "Withdrawals only" },
  { value: "both", label: "Deposits & withdrawals" },
];

const selectClass =
  "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function AdminMethods() {
  const [list, setList] = useState<Method[]>([]);
  const [tab, setTab] = useState<"all" | Scope>("all");
  const [editing, setEditing] = useState<Method | null>(null);

  async function load() {
    const { data } = await supabase.from("payment_methods").select("*").order("type");
    setList((data as Method[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  const visible = list.filter((m) =>
    tab === "all" ? true : m.scope === tab || m.scope === "both",
  );

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { error } = await supabase.from("payment_methods").insert({
      type: fd.get("type") as Method["type"],
      label: String(fd.get("label")),
      account_name: String(fd.get("account_name") || ""),
      account_number: String(fd.get("account_number") || ""),
      instructions: String(fd.get("instructions") || ""),
      scope: String(fd.get("scope") || "both"),
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Method added");
    form.reset();
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase
      .from("payment_methods")
      .update({
        type: editing.type,
        label: editing.label,
        account_name: editing.account_name,
        account_number: editing.account_number,
        instructions: editing.instructions,
        scope: editing.scope,
        active: editing.active,
      })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Method updated");
    setEditing(null);
    load();
  }

  async function toggle(m: Method) {
    await supabase.from("payment_methods").update({ active: !m.active }).eq("id", m.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this method?")) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    setEditing((e) => (e?.id === id ? null : e));
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary md:text-4xl">
          Deposit & withdrawal methods
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add, edit, enable or delete the channels users see when depositing or withdrawing.
        </p>
      </div>

      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <div>
          <Label>Type</Label>
          <select name="type" required className={selectClass}>
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>
        <div>
          <Label>Used for</Label>
          <select name="scope" required defaultValue="both" className={selectClass}>
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Label</Label>
          <Input name="label" required placeholder="MTN Mobile Money" />
        </div>
        <div>
          <Label>Account name</Label>
          <Input name="account_name" required />
        </div>
        <div className="sm:col-span-2">
          <Label>Account number / Phone / Wallet</Label>
          <Input name="account_number" required />
        </div>
        <div className="sm:col-span-2">
          <Label>Instructions</Label>
          <Textarea name="instructions" rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="mr-1 h-4 w-4" /> Add method
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {(["all", "deposit", "withdrawal"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={`rounded px-3 py-1.5 text-xs font-medium capitalize ${
              tab === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "All" : f === "deposit" ? "Deposit methods" : "Withdrawal methods"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card p-4">
            {editing?.id === m.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <select
                    className={selectClass}
                    value={editing.type}
                    onChange={(e) =>
                      setEditing({ ...editing, type: e.target.value as Method["type"] })
                    }
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div>
                  <Label>Used for</Label>
                  <select
                    className={selectClass}
                    value={editing.scope}
                    onChange={(e) => setEditing({ ...editing, scope: e.target.value as Scope })}
                  >
                    {SCOPES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Label</Label>
                  <Input
                    value={editing.label}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account name</Label>
                  <Input
                    value={editing.account_name ?? ""}
                    onChange={(e) => setEditing({ ...editing, account_name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Account number / Phone / Wallet</Label>
                  <Input
                    value={editing.account_number ?? ""}
                    onChange={(e) => setEditing({ ...editing, account_number: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Instructions</Label>
                  <Textarea
                    rows={3}
                    value={editing.instructions ?? ""}
                    onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Button
                    onClick={saveEdit}
                    className="bg-primary text-primary-foreground hover:opacity-90"
                  >
                    <Save className="mr-1 h-4 w-4" /> Save
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>
                    <X className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg text-primary">{m.label}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                      {m.type.replace("_", " ")}
                    </span>
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                      {m.scope === "both" ? "Deposit & withdrawal" : m.scope}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-muted-foreground">Account:</span> {m.account_name} •{" "}
                    <span className="font-mono">{m.account_number}</span>
                  </div>
                  {m.instructions && (
                    <p className="mt-1 text-xs text-muted-foreground">{m.instructions}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Switch checked={m.active} onCheckedChange={() => toggle(m)} />
                    {m.active ? "Active" : "Inactive"}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(m)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => remove(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
