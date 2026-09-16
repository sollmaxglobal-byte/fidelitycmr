import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-pin")({
  head: () => ({ meta: [{ title: "Reset security PIN — Fidelity" }] }),
  validateSearch: z.object({ kind: z.enum(["withdrawal", "transfer"]).catch("withdrawal") }),
  component: ResetPinPage,
});

const schema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits"),
  confirm: z.string(),
}).refine((data) => data.pin === data.confirm, {
  message: "PINs do not match",
  path: ["confirm"],
});

function ResetPinPage() {
  const { kind } = useSearch({ from: "/reset-pin" });
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const value = schema.parse({ pin: form.get("pin"), confirm: form.get("confirm") });
      const { error } = await supabase.rpc("set_security_pin", { _kind: kind, _pin: value.pin });
      if (error) throw error;
      toast.success(`${kind === "withdrawal" ? "Withdrawal" : "Transfer"} PIN updated`);
      nav({ to: "/dashboard/profile" });
    } catch (error) {
      toast.error(error instanceof z.ZodError ? error.issues[0].message : "We could not update your PIN. The link may have expired.");
    } finally {
      setBusy(false);
    }
  }

  const label = kind === "withdrawal" ? "withdrawal" : "transfer";
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-sm">
        <img src="/fidelity-logo.png" alt="Fidelity Invest" className="mb-6 h-10 w-auto object-contain" />
        <h1 className="font-display text-3xl text-primary">Reset {label} PIN</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new six-digit numeric PIN.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="pin">New PIN</Label>
            <Input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="new-password" />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm PIN</Label>
            <Input id="confirm" name="confirm" type="password" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoComplete="new-password" />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:opacity-90">
            {busy ? "Saving…" : "Update PIN"}
          </Button>
        </form>
      </div>
    </div>
  );
}
