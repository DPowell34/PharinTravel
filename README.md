# Test paste
Hello world
# Pharin's Travel

Three pieces that work together:

- **`site/`** — the public-facing marketing site (single self-contained
  `index.html`). Hero, services, about, and a contact inquiry form.
- **`dashboard/`** — an internal CRM dashboard (also a single self-contained
  `index.html`) that reads Clients, Trips, and Suppliers from Notion through
  the server's API and displays them in sortable tables.
- **`server/`** — an Express server that is both:
  1. A **TravelJoy <-> Notion bridge**: receives Zapier webhooks from
     TravelJoy (TravelJoy has no public API — Zapier is the only supported
     integration) and syncs Clients/Trips into Notion, and can push Notion
     Trips back out to TravelJoy via a Zapier catch hook.
  2. A **read-only API** (`/api/clients`, `/api/trips`, `/api/suppliers`)
     that the dashboard calls to display CRM data.

## Quick start

```bash
cd server
cp .env.example .env
# fill in NOTION_API_KEY (from https://www.notion.so/my-integrations, after
# sharing your Notion "CRM" page with that integration), WEBHOOK_SECRET, and
# DASHBOARD_API_KEY
npm install
npm start
```

The database IDs in `.env.example` are already filled in for the Pharin's
Travel Notion workspace (Clients, Trips, Suppliers, Activities).

Open `site/index.html` directly in a browser to preview the marketing site —
no build step needed.

Open `dashboard/index.html`, enter your running server's URL and the
`DASHBOARD_API_KEY` you set in `.env`, and click **Connect & Load** to see
live Clients/Trips/Suppliers data.

## Deploying

- `site/` and `dashboard/` are static HTML and can be hosted as-is on GitHub
  Pages, Netlify, Vercel, or any static host.
- `server/` needs a Node host that can run `npm start` and stay online
  (Render, Railway, Fly.io, a small VPS, etc.) — this is also what your
  Zapier webhooks need to reach, so it must be a public HTTPS URL.

## Wiring up TravelJoy via Zapier

See `server/index.js` for the exact webhook payload shapes expected at:

- `POST /webhooks/traveljoy/client` — TravelJoy "New Client" trigger
- `POST /webhooks/traveljoy/trip` — TravelJoy "New Trip" / "New Group Booking" trigger
- `POST /webhooks/traveljoy/commission` — TravelJoy "Commission Updated" trigger

Each of these requires an `X-Webhook-Secret` header matching `WEBHOOK_SECRET`.
Outbound sync (Notion -> TravelJoy) works by flagging a Trip's "Needs Sync to
TravelJoy" checkbox in Notion, then calling `POST /sync/push-all` on the
server, which posts each flagged trip to your `ZAPIER_OUTBOUND_CATCH_URL`
(a Zap with a Catch Hook trigger feeding a TravelJoy "Create/Update Trip"
action).

## Data model (Notion)

- **Clients** — Name, Email, Phone, Date of Birth, Passport Number/Expiry/
  Country, Frequent Flyer Numbers, Seat Preference, Dietary Restrictions,
  Emergency Contact, Referral Source, Preferred Supplier, TravelJoy Client ID
- **Suppliers** — Name, Website, Supplier Type, Phone
- **Trips** — Name, Client, Supplier, Destination, Trip Type, Departure/
  Return Date, Number of Travelers, Trip Value, Commission, Booking Status
  (Inquiry -> Quoted -> Booked -> Deposit Paid -> Paid in Full -> Traveled ->
  Completed / Cancelled), TravelJoy Trip ID, Needs Sync to TravelJoy
- **Activities** — Name, Type, Client, Trip, Due Date, Done
