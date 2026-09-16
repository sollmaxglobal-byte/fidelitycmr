# SMS forwarder app: recommendation + in-app setup guide

## The app to install

**SMS to URL Forwarder** (developer: Bogomolov) — free, no ads, lets you set a custom URL, custom JSON body and custom headers, which is exactly what this project's endpoint needs.

- Play Store: [https://play.google.com/stores/apps/details?id=tech.bogomolov.incomingsmsgateway](https://play.google.com/store/apps/details?id=tech.bogomolov.incomingsmsgateway)
- Backup (if unavailable in your country): [https://f-droid.org/en/packages/tech.bogomolov.incomingsmsgateway/](https://f-droid.org/en/packages/tech.bogomolov.incomingsmsgateway/)

Note: the popular "SMS Forwarder" by frzinapps only forwards to phones/email/Telegram, not to a custom webhook with headers — it will not work here.

## Settings to enter in the app

- Sender: `MTN Mobile Money` (add a second rule for `Orange Money`, or use `*` to forward everything)
- URL: `https://fidelity-invest.lovable.app/api/public/mm-sms`
- JSON body: `{"text":"%text%","sender":"%from%"}`
- Headers: `x-mm-secret: <your forwarder secret from Admin → Settings>`

Then send yourself a test mobile-money message; it should appear in Admin → Deposits as a received operator message.

## What gets built

Add a "Phone setup" card to the auto-approval section of Admin → Settings so these steps live inside the app instead of in chat:

- Link button to the Play Store app (and the F-Droid fallback).
- The four values above shown as read-only fields with copy buttons: endpoint URL, JSON body template, header name, and header value (secret, masked with reveal).
- A short 4-step checklist and a warning that battery optimisation must be disabled for the forwarder app so it keeps running.

## Technical notes

- Frontend only: edit the existing auto-approval section in `src/routes/admin.settings.tsx`. No database, endpoint, or matching-logic changes.