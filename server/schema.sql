CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  notion_id TEXT UNIQUE,
  name TEXT NOT NULL,
  website TEXT,
  supplier_type TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  notion_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  passport_number TEXT,
  passport_expiry DATE,
  passport_country TEXT,
  frequent_flyer_numbers TEXT,
  seat_preference TEXT,
  dietary_restrictions TEXT,
  emergency_contact TEXT,
  referral_source TEXT,
  preferred_supplier_id INTEGER REFERENCES suppliers(id),
  traveljoy_client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  notion_id TEXT UNIQUE,
  name TEXT NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  destination TEXT,
  trip_type TEXT,
  departure_date DATE,
  return_date DATE,
  number_of_travelers INTEGER,
  trip_value NUMERIC(12,2),
  commission NUMERIC(12,2),
  booking_status TEXT,
  traveljoy_trip_id TEXT,
  needs_sync_to_traveljoy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  notion_id TEXT UNIQUE,
  name TEXT NOT NULL,
  type TEXT,
  client_id INTEGER REFERENCES clients(id),
  trip_id INTEGER REFERENCES trips(id),
  due_date DATE,
  done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Additive columns applied 2026-08-13 to support fields the Notion-based
-- API exposed but the original migration did not carry over. Backfilled
-- from Notion via backfill_new_fields.js (idempotent, COALESCE-based).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS anniversary DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'Expected';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS related_to TEXT;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS notes TEXT;

-- Admin data blob mirror -- added 2026-08-13.
-- DB-backed persistence for the admin SPA's localStorage-only data
-- (clients, trips, commissions, invoices, pay schedules, etc). The
-- frontend's saveData() write-through-syncs here on every write, and
-- hydrateFromServer() seeds a fresh/cleared browser from here on login.
-- See server/index.js: /api/data, /api/data/:key, /api/data-bulk-import.
CREATE TABLE IF NOT EXISTS admin_data_blobs (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
