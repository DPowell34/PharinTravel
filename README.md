# Destined 4 Destinations

Three pieces that work together:

- **`site/`** — the public-facing marketing site: multiple static pages
  (Home, About, Services, Travel Resources, Passport & Visa, Airline Rules,
  Terms & Insurance Waiver, Contact, Request a Quote) sharing `assets/style.css`
  and `assets/site.js`. Generated from `build_site.py` (run `python3
  build_site.py` after editing content in that file, then commit the
  regenerated `.html` files in `site/`).
- **`dashboard/`** — an internal CRM dashboard (self-contained
  `index.html`) that reads Clients, Trips, and Suppliers from Notion through
  the server's API and displays them in sortable tables. Gated behind a
  placeholder employee login (`dashboard/login.html`) — see "Employee login"
  below.
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
no build step needed to view it (only needed if you edit `build_site.py`).

Open `dashboard/login.html` first (default credentials below), then once
logged in you'll land on `dashboard/index.html` — enter your running server's
URL and the `DASHBOARD_API_KEY` you set in `.env`, and click **Connect &
Load** to see live Clients/Trips/Suppliers data.

## Employee login (placeholder)

`dashboard/login.html` + `dashboard/login.js` implement a simple
username/password gate so the CRM isn't wide open to the public:

- Default username: `d4dstaff`
- Default password: `ChangeMe2026!`

**This is a placeholder, not real security** — the credentials live in
client-side JavaScript (`dashboard/login.js`), so anyone who views the page
source can read them. It's enough to stop casual visitors from landing on
the CRM tables, but before storing real client data behind it, replace this
with a real auth provider: Netlify Identity (invite-only), Auth0, or a login
endpoint added to `server/` that issues a real session token. Change the
default password in `dashboard/login.js` immediately either way.

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
