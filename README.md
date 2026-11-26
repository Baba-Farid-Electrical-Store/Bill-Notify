# BillNotify

Mobile-first invoice SMS dashboard for Baba Farid Electrical Store, Bajakhana, Punjab. It syncs posted customer invoices from Odoo and can notify customers through httpSMS.

## Local setup

1. Use Node.js 20 or newer and run `npm install`.
2. Create a Neon PostgreSQL database and set `DATABASE_URL` in `.env.local`.
3. Create a Clerk application. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `ALLOWED_EMAILS` (comma-separated addresses) in `.env.local`.
4. Add Odoo External API settings (`ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`) and the httpSMS API key and sender (`HTTPSMS_API_KEY`, `HTTPSMS_FROM_NUMBER`). Secrets must stay in server environment variables.
5. Apply the schema with `npm run db:migrate`, then run `npm run dev`.

The initial sync imports invoices in the selected lookback window as `pre-existing, not notified`. It never sends SMS for those invoices. Auto-send remains off until the first sync has completed. Dry-run is enabled by default; keep it enabled while checking the setup. Dry-run records intended messages but does not call the SMS send endpoint.

## Hosting and scheduled sync

Deploy to Vercel and add all environment variables from `.env.example` to the project settings. Configure a `CRON_SECRET`; the daily Vercel cron is included in `vercel.json`. Also configure cron-job.org to call `https://YOUR_DOMAIN/api/cron/sync` every 5–15 minutes with `Authorization: Bearer YOUR_CRON_SECRET`. The route requires the secret and does not trust the Vercel cron header.

To activate SMS sending, confirm Odoo and httpSMS connections, review the first imported invoices, disable dry-run, and enable auto-send in Settings. Manual sends also obey dry-run.

## httpSMS Android phone

Install the httpSMS Android app on the store phone, sign in to the same httpSMS account, enable the phone as a sender in its app settings, and use its configured E.164 sender number for `HTTPSMS_FROM_NUMBER`. Keep the phone online with SMS permission and battery optimization disabled for reliable delivery. Confirm the account API key is set as `HTTPSMS_API_KEY`.

## Features

- Dashboard activity counts and 14-day chart, invoice search, message history, templates and store settings.
- Odoo JSON-RPC invoice read, access-token generation and invoice links.
- PostgreSQL-backed concurrency-safe send claims, retries, dry-run and first-sync protection.
- Clerk sign-in restricted by the `ALLOWED_EMAILS` allow-list.
- PWA manifest with installable app icons.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — Next.js lint
- `npm test` — unit tests
- `npm run db:generate` / `npm run db:migrate` — Drizzle migration workflow
