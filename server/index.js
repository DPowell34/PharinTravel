require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const REVIEWS_FILE = path.join(__dirname, "reviews.json");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const app = express();
app.use(cors());
app.use(express.json());

// ---- Admin session auth (unchanged) ----
const SESSION_SECRET = process.env.SESSION_SECRET || "CHANGE_ME";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Agent1038";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
function d4dSign(exp){ const h=crypto.createHmac("sha256",SESSION_SECRET).update(String(exp)).digest("hex"); return exp+"."+h; }
function d4dVerify(tok){ if(!tok) return false; const i=tok.indexOf("."); if(i<0) return false; const exp=tok.slice(0,i), sig=tok.slice(i+1); const good=crypto.createHmac("sha256",SESSION_SECRET).update(exp).digest("hex"); if(sig.length!==good.length) return false; try{ if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(good))) return false; }catch(e){ return false; } return Number(exp) > Date.now(); }
function d4dCookies(req){ const out={}; const c=req.headers.cookie; if(!c) return out; c.split(";").forEach(function(p){ const idx=p.indexOf("="); if(idx>-1) out[p.slice(0,idx).trim()]=p.slice(idx+1).trim(); }); return out; }
app.post("/auth/login", function(req,res){ const pw=(req.body&&req.body.password)||""; if(pw!==ADMIN_PASSWORD) return res.status(401).json({ok:false,error:"Invalid password"}); const exp=Date.now()+SESSION_TTL_MS; res.setHeader("Set-Cookie","d4d_session="+d4dSign(exp)+"; HttpOnly; Secure; SameSite=Lax; Path=/"); res.json({ok:true}); });
app.post("/auth/logout", function(req,res){ res.setHeader("Set-Cookie","d4d_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"); res.json({ok:true}); });
app.get("/auth/verify", function(req,res){ if(d4dVerify(d4dCookies(req)["d4d_session"])) return res.status(200).send("ok"); return res.status(401).send("unauthorized"); });
app.get("/auth/whoami", function(req,res){ if(d4dVerify(d4dCookies(req)["d4d_session"])) return res.status(200).json({ok:true}); return res.status(401).json({ok:false}); });
// ---- end admin session auth ----

// ============================================================================
// Postgres helpers
// ============================================================================

async function q(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}
async function q1(text, params) {
  const rows = await q(text, params);
  return rows[0] || null;
}

function clientRowToPayload(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    date_of_birth: row.date_of_birth,
    anniversary: row.anniversary,
    passport_number: row.passport_number,
    passport_expiry: row.passport_expiry,
    passport_country: row.passport_country,
    frequent_flyer_numbers: row.frequent_flyer_numbers,
    dietary_restrictions: row.dietary_restrictions,
    seat_preference: row.seat_preference,
    emergency_contact: row.emergency_contact,
    referral_source: row.referral_source,
    travel_joy_client_id: row.traveljoy_client_id,
    notes: row.notes,
    created_time: row.created_at,
  };
}
function supplierRowToPayload(row) {
  return {
    id: row.id,
    name: row.name,
    supplier_type: row.supplier_type,
    website: row.website,
    phone: row.phone,
    notes: row.notes,
    created_time: row.created_at,
  };
}
async function tripRowToPayload(row) {
  let clientEmail = null, clientName = null;
  if (row.client_id) {
    const c = await q1("SELECT name, email FROM clients WHERE id = $1", [row.client_id]);
    if (c) { clientName = c.name; clientEmail = c.email; }
  }
  let supplierName = null;
  if (row.supplier_id) {
    const s = await q1("SELECT name FROM suppliers WHERE id = $1", [row.supplier_id]);
    if (s) supplierName = s.name;
  }
  return {
    trip_id: row.traveljoy_trip_id || undefined,
    trip_name: row.name,
    id: row.id,
    client_id: row.client_id,
    client_email: clientEmail,
    client_name: clientName,
    supplier_id: row.supplier_id,
    supplier_name: supplierName,
    destination: row.destination,
    trip_type: row.trip_type,
    departure_date: row.departure_date,
    return_date: row.return_date,
    number_of_travelers: row.number_of_travelers,
    trip_value: row.trip_value !== null ? Number(row.trip_value) : null,
    commission: row.commission !== null ? Number(row.commission) : null,
    commission_status: row.commission_status || "Expected",
    booking_status: row.booking_status,
    notes: row.notes,
    notion_page_id: row.notion_id,
    created_time: row.created_at,
  };
}
function taskRowToPayload(row) {
  return {
    id: row.id,
    title: row.name,
    due_date: row.due_date,
    related_to: row.related_to,
    notes: row.notes,
    done: !!row.done,
    created_time: row.created_at,
  };
}

