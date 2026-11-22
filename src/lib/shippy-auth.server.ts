import { timingSafeEqual } from "node:crypto";

/** Rejects any admin request that does not carry the current operations token. */
export async function assertOpsToken(token: unknown) {
  const { opsToken } = await import("@/lib/shippy-settings.server");
  const provided = String(token ?? "");
  const expected = await opsToken();
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Unauthorized");
  }
}
