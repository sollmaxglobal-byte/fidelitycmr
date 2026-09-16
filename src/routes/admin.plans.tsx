import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatXAF } from "@/lib/format";

export const Route = createFileRoute("/admin/plans")({
  component: AdminPlans,
});

type Plan = {
  id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number;
  daily_roi_percent: number;
  duration_days: number;
  active: boolean;
  profit_type: "percent" | "fixed";
  fixed_daily_profit: number;
  payout_frequency: "daily" | "weekly" | "monthly" | "end_of_term";
  amount_type: "range" | "fixed";
  fixed_amount: number;
};

function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profitType, setProfitType] = useState<"percent" | "fixed">("percent");
  const [amountType, setAmountType] = useState<"range" | "fixed">("range");
  const [editing, setEditing] = useState<Plan | null>(null);

  async function load() {
    const { data } = await supabase.from("plans").select("*").order("min_amount");
    setPlans((data as Plan[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fixedAmt = Number(fd.get("fixed_amount") || 0);
    const minA = amountType === "fixed" ? fixedAmt : Number(fd.get("min_amount"));
    const maxA = amountType === "fixed" ? fixedAmt : Number(fd.get("max_amount"));
    const { error } = await supabase.from("plans").insert({
      name: String(fd.get("name")),
      description: String(fd.get("description") || ""),
      amount_type: amountType,
      fixed_amount: amountType === "fixed" ? fixedAmt : 0,
      min_amount: minA,
      max_amount: maxA,
      duration_days: Number(fd.get("duration_days")),
      profit_type: profitType,
      daily_roi_percent: profitType === "percent" ? Number(fd.get("daily_roi_percent")) : 0,
      fixed_daily_profit: profitType === "fixed" ? Number(fd.get("fixed_daily_profit")) : 0,
      payout_frequency: String(fd.get("payout_frequency") || "daily"),
      active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Plan created");
    (e.target as HTMLFormElement).reset();
    setProfitType("percent");
    setAmountType("range");
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const isFixedAmt = editing.amount_type === "fixed";
    const { error } = await supabase
      .from("plans")
      .update({
        name: editing.name,
        description: editing.description,
        amount_type: editing.amount_type,
        fixed_amount: isFixedAmt ? Number(editing.fixed_amount) : 0,
        min_amount: isFixedAmt ? Number(editing.fixed_amount) : Number(editing.min_amount),
        max_amount: isFixedAmt ? Number(editing.fixed_amount) : Number(editing.max_amount),
        duration_days: Number(editing.duration_days),
        profit_type: editing.profit_type,
        daily_roi_percent:
          editing.profit_type === "percent" ? Number(editing.daily_roi_percent) : 0,
        fixed_daily_profit:
          editing.profit_type === "fixed" ? Number(editing.fixed_daily_profit) : 0,
        payout_frequency: editing.payout_frequency,
        active: editing.active,
      })
      .eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Plan updated");
    setEditing(null);
    load();
  }

  async function toggle(p: Plan) {
    await supabase.from("plans").update({ active: !p.active }).eq("id", p.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this plan?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-primary md:text-4xl">Investment plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create plans paying daily profit (percent of capital or fixed XAF).
        </p>
      </div>

      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 md:grid-cols-3"
      >
        <div>
          <Label>Name</Label>
          <Input name="name" required />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Input name="description" />
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <Label>Investment amount</Label>
          <div className="mt-2 inline-flex rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setAmountType("range")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${amountType === "range" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Range (min–max)
            </button>
            <button
              type="button"
              onClick={() => setAmountType("fixed")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${amountType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Fixed amount
            </button>
          </div>
        </div>
        {amountType === "range" ? (
          <>
            <div>
              <Label>Min (XAF)</Label>
              <Input name="min_amount" type="number" required min={0} />
            </div>
            <div>
              <Label>Max (XAF)</Label>
              <Input name="max_amount" type="number" required min={0} />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <Label>Fixed amount (XAF)</Label>
            <Input name="fixed_amount" type="number" required min={0} />
          </div>
        )}
        <div>
          <Label>Duration (days)</Label>
          <Input name="duration_days" type="number" required min={1} />
        </div>

        <div className="sm:col-span-2 md:col-span-3">
          <Label>Daily profit type</Label>
          <div className="mt-2 inline-flex rounded-xl border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setProfitType("percent")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${profitType === "percent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setProfitType("fixed")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${profitType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Fixed XAF
            </button>
          </div>
        </div>

        {profitType === "percent" ? (
          <div>
            <Label>Daily ROI %</Label>
            <Input name="daily_roi_percent" type="number" step={0.01} required min={0} />
          </div>
        ) : (
          <div>
            <Label>Fixed daily profit (XAF)</Label>
            <Input name="fixed_daily_profit" type="number" step={100} required min={0} />
          </div>
        )}

        <div>
          <Label>Payout frequency</Label>
          <select
            name="payout_frequency"
            required
            defaultValue="daily"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="end_of_term">End of term</option>
          </select>
        </div>

        <div className="sm:col-span-2 md:col-span-3">
          <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="mr-1 h-4 w-4" /> Add plan
          </Button>
        </div>
      </form>

      {editing && (
        <div className="space-y-3 rounded-2xl border-2 border-primary bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-primary">Edit plan</h2>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <Label>Investment amount</Label>
              <div className="mt-2 inline-flex rounded-xl border border-border bg-background p-1">
                {(["range", "fixed"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEditing({ ...editing, amount_type: v })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${editing.amount_type === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {v === "range" ? "Range (min–max)" : "Fixed amount"}
                  </button>
                ))}
              </div>
            </div>
            {editing.amount_type === "range" ? (
              <>
                <div>
                  <Label>Min (XAF)</Label>
                  <Input
                    type="number"
                    value={editing.min_amount}
                    onChange={(e) => setEditing({ ...editing, min_amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max (XAF)</Label>
                  <Input
                    type="number"
                    value={editing.max_amount}
                    onChange={(e) => setEditing({ ...editing, max_amount: Number(e.target.value) })}
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <Label>Fixed amount (XAF)</Label>
                <Input
                  type="number"
                  value={editing.fixed_amount}
                  onChange={(e) => setEditing({ ...editing, fixed_amount: Number(e.target.value) })}
                />
              </div>
            )}
            <div>
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={editing.duration_days}
                onChange={(e) => setEditing({ ...editing, duration_days: Number(e.target.value) })}
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <Label>Daily profit type</Label>
              <div className="mt-2 inline-flex rounded-xl border border-border bg-background p-1">
                {(["percent", "fixed"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEditing({ ...editing, profit_type: v })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${editing.profit_type === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {v === "percent" ? "Percentage (%)" : "Fixed XAF"}
                  </button>
                ))}
              </div>
            </div>
            {editing.profit_type === "percent" ? (
              <div>
                <Label>Daily ROI %</Label>
                <Input
                  type="number"
                  step={0.01}
                  value={editing.daily_roi_percent}
                  onChange={(e) =>
                    setEditing({ ...editing, daily_roi_percent: Number(e.target.value) })
                  }
                />
              </div>
            ) : (
              <div>
                <Label>Fixed daily profit (XAF)</Label>
                <Input
                  type="number"
                  step={100}
                  value={editing.fixed_daily_profit}
                  onChange={(e) =>
                    setEditing({ ...editing, fixed_daily_profit: Number(e.target.value) })
                  }
                />
              </div>
            )}
            <div>
              <Label>Payout frequency</Label>
              <select
                value={editing.payout_frequency}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    payout_frequency: e.target.value as Plan["payout_frequency"],
                  })
                }
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="end_of_term">End of term</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveEdit}
              className="bg-primary text-primary-foreground hover:opacity-90"
            >
              <Save className="mr-2 h-4 w-4" /> Save changes
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {plans.map((p) => {
          const isFixed = p.profit_type === "fixed";
          const dailyLabel = isFixed
            ? `${formatXAF(p.fixed_daily_profit)}/day`
            : `${p.daily_roi_percent}%/day`;
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-xl text-primary">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.description}</div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Amount</div>
                      <div>
                        {p.amount_type === "fixed"
                          ? formatXAF(p.fixed_amount)
                          : `${formatXAF(p.min_amount)} – ${formatXAF(p.max_amount)}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Daily profit</div>
                      <div>{dailyLabel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Payout</div>
                      <div className="capitalize">
                        {(p.payout_frequency ?? "daily").replace("_", " ")}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div>{p.duration_days} days</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Switch checked={p.active} onCheckedChange={() => toggle(p)} />
                    {p.active ? "Active" : "Inactive"}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
