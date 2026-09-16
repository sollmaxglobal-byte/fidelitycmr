# SMS forwarder: no code changes needed — F-Droid app works as-is

## What changed from the previous plan
The earlier plan assumed "SMS to URL Forwarder" (Bogomolov) was gone from the Play Store and proposed
switching to other apps + loosening the webhook. That premise was wrong: the app **is** available on
F-Droid (and GitHub releases) and the user has installed it. Google Play's SMS-permission policy
forbids this kind of app on the Play Store entirely — F-Droid/GitHub is the official channel, not a
"dead link."

The current `/api/public/mm-sms` endpoint already accepts exactly what this app sends:
- The app's **Json Payload Template** field lets the user emit `{"text":"%text%","sender":"%from%"}`,
  which matches the endpoint's strict Zod schema (`text` required, `sender` optional).
- The app's **Headers** field lets the user pass `x-mm-secret`, which the endpoint already reads.
- Zod's default strip mode drops the extra keys the app's *default* template adds (`from`, `sentStamp`,
  `receivedStamp`, `sim`), so even the untouched default template would be accepted (only `text` is
  required and it's present).

So the endpoint is already compatible. **No endpoint change, no admin-UI change is required.**

## Decision: do nothing to the code
- Keep the strict `{"text","sender"}` JSON validation (stricter = more secure; the supported app
  can emit it directly, so there's no reason to accept form-encoded/plain-text/query-param bodies).
- Keep the existing Admin → Settings → Phone setup card (it already documents the F-Droid link,
  the endpoint URL, the body template, and the header name/value with copy + regenerate buttons).

## Configuration handed to the user (informational, not a build step)
The user tapped "+" in the app. The exact values to enter (also visible in Admin → Settings → Phone
setup with copy buttons):

- Sender: `MTN Mobile Money` (add a 2nd rule for `Orange Money`, or `*` for all)
- Webhook URL: `https://fidelity-invest.lovable.app/api/public/mm-sms`
- Json Payload Template: `{"text":"%text%","sender":"%from%"}`
- Headers: `{"x-mm-secret":"<mm_webhook_secret from app_settings>"}`
- Number of retries: 10 · Ignore SSL: off · Chunked Mode: off · Sign with HMAC-SHA-256: off
- After saving: tap Test (expect 200), then send a real MTN/Orange SMS.
- Disable battery optimisation for the app; turn off RCS in Google Messages if SMS doesn't arrive.

The webhook secret is the admin's own value from `app_settings.mm_webhook_secret` (shown with a
reveal/copy button in Admin → Settings and regenerable there); it is not stored or echoed in code.

## Technical notes (verified against app source)
- App source placeholders: `%from%`, `%text%`, `%sentStamp%`, `%receivedStamp%`, `%sim%`, plus
  device-health and `Regex=…`. The recommended template uses `%text%` + `%from%`.
- `ForwardingConfig.getDefaultJsonTemplate()` is the multi-key default; the custom template above
  produces a clean 2-key body.
- Headers field is a JSON object of name→value pairs applied via `setRequestProperty`; the user can
  set just `{"x-mm-secret":"…"}` (User-agent not required by the endpoint).
- Endpoint reads secret from `x-mm-secret` header, `Authorization: Bearer`, or a `secret` field in the
  JSON body — all three are already supported by `src/routes/api/public/mm-sms.ts`.