// ---- Clients ----

async function findSupplierIdByName(name) {
  if (!name) return null;
  const row = await q1("SELECT id FROM suppliers WHERE name = $1 LIMIT 1", [name]);
  return row ? row.id : null;
}
async function upsertSupplier(name, supplierType) {
  if (!name) return null;
  const existing = await q1("SELECT id FROM suppliers WHERE name = $1 LIMIT 1", [name]);
  if (existing) return existing.id;
  const created = await q1(
    `INSERT INTO suppliers (name, supplier_type, updated_at) VALUES ($1, $2, now()) RETURNING id`,
    [name, supplierType || null]
  );
  return created.id;
}

async function upsertClientByTravelJoyOrEmail(payload) {
  let existing = null;
  if (payload.travelJoyClientId) {
    existing = await q1("SELECT id FROM clients WHERE traveljoy_client_id = $1 LIMIT 1", [payload.travelJoyClientId]);
  }
  if (!existing && payload.email) {
    existing = await q1("SELECT id FROM clients WHERE email = $1 LIMIT 1", [payload.email]);
  }
  const fields = clientPayloadToFields(payload);
  if (existing) {
    await updateClientFields(existing.id, fields);
    return existing.id;
  }
  const created = await q1(
    `INSERT INTO clients (name, email, phone, traveljoy_client_id, date_of_birth, passport_number, passport_expiry, passport_country, frequent_flyer_numbers, notes, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now()) RETURNING id`,
    [fields.name || "(unnamed)", fields.email, fields.phone, fields.traveljoy_client_id, fields.date_of_birth, fields.passport_number, fields.passport_expiry, fields.passport_country, fields.frequent_flyer_numbers, fields.notes]
  );
  return created.id;
}

function clientPayloadToFields(payload) {
  return {
    name: payload.name,
    email: payload.email || null,
    phone: payload.phone || null,
    traveljoy_client_id: payload.travelJoyClientId || null,
    date_of_birth: payload.dateOfBirth || null,
    passport_number: payload.passportNumber || null,
    passport_expiry: payload.passportExpiry || null,
    passport_country: payload.passportCountry || null,
    frequent_flyer_numbers: payload.frequentFlyerNumbers || null,
    anniversary: payload.anniversary || null,
    dietary_restrictions: payload.dietaryRestrictions || null,
    seat_preference: payload.seatPreference || null,
    emergency_contact: payload.emergencyContact || null,
    referral_source: payload.referralSource || null,
    notes: payload.notes || null,
  };
}
async function updateClientFields(id, payload) {
  const fields = clientPayloadToFields(payload);
  const cols = Object.keys(fields).filter((k) => payload[Object.keys(payload).find((pk) => clientPayloadToFields({ [pk]: payload[pk] })[k] !== undefined)] !== undefined || fields[k] !== undefined);
  // Simpler: just build a fixed UPDATE with COALESCE-free direct set of all known columns.
  await q(
    `UPDATE clients SET
       name = COALESCE($2, name),
       email = $3, phone = $4, traveljoy_client_id = COALESCE($5, traveljoy_client_id),
       date_of_birth = $6, passport_number = $7, passport_expiry = $8, passport_country = $9,
       frequent_flyer_numbers = $10, anniversary = $11, dietary_restrictions = $12,
       seat_preference = $13, emergency_contact = $14, referral_source = $15, notes = $16,
       updated_at = now()
     WHERE id = $1`,
    [id, fields.name, fields.email, fields.phone, fields.traveljoy_client_id, fields.date_of_birth,
     fields.passport_number, fields.passport_expiry, fields.passport_country, fields.frequent_flyer_numbers,
     fields.anniversary, fields.dietary_restrictions, fields.seat_preference, fields.emergency_contact,
     fields.referral_source, fields.notes]
  );
}

