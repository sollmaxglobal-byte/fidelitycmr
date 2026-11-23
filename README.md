# XAF Invest Hub (80)

Create a professional online investment website with manual payments gateway.

Admin dashboard 



The currency is XAF 



THE DASHBOARD SHOULD BE MOBILE FRIENDLY

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fidelity-invest.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c47711f5-315b-4008-944c-466307a2ea61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to Vercel

This is a TanStack Start SSR application, not a static Vite SPA. The Nitro
`vercel` preset generates `.vercel/output/`, including the server function.

- Import this repository with the root directory set to the repository root.
- Use the committed `vercel.json`: `npm ci` for installation, `npm run build`
  for the build, and the **Other** framework preset.
- Remove any dashboard Output Directory override such as `dist` or `dist/client`.
  Vercel consumes the generated Build Output API artifacts automatically.
- Configure variables for both Preview and Production, then redeploy after changes.
- Leave `NODE_ENV` unset or set it to `production` for deployment builds and
  functions. Do not deploy an artifact built with `NODE_ENV=development`.

### Supabase environment variables

The browser build accepts `VITE_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
(or `SUPABASE_URL`) and `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`
(or `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
Vite loads the selected mode's environment files; production builds use
`.env.production`, not `.env.development`. Dashboard values take precedence.
Only public URLs and public/anon keys are injected into the browser bundle.

Server/admin operations additionally require **both** `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in Vercel's runtime environment. Never prefix the
service-role key with `VITE_` or `NEXT_PUBLIC_`, or commit it to this repository.
The Supabase Auth redirect allowlist must include the intended Vercel domain.

### Investigating failed deployments

Open the failing GitHub Vercel check to identify its exact Vercel project and
build logs. Multiple connected Vercel projects report independently; a passing
check for one project does not establish that another project deployed.

A Supabase Preview error stating `Remote migration versions not found in local
migrations directory` is a separate database migration-history problem. Recover
the missing original migrations from the linked project's history and reconcile
them with the repository before applying migrations. Do not mark migrations
applied or modify production migration history just to make the check pass.
