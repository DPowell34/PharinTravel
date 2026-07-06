require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const CLIENTS_DB = process.env.NOTION_CLIENTS_DB_ID;
const TRIPS_DB = process.env.NOTION_TRIPS_DB_ID;
const SUPPLIERS_DB = process.env.NOTION_SUPPLIERS_DB_ID;

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// Notion helpers
// ============================================================================

function rt(text) {
  return { rich_text: [{ text: { content: String(text ?? "") } }] };
}
function title(text) {
  return { title: [{ text: { content: String(text ?? "") } }] };
}
function num(n) {
  return { number: n === undefined || n === null || n === "" ? null : Number(n) };
}
function date(iso) {
  return { date: iso ? { start: iso } : null };
}
function select(name) {
  return { select: name ? { name } : null };
}
function checkbox(bool) {
  return { checkbox: !!bool };
}
function relation(pageIds) {
  return { relation: (pageIds || []).filter(Boolean).map((id) => ({ id })) };
}
function prop(page, name) {
  return page.properties[name];
}
function plainText(richTextProp) {
  return (richTextProp?.rich_text || richTextProp?.title || [])
    .map((t) => t.plain_text)
    .join("");
}

async function findPageByProperty(databaseId, propertyName, propertyType, value) {
  const filter = { property: propertyName };
  filter[propertyType] = { equals: value };
  const response = await notion.databases.query({ database_id: databaseId, filter, page_size: 1 });
  return response.results[0] || null;
}

// ---- Clients ----

async function findClientByEmail(email) {
  if (!email) return null;
  return findPageByProperty(CLIENTS_DB, "Email", "email", email);
}
async function findClientByTravelJoyId(travelJoyId) {
  if (!travelJoyId) return null;
  return findPageByProperty(CLIENTS_DB, "TravelJoy Client ID", "rich_text", travelJoyId);
}
async function upsertClient(payload) {
  const existing =
    (await findClientByTravelJoyId(payload.travelJoyClientId)) ||
    (await findClientByEmail(payload.email));

  const properties = {};
  if (payload.name) properties["Name"] = title(payload.name);
  if (payload.email) properties["Email"] = { email: payload.email };
  if (payload.phone) properties["Phone"] = { phone_number: payload.phone };
  if (payload.travelJoyClientId) properties["TravelJoy Client ID"] = rt(payload.travelJoyClientId);
  if (payload.dateOfBirth) properties["Date of Birth"] = date(payload.dateOfBirth);
  if (payload.passportNumber) properties["Passport Number"] = rt(payload.passportNumber);
  if (payload.passportExpiry) properties["Passport Expiry"] = date(payload.passportExpiry);
  if (payload.passportCountry) properties["Passport Country"] = rt(payload.passportCountry);
  if (payload.frequentFlyerNumbers)
    properties["Frequent Flyer Numbers"] = rt(payload.frequentFlyerNumbers);
  if (payload.notes) properties["Notes"] = rt(payload.notes);

  if (existing) {
    await notion.pages.update({ page_id: existing.id, properties });
    return existing.id;
  }
  const created = await notion.pages.create({ parent: { database_id: CLIENTS_DB }, properties });
  return created.id;
}

// ---- Suppliers ----

async function findSupplierByName(name) {
  if (!name) return null;
  return findPageByProperty(SUPPLIERS_DB, "Name", "title", name);
}
async function upsertSupplier(name, supplierType) {
  if (!name) return null;
  const existing = await findSupplierByName(name);
  if (existing) return existing.id;
  const properties = { Name: title(name) };
  if (supplierType) properties["Supplier Type"] = select(supplierType);
  const created = await notion.pages.create({ parent: { database_id: SUPPLIERS_DB }, properties });
  return created.id;
}

// ---- Trips ----