// ---- Trips ----

async function findTripIdByTravelJoyId(travelJoyId) {
  if (!travelJoyId) return null;
  const row = await q1("SELECT id FROM trips WHERE traveljoy_trip_id = $1 LIMIT 1", [travelJoyId]);
  return row ? row.id : null;
}
function tripPayloadToFields(payload) {
  return {
    name: payload.name,
    traveljoy_trip_id: payload.travelJoyTripId || null,
    client_id: payload.clientPageId || null,
    supplier_id: payload.supplierPageId || null,
    destination: payload.destination || null,
    trip_type: payload.tripType || null,
    departure_date: payload.departureDate || null,
    return_date: payload.returnDate || null,
    number_of_travelers: payload.numberOfTravelers !== undefined ? payload.numberOfTravelers : null,
    trip_value: payload.tripValue !== undefined ? payload.tripValue : null,
    commission: payload.commission !== undefined ? payload.commission : null,
    booking_status: payload.bookingStatus || null,
    commission_status: payload.commissionStatus || null,
    notes: payload.notes || null,
  };
}
async function upsertTrip(payload) {
  const existingId = await findTripIdByTravelJoyId(payload.travelJoyTripId);
  const f = tripPayloadToFields(payload);
  if (existingId) {
    await q(
      `UPDATE trips SET name=COALESCE($2,name), client_id=$3, supplier_id=$4, destination=$5, trip_type=$6,
         departure_date=$7, return_date=$8, number_of_travelers=$9, trip_value=$10, commission=$11,
         booking_status=$12, commission_status=COALESCE($13,commission_status), notes=$14, updated_at=now()
       WHERE id=$1`,
      [existingId, f.name, f.client_id, f.supplier_id, f.destination, f.trip_type, f.departure_date, f.return_date,
       f.number_of_travelers, f.trip_value, f.commission, f.booking_status, f.commission_status, f.notes]
    );
    return existingId;
  }
  const created = await q1(
    `INSERT INTO trips (name, traveljoy_trip_id, client_id, supplier_id, destination, trip_type, departure_date,
       return_date, number_of_travelers, trip_value, commission, booking_status, commission_status, notes, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now()) RETURNING id`,
    [f.name || "(unnamed trip)", f.traveljoy_trip_id, f.client_id, f.supplier_id, f.destination, f.trip_type,
     f.departure_date, f.return_date, f.number_of_travelers, f.trip_value, f.commission, f.booking_status,
     f.commission_status, f.notes]
  );
  return created.id;
}
async function updateTripCommission(travelJoyTripId, commission) {
  const id = await findTripIdByTravelJoyId(travelJoyTripId);
  if (!id) return null;
  await q("UPDATE trips SET commission = $2, updated_at = now() WHERE id = $1", [id, commission]);
  return id;
}
async function findTripsPendingSync() {
  return q("SELECT * FROM trips WHERE needs_sync_to_traveljoy = true");
}
async function clearNeedsSync(id) {
  await q("UPDATE trips SET needs_sync_to_traveljoy = false WHERE id = $1", [id]);
}
async function pushTripToZapier(row) {
  if (!process.env.ZAPIER_OUTBOUND_CATCH_URL) {
    throw new Error("ZAPIER_OUTBOUND_CATCH_URL is not set");
  }
  const payload = await tripRowToPayload(row);
  await axios.post(process.env.ZAPIER_OUTBOUND_CATCH_URL, payload);
  await clearNeedsSync(row.id);
  return payload;
}

// ---- Tasks (activities) ----

