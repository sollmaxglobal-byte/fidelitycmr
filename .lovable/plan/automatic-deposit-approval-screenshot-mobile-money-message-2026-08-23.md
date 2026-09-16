# Automatic deposit approval (screenshot + mobile money message)

Goal: when a user uploads a payment screenshot, the system reads it, compares it to the real mobile-money confirmation message, and auto-approves the deposit only when the transaction ID matches and the amount received equals the amount submitted on the website. Everything else stays pending for manual review.

## How it works

```text
User uploads screenshot ──► AI reads it (transaction ID, amount, receiver, date)
                                        │
Your phone's MM confirmation SMS ──► secure inbox in the app
                                        │
                          Strict match: same transaction ID
                                     AND received amount == submitted amount
                              ├── match  ─► approve, credit balance, receipt + push
                              └── no match ─► stays pending, admin sees why
```

Important: a website cannot read SMS off your phone by itself. Two supported ways to feed the messages in, both wired up:

1. Automatic (Android): a free SMS-forwarder app on your phone posts MTN/Orange Money messages to a secret endpoint in the app. Once configured, deposits approve with no action from you.
2. Manual fallback: an admin box where you paste one or more confirmation messages; the same matching runs immediately and clears any pending deposit that matches.

## What gets built

### 1. Mobile-money message inbox
- New table for received operator messages: raw text, parsed transaction ID, parsed amount, parsed payer number, received time, matched deposit.
- A parser for MTN Mobile Money and Orange Money message formats (French and English wording), plus a generic fallback that extracts the longest reference-looking token and the amount.
- Public endpoint `/api/public/mm-sms` protected by a secret header token; it stores the message, parses it, then tries to match any pending deposit.
- Admin paste box on the deposits page for the manual path.

### 2. Screenshot reading
- After the proof is uploaded, a server function creates a short-lived signed URL for the image and sends it to the Lovable AI vision model, asking for strict JSON: transaction ID, amount, currency, receiver name/number, payer number, date/time.
- The extracted values are stored on the deposit so you can always see what the system read.
- If the read fails or is unreadable, the deposit simply stays pending (never auto-rejected).

### 3. Strict matching and auto-approval
Auto-approve only when all of these hold:
- Transaction ID from the screenshot equals the transaction ID in a received operator message (compared case-insensitively, ignoring spaces/dashes).
- The amount in that operator message equals the amount the user submitted on the website, exactly.
- The screenshot amount also equals the submitted amount.
- The operator message is not already used by another deposit, and the message was received within the last 24 hours.
- The deposit is still pending.

Everything else leaves the deposit pending with a readable reason ("amount mismatch: received 4 500, submitted 5 000", "no matching operator message yet", "transaction ID already used").

Approval runs in a single secure database routine so a deposit can never be credited twice: mark approved, credit the balance, write the transaction row, link the message. Existing receipt email and push notification flows fire as they do today.

Matching is attempted from both directions: when a screenshot is read (message may already be in), and when a message arrives (screenshot may already be in).

### 4. Screens
- Deposit pending page: shows "Verifying your payment automatically…" with the existing animated loader and 15-minute window; flips to approved as soon as the match succeeds (already realtime-driven), otherwise falls through to deposit history as today.
- Admin deposits: each row gains a verification panel — what the AI read, which operator message it matched (or why not), and a badge for Auto-approved / Awaiting message / Mismatch. Manual approve and reject stay available and unchanged.
- Admin settings: the forwarder endpoint URL and a "regenerate secret" action, with short setup steps for the SMS-forwarder app.

### 5. Safety rails
- One operator message can approve at most one deposit.
- Same transaction ID can never be approved twice, even across users.
- Amounts compared as whole numbers after stripping spaces, dots and currency text.
- Auto-approval is capped by an admin-set maximum amount (default: no cap, configurable) so large deposits can be forced to manual review.
- The webhook endpoint rejects requests without the correct secret and rate-limits per minute.

## Technical notes

- New table `mm_messages` with grants, RLS (admin read; writes only via the verified endpoint using the service role) and a unique index on the normalized transaction ID.
- New deposit columns: `ocr_txn_id`, `ocr_amount`, `ocr_payer`, `ocr_raw` (jsonb), `auto_note`, `matched_message_id`, `auto_approved_at`.
- New settings columns: `mm_webhook_secret`, `auto_approve_max_amount`, `auto_approve_enabled`.
- `public.auto_approve_deposit(_deposit_id uuid, _message_id uuid)` — security definer, idempotent, does the credit + transaction insert.
- Server functions in `src/lib/deposit-verify.functions.ts` (+ `.server.ts` helper) using `google/gemini-3-flash` via the AI Gateway with an `image_url` block on the signed URL; gateway errors surfaced, only 429/5xx retried with backoff.
- Route `src/routes/api/public/mm-sms.ts` verifying the shared secret with a timing-safe compare and validating input with Zod.
- Secret `MM_SMS_WEBHOOK_SECRET` added via the secrets tool.
- `src/routes/deposit-proof.tsx` calls the verification function after insert (fire-and-forget; the user still lands on the pending page immediately).

## After the build

I'll test end to end: submit a deposit with a sample screenshot, post a matching message to the endpoint, and confirm the deposit auto-approves and credits the balance — plus a mismatched-amount case that must stay pending. Then I'll give you the exact forwarder-app setup (endpoint URL, header, filter on the operator sender).