async function findTripByTravelJoyId(travelJoyId) {
  if (!travelJoyId) return null;
  return findPageByProperty(TRIPS_DB, "TravelJoy Trip ID", "rich_text", travelJoyId);
}
async function upsertTrip(payload) {
  const existing = await findTripByTravelJoyId(payload.travelJoyTripId);
  const properties = {};
  if (payload.name) properties["Name"] = title(payload.name);
  if (payload.travelJoyTripId) properties["TravelJoy Trip ID"] = rt(payload.travelJoyTripId);
  if (payload.clientPageId) properties["Client"] = relation([payload.clientPageId]);
  if (payload.supplierPageId) properties["Supplier"] = relation([payload.supplierPageId]);
  if (payload.destination) properties["Destination"] = rt(payload.destination);
  if (payload.tripType) properties["Trip Type"] = select(payload.tripType);
  if (payload.departureDate) properties["Departure Date"] = date(payload.departureDate);
  if (payload.returnDate) properties["Return Date"] = date(payload.returnDate);
  if (payload.numberOfTravelers !== undefined)
    properties["Number of Travelers"] = num(payload.numberOfTravelers);
  if (payload.tripValue !== undefined) properties["Trip Value"] = num(payload.tripValue);
  if (payload.commission !== undefined) properties["Commission"] = num(payload.commission);
  if (payload.bookingStatus) properties["Booking Status"] = select(payload.bookingStatus);
  if (payload.notes) properties["Notes"] = rt(payload.notes);

  if (existing) {
    await notion.pages.update({ page_id: existing.id, properties });
    return existing.id;
  }
  const created = await notion.pages.create({ parent: { database_id: TRIPS_DB }, properties });
  return created.id;
}
async function updateTripCommission(travelJoyTripId, commission) {
  const trip = await findTripByTravelJoyId(travelJoyTripId);
  if (!trip) return null;
  await notion.pages.update({ page_id: trip.id, properties: { Commission: num(commission) } });
  return trip.id;
}
async function findTripsPendingSync() {
  const response = await notion.databases.query({
    database_id: TRIPS_DB,
    filter: { property: "Needs Sync to TravelJoy", checkbox: { equals: true } },
  });
  return response.results;
}
async function clearNeedsSync(pageId) {
  await notion.pages.update({
    page_id: pageId,
    properties: { "Needs Sync to TravelJoy": checkbox(false) },
  });
}

async function tripPageToPayload(page) {
  const clientRelation = prop(page, "Client")?.relation?.[0];
  let clientEmail = null;
  let clientName = null;
  if (clientRelation) {
    const clientPage = await notion.pages.retrieve({ page_id: clientRelation.id });
    clientEmail = clientPage.properties["Email"]?.email || null;
    clientName = plainText(clientPage.properties["Name"]);
  }
  return {
    trip_id: plainText(prop(page, "TravelJoy Trip ID")) || undefined,
    trip_name: plainText(prop(page, "Name")),
    client_email: clientEmail,
    client_name: clientName,
    destination: plainText(prop(page, "Destination")),
    trip_type: prop(page, "Trip Type")?.select?.name,
    departure_date: prop(page, "Departure Date")?.date?.start,
    return_date: prop(page, "Return Date")?.date?.start,
    number_of_travelers: prop(page, "Number of Travelers")?.number,
    trip_value: prop(page, "Trip Value")?.number,
    commission: prop(page, "Commission")?.number,
    booking_status: prop(page, "Booking Status")?.select?.name,
    notes: plainText(prop(page, "Notes")),
    notion_page_id: page.id,
  };
}
async function pushTripToZapier(page) {
  if (!process.env.ZAPIER_OUTBOUND_CATCH_URL) {
    throw new Error("ZAPIER_OUTBOUND_CATCH_URL is not set");
  }
  const payload = await tripPageToPayload(page);
  await axios.post(process.env.ZAPIER_OUTBOUND_CATCH_URL, payload);
  await clearNeedsSync(page.id);
  return payload;
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
  const provided = req.header("X-Api-Key");
  if (!process.env.DASHBOARD_API_KEY || provided !== process.env.DASHBOARD_API_KEY) {
    return res.status(401).json({ error: "invalid or missing X-Api-Key header" });
  }
  next();
}

// ============================================================================
// Routes
// ============================================================================

app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- Inbound: TravelJoy (via Zapier) -> Notion ----