function taskPayloadToFields(payload) {
  return {
    name: payload.title || payload.relatedTo || "(untitled)",
    due_date: payload.dueDate || null,
    related_to: payload.relatedTo || null,
    notes: payload.notes || null,
    done: payload.done !== undefined ? !!payload.done : undefined,
  };
}

// ============================================================================
// Auth middleware
// ============================================================================

function requireWebhookSecret(req, res, next) {
  const provided = req.header("X-Webhook-Secret");
  if (!process.env.WEBHOOK_SECRET || provided !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: "invalid or missing X-Webhook-Secret header" });
  }
  next();
}

function requireApiKey(req, res, next) {
  // Allow either a valid admin session cookie (browser SPA calls) or the X-Api-Key header (webhook/integration calls).
  try {
    if (d4dVerify(d4dCookies(req)["d4d_session"])) return next();
  } catch (e) {}
  const provided = (req.header("X-Api-Key") || "").trim();
  const expected = (process.env.DASHBOARD_API_KEY || "").trim();
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: "invalid or missing X-Api-Key header" });
  }
  next();
}

// ============================================================================
// Routes
// ============================================================================

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected" });
  } catch (err) {
    res.status(500).json({ ok: false, db: "unreachable", error: err.message });
  }
});

// ---- Inbound: TravelJoy (via Zapier) -> Postgres ----

