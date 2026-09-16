import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Called right after a user uploads a payment proof. Reads it and tries to auto-approve. */
export const verifyDepositProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { depositId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.depositId)) throw new Error("Invalid deposit id");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { verifyDeposit } = await import("@/lib/deposit-verify.server");
    return verifyDeposit(data.depositId, context.userId);
  });

/** Admin: paste one or more operator confirmation messages and run matching. */
export const ingestMmMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { text: string; sender?: string }) => {
    const text = (data.text ?? "").trim();
    if (text.length < 10 || text.length > 8000)
      throw new Error("Paste the full confirmation message");
    return { text, sender: data.sender?.slice(0, 60) };
  })
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/push.server");
    await assertAdmin(context as never);
    const { ingestMessage } = await import("@/lib/deposit-verify.server");

    const blocks = data.text
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length >= 10);
    const parts = blocks.length ? blocks : [data.text];

    const results = [];
    for (const block of parts) {
      try {
        results.push(await ingestMessage(block, data.sender ?? "admin-paste"));
      } catch (err) {
        results.push({ stored: false, matched: false, reason: (err as Error).message });
      }
    }
    return { results };
  });

/** Admin: re-run verification for a pending deposit. */
export const revalidateDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { depositId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.depositId)) throw new Error("Invalid deposit id");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/push.server");
    await assertAdmin(context as never);
    const { verifyDeposit } = await import("@/lib/deposit-verify.server");
    return verifyDeposit(data.depositId);
  });