app.post("/webhooks/traveljoy/client", requireWebhookSecret, async (req, res) => {
  try {
    const b = req.body || {};
    const name = b.name || [b.first_name, b.last_name].filter(Boolean).join(" ");
    const pageId = await upsertClient({
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
    res.json({ ok: true, notionPageId: pageId });
  } catch (err) {
    console.error("POST /webhooks/traveljoy/client failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/webhooks/traveljoy/trip", requireWebhookSecret, async (req, res) => {
  try {
    const b = req.body || {};
    const clientPageId = await upsertClient({
      name: b.client_name,
      email: b.client_email,
      travelJoyClientId: b.client_id,
    });
    let supplierPageId = null;
    if (b.supplier_name) {
      supplierPageId = await upsertSupplier(b.supplier_name, b.supplier_type);
    }
    const pageId = await upsertTrip({
      name: b.trip_name || b.name,
      travelJoyTripId: b.trip_id || b.id,
      clientPageId,
      supplierPageId,
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
    res.json({ ok: true, notionPageId: pageId });
  } catch (err) {
    console.error("POST /webhooks/traveljoy/trip failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/webhooks/traveljoy/commission", requireWebhookSecret, async (req, res) => {
  try {
    const b = req.body || {};
    const pageId = await updateTripCommission(b.trip_id || b.id, b.commission);
    if (!pageId) {
      return res
        .status(404)
        .json({ ok: false, error: `No Trip found with TravelJoy Trip ID ${b.trip_id}` });
    }
    res.json({ ok: true, notionPageId: pageId });
  } catch (err) {
    console.error("POST /webhooks/traveljoy/commission failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Outbound: Notion -> Zapier catch hook -> TravelJoy ----

app.get("/sync/pending", requireWebhookSecret, async (_req, res) => {
  try {
    const pages = await findTripsPendingSync();
    const payloads = await Promise.all(pages.map(tripPageToPayload));
    res.json({ ok: true, count: payloads.length, trips: payloads });
  } catch (err) {
    console.error("GET /sync/pending failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/sync/push-all", requireWebhookSecret, async (_req, res) => {
  try {
    const pages = await findTripsPendingSync();
    const results = [];
    for (const page of pages) results.push(await pushTripToZapier(page));
    res.json({ ok: true, pushed: results.length, trips: results });
  } catch (err) {
    console.error("POST /sync/push-all failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/sync/push/:pageId", requireWebhookSecret, async (req, res) => {
  try {
    const page = await notion.pages.retrieve({ page_id: req.params.pageId });
    const payload = await pushTripToZapier(page);
    res.json({ ok: true, trip: payload });
  } catch (err) {
    console.error("POST /sync/push/:pageId failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- Read-only API for the dashboard (site/dashboard) ----

app.get("/api/clients", requireApiKey, async (_req, res) => {
  try {
    const response = await notion.databases.query({ database_id: CLIENTS_DB, page_size: 100 });
    const clients = response.results.map((page) => ({
      id: page.id,
      name: plainText(prop(page, "Name")),
      email: prop(page, "Email")?.email || null,
      phone: prop(page, "Phone")?.phone_number || null,
      passport_expiry: prop(page, "Passport Expiry")?.date?.start || null,
      referral_source: prop(page, "Referral Source")?.select?.name || null,
    }));
    res.json({ ok: true, clients });
  } catch (err) {
    console.error("GET /api/clients failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/suppliers", requireApiKey, async (_req, res) => {
  try {
    const response = await notion.databases.query({ database_id: SUPPLIERS_DB, page_size: 100 });
    const suppliers = response.results.map((page) => ({
      id: page.id,
      name: plainText(prop(page, "Name")),
      supplier_type: prop(page, "Supplier Type")?.select?.name || null,
      website: prop(page, "Website")?.url || null,
      phone: prop(page, "Phone")?.phone_number || null,
    }));
    res.json({ ok: true, suppliers });
  } catch (err) {
    console.error("GET /api/suppliers failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/trips", requireApiKey, async (_req, res) => {
  try {
    const response = await notion.databases.query({ database_id: TRIPS_DB, page_size: 100 });
    const trips = await Promise.all(response.results.map(tripPageToPayload));
    res.json({ ok: true, trips });
  } catch (err) {
    console.error("GET /api/trips failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Pharin's Travel server listening on port ${PORT}`);
});