app.post("/webhooks/traveljoy/client", requireWebhookSecret, async (req, res) => {
  try {
    const b = req.body || {};
    const name = b.name || [b.first_name, b.last_name].filter(Boolean).join(" ");
    const id = await upsertClientByTravelJoyOrEmail({
      name,
      email: b.email,
      phone: b.phone,
      travelJoyClientId: b.client_id || b.id,
      dateOfBirth: b.date_of_birth,
      passportNumber: b.passport_number,
      passportExpiry: b.passport_expiry,
      passportCountry: b.passport_country,
      frequentFlyerNumbers: b.frequent_flyer_numbers,
      notes: b.notes,
    });
    res.json({ ok: true, id });
  } catch (err) {
    console.error("POST /webhooks/traveljoy/client failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/webhooks/traveljoy/trip", requireWebhookSecret, async (req, res) => {
  try {
    const b = req.body || {};
    const clientId = await upsertClientByTravelJoyOrEmail({
      name: b.client_name,
      email: b.client_email,
      travelJoyClientId: b.client_id,
    });
    let supplierId = null;
    if (b.supplier_name) {
      supplierId = await upsertSupplier(b.supplier_name, b.supplier_type);
    }
    const id = await upsertTrip({
      name: b.trip_name || b.name,
      travelJoyTripId: b.trip_id || b.id,
      clientPageId: clientId,
      supplierPageId: supplierId,
      destination: b.destination,
      tripType: b.trip_type,
      departureDate: b.departure_date,
      returnDate: b.return_date,
      numberOfTravelers: b.number_of_travelers,
      tripValue: b.trip_value,
      commission: b.commission,
      bookingStatus: b.booking_status,
      notes: b.notes,
    });
    res.json({ ok: true, id });
  } catch (err) {
    console.error("POST /webhooks/traveljoy/trip failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/webhooks/traveljoy/commission", requireWebhookSecret, async (req, res) => {
  try {
    const b = req.body || {};
    const id = await updateTripCommission(b.trip_id || b.id, b.commission);
    if (!id) {
      return res.status(404).json({ ok: false, error: `No Trip found with TravelJoy Trip ID ${b.trip_id}` });
    }
    res.json({ ok: true, id });
  } catch (err) {
    console.error("POST /webhooks/traveljoy/commission failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Outbound: Postgres -> Zapier catch hook -> TravelJoy ----

app.get("/sync/pending", requireWebhookSecret, async (_req, res) => {
  try {
    const rows = await findTripsPendingSync();
    const payloads = await Promise.all(rows.map(tripRowToPayload));
    res.json({ ok: true, count: payloads.length, trips: payloads });
  } catch (err) {
    console.error("GET /sync/pending failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/sync/push-all", requireWebhookSecret, async (_req, res) => {
  try {
    const rows = await findTripsPendingSync();
    const results = [];
    for (const row of rows) results.push(await pushTripToZapier(row));
    res.json({ ok: true, pushed: results.length, trips: results });
  } catch (err) {
    console.error("POST /sync/push-all failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/sync/push/:pageId", requireWebhookSecret, async (req, res) => {
  try {
    const row = await q1("SELECT * FROM trips WHERE id = $1", [req.params.pageId]);
    if (!row) return res.status(404).json({ ok: false, error: "trip not found" });
    const payload = await pushTripToZapier(row);
    res.json({ ok: true, trip: payload });
  } catch (err) {
    console.error("POST /sync/push/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Read-only list API for the dashboard ----

app.get("/api/clients", requireApiKey, async (_req, res) => {
  try {
    const rows = await q("SELECT * FROM clients ORDER BY name");
    res.json({ ok: true, clients: rows.map(clientRowToPayload) });
  } catch (err) {
    console.error("GET /api/clients failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/suppliers", requireApiKey, async (_req, res) => {
  try {
    const rows = await q("SELECT * FROM suppliers ORDER BY name");
    res.json({ ok: true, suppliers: rows.map(supplierRowToPayload) });
  } catch (err) {
    console.error("GET /api/suppliers failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/trips", requireApiKey, async (_req, res) => {
  try {
    const rows = await q("SELECT * FROM trips ORDER BY departure_date NULLS LAST");
    const trips = await Promise.all(rows.map(tripRowToPayload));
    res.json({ ok: true, trips });
  } catch (err) {
    console.error("GET /api/trips failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Single-record detail API ----

app.get("/api/clients/:pageId", requireApiKey, async (req, res) => {
  try {
    const row = await q1("SELECT * FROM clients WHERE id = $1", [req.params.pageId]);
    if (!row) return res.status(404).json({ ok: false, error: "client not found" });
    res.json({ ok: true, client: clientRowToPayload(row) });
  } catch (err) {
    console.error("GET /api/clients/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/suppliers/:pageId", requireApiKey, async (req, res) => {
  try {
    const row = await q1("SELECT * FROM suppliers WHERE id = $1", [req.params.pageId]);
    if (!row) return res.status(404).json({ ok: false, error: "supplier not found" });
    res.json({ ok: true, supplier: supplierRowToPayload(row) });
  } catch (err) {
    console.error("GET /api/suppliers/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/trips/:pageId", requireApiKey, async (req, res) => {
  try {
    const row = await q1("SELECT * FROM trips WHERE id = $1", [req.params.pageId]);
    if (!row) return res.status(404).json({ ok: false, error: "trip not found" });
    res.json({ ok: true, trip: await tripRowToPayload(row) });
  } catch (err) {
    console.error("GET /api/trips/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Write API for the dashboard input page (create + update) ----

app.post("/api/clients", requireApiKey, async (req, res) => {
  try {
    const f = clientPayloadToFields(req.body || {});
    const created = await q1(
      `INSERT INTO clients (name, email, phone, date_of_birth, passport_number, passport_expiry, passport_country,
         frequent_flyer_numbers, anniversary, dietary_restrictions, seat_preference, emergency_contact,
         referral_source, notes, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now()) RETURNING id`,
      [f.name || "(unnamed)", f.email, f.phone, f.date_of_birth, f.passport_number, f.passport_expiry,
       f.passport_country, f.frequent_flyer_numbers, f.anniversary, f.dietary_restrictions, f.seat_preference,
       f.emergency_contact, f.referral_source, f.notes]
    );
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error("POST /api/clients failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put("/api/clients/:pageId", requireApiKey, async (req, res) => {
  try {
    await updateClientFields(req.params.pageId, req.body || {});
    res.json({ ok: true, id: req.params.pageId });
  } catch (err) {
    console.error("PUT /api/clients/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/suppliers", requireApiKey, async (req, res) => {
  try {
    const b = req.body || {};
    const created = await q1(
      `INSERT INTO suppliers (name, supplier_type, website, phone, notes, updated_at)
       VALUES ($1,$2,$3,$4,$5, now()) RETURNING id`,
      [b.name || "(unnamed)", b.supplierType || null, b.website || null, b.phone || null, b.notes || null]
    );
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error("POST /api/suppliers failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put("/api/suppliers/:pageId", requireApiKey, async (req, res) => {
  try {
    const b = req.body || {};
    await q(
      `UPDATE suppliers SET name=COALESCE($2,name), supplier_type=$3, website=$4, phone=$5, notes=$6, updated_at=now() WHERE id=$1`,
      [req.params.pageId, b.name, b.supplierType || null, b.website || null, b.phone || null, b.notes || null]
    );
    res.json({ ok: true, id: req.params.pageId });
  } catch (err) {
    console.error("PUT /api/suppliers/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/trips", requireApiKey, async (req, res) => {
  try {
    const f = tripPayloadToFields(req.body || {});
    const created = await q1(
      `INSERT INTO trips (name, client_id, supplier_id, destination, trip_type, departure_date, return_date,
         number_of_travelers, trip_value, commission, booking_status, commission_status, notes,
         needs_sync_to_traveljoy, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, true, now()) RETURNING id`,
      [f.name || "(unnamed trip)", f.client_id, f.supplier_id, f.destination, f.trip_type, f.departure_date,
       f.return_date, f.number_of_travelers, f.trip_value, f.commission, f.booking_status, f.commission_status, f.notes]
    );
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error("POST /api/trips failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put("/api/trips/:pageId", requireApiKey, async (req, res) => {
  try {
    const f = tripPayloadToFields(req.body || {});
    await q(
      `UPDATE trips SET name=COALESCE($2,name), client_id=$3, supplier_id=$4, destination=$5, trip_type=$6,
         departure_date=$7, return_date=$8, number_of_travelers=$9, trip_value=$10, commission=$11,
         booking_status=$12, commission_status=$13, notes=$14, needs_sync_to_traveljoy=true, updated_at=now()
       WHERE id=$1`,
      [req.params.pageId, f.name, f.client_id, f.supplier_id, f.destination, f.trip_type, f.departure_date,
       f.return_date, f.number_of_travelers, f.trip_value, f.commission, f.booking_status, f.commission_status, f.notes]
    );
    res.json({ ok: true, id: req.params.pageId });
  } catch (err) {
    console.error("PUT /api/trips/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Tasks API (backed by activities table) ----

app.get("/api/tasks", requireApiKey, async (_req, res) => {
  try {
    const rows = await q("SELECT * FROM activities ORDER BY due_date NULLS LAST");
    res.json({ ok: true, tasks: rows.map(taskRowToPayload) });
  } catch (err) {
    console.error("GET /api/tasks failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/tasks/:pageId", requireApiKey, async (req, res) => {
  try {
    const row = await q1("SELECT * FROM activities WHERE id = $1", [req.params.pageId]);
    if (!row) return res.status(404).json({ ok: false, error: "task not found" });
    res.json({ ok: true, task: taskRowToPayload(row) });
  } catch (err) {
    console.error("GET /api/tasks/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/tasks", requireApiKey, async (req, res) => {
  try {
    const f = taskPayloadToFields(req.body || {});
    const created = await q1(
      `INSERT INTO activities (name, due_date, related_to, notes, done, updated_at)
       VALUES ($1,$2,$3,$4,$5, now()) RETURNING id`,
      [f.name, f.due_date, f.related_to, f.notes, !!f.done]
    );
    res.status(201).json({ ok: true, id: created.id });
  } catch (err) {
    console.error("POST /api/tasks failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.put("/api/tasks/:pageId", requireApiKey, async (req, res) => {
  try {
    const f = taskPayloadToFields(req.body || {});
    await q(
      `UPDATE activities SET name=COALESCE($2,name), due_date=$3, related_to=$4, notes=$5,
         done=COALESCE($6,done), updated_at=now() WHERE id=$1`,
      [req.params.pageId, f.name, f.due_date, f.related_to, f.notes, f.done]
    );
    res.json({ ok: true, id: req.params.pageId });
  } catch (err) {
    console.error("PUT /api/tasks/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Reviews (public, site-facing; unchanged, file-backed) ----

function readReviews() {
  try {
    const raw = fs.readFileSync(REVIEWS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}
function writeReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

app.get("/api/reviews", (_req, res) => {
  const reviews = readReviews().sort(function (a, b) {
    return new Date(b.date) - new Date(a.date);
  });
  const count = reviews.length;
  const total = reviews.reduce(function (sum, r) { return sum + r.rating; }, 0);
  const average = count ? Math.round((total / count) * 10) / 10 : 0;
  res.json({ ok: true, reviews: reviews, average: average, count: count });
});

app.post("/api/reviews", (req, res) => {
  const b = req.body || {};
  const name = String(b.name || "").trim().slice(0, 80);
  const text = String(b.text || "").trim().slice(0, 1000);
  const rating = Math.round(Number(b.rating));

  if (!name || !text) {
    return res.status(400).json({ ok: false, error: "name and text are required" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ ok: false, error: "rating must be an integer from 1 to 5" });
  }

  const review = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name,
    rating: rating,
    text: text,
    date: new Date().toISOString(),
  };

  const reviews = readReviews();
  reviews.push(review);
  writeReviews(reviews);

  res.status(201).json({ ok: true, review: review });
});

const PORT = process.env.PORT || 3000;
// ============================================================
// Admin data blob mirror -- DB-backed persistence for the admin
// SPA's localStorage-only data (clients, trips, commissions, etc).
// Added 2026-08-13.
// ============================================================
function isValidBlobKey(key) {
  return typeof key === "string" && key.length > 0 && key.length <= 100 && /^[a-zA-Z0-9_]+$/.test(key);
}

app.get("/api/data", requireApiKey, async (_req, res) => {
  try {
    const rows = await q("SELECT key, data, updated_at FROM admin_data_blobs");
    const out = {};
    rows.forEach(r => { out[r.key] = r.data; });
    res.json({ ok: true, data: out });
  } catch (err) {
    console.error("GET /api/data failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/data/:key", requireApiKey, async (req, res) => {
  try {
    const row = await q1("SELECT data, updated_at FROM admin_data_blobs WHERE key = $1", [req.params.key]);
    if (!row) return res.status(404).json({ ok: false, error: "no blob for key" });
    res.json({ ok: true, data: row.data, updated_at: row.updated_at });
  } catch (err) {
    console.error("GET /api/data/:key failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/data/:key", requireApiKey, async (req, res) => {
  try {
    const key = req.params.key;
    if (!isValidBlobKey(key)) return res.status(400).json({ ok: false, error: "invalid key" });
    const data = JSON.stringify(req.body);
    await q("INSERT INTO admin_data_blobs (key, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = now()", [key, data]);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/data/:key failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Bulk import: accepts the full localStorage backup JSON exactly as produced by
// the admin panel's exportAllData() (Settings -> Security -> Download Backup),
// and upserts every d4d_/d4dcrm_-prefixed key into the blob mirror in one shot.
app.post("/api/data-bulk-import", requireApiKey, async (req, res) => {
  try {
    const backup = req.body || {};
    const imported = [];
    const skipped = [];
    for (const rawKey of Object.keys(backup)) {
      let key = rawKey;
      if (key.indexOf("d4d_") === 0) key = key.slice(4);
      else if (key.indexOf("d4dcrm_") === 0) key = key.slice(7);
      if (!isValidBlobKey(key)) { skipped.push(rawKey); continue; }
      await q("INSERT INTO admin_data_blobs (key, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET data = $2, updated_at = now()", [key, JSON.stringify(backup[rawKey])]);
      imported.push(key);
    }
    res.json({ ok: true, imported, skipped });
  } catch (err) {
    console.error("POST /api/data-bulk-import failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Pharin's Travel server (Postgres-backed) listening on port ${PORT}`);
});
