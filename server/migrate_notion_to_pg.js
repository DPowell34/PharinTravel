require('dotenv').config();
const { Client } = require('@notionhq/client');
const { Pool } = require('pg');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CLIENTS_DB = process.env.NOTION_CLIENTS_DB_ID;
const TRIPS_DB = process.env.NOTION_TRIPS_DB_ID;
const SUPPLIERS_DB = process.env.NOTION_SUPPLIERS_DB_ID;
const ACTIVITIES_DB = process.env.NOTION_ACTIVITIES_DB_ID;

function plainTitle(p) {
  return (p && p.title && p.title[0] && p.title[0].plain_text) || '';
}
function plainRT(p) {
  return (p && p.rich_text && p.rich_text[0] && p.rich_text[0].plain_text) || null;
}
function getDate(p) {
  return (p && p.date && p.date.start) || null;
}
function getSelect(p) {
  return (p && p.select && p.select.name) || null;
}
function getNumber(p) {
  return (p && typeof p.number === 'number') ? p.number : null;
}
function getCheckbox(p) {
  return !!(p && p.checkbox);
}
function getEmail(p) {
  return (p && p.email) || null;
}
function getPhone(p) {
  return (p && p.phone_number) || null;
}
function getRelationIds(p) {
  return (p && p.relation && p.relation.map(r => r.id)) || [];
}

async function queryAll(databaseId) {
  if (!databaseId) return [];
  let results = [];
  let cursor = undefined;
  do {
    const resp = await notion.databases.query({ database_id: databaseId, start_cursor: cursor });
    results = results.concat(resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function main() {
  console.log('Fetching from Notion...');
  const [supplierPages, clientPages, tripPages, taskPages] = await Promise.all([
    queryAll(SUPPLIERS_DB),
    queryAll(CLIENTS_DB),
    queryAll(TRIPS_DB),
    queryAll(ACTIVITIES_DB),
  ]);
  console.log(`Suppliers: ${supplierPages.length}, Clients: ${clientPages.length}, Trips: ${tripPages.length}, Activities: ${taskPages.length}`);

  const supplierIdMap = {};
  for (const page of supplierPages) {
    const props = page.properties;
    const name = plainTitle(props['Name']);
    const website = props['Website'] && props['Website'].url;
    const supplierType = getSelect(props['Supplier Type']);
    const phone = getPhone(props['Phone']);
    const res = await pool.query(
      `INSERT INTO suppliers (notion_id, name, website, supplier_type, phone, updated_at)
       VALUES ($1,$2,$3,$4,$5, now())
       ON CONFLICT (notion_id) DO UPDATE SET name=$2, website=$3, supplier_type=$4, phone=$5, updated_at=now()
       RETURNING id`,
      [page.id, name, website, supplierType, phone]
    );
    supplierIdMap[page.id] = res.rows[0].id;
  }

  const clientIdMap = {};
  for (const page of clientPages) {
    const props = page.properties;
    const name = plainTitle(props['Name']);
    const email = getEmail(props['Email']);
    const phone = getPhone(props['Phone']);
    const dob = getDate(props['Date of Birth']);
    const passportNumber = plainRT(props['Passport Number']);
    const passportExpiry = getDate(props['Passport Expiry']);
    const passportCountry = plainRT(props['Passport Country']);
    const ffNumbers = plainRT(props['Frequent Flyer Numbers']);
    const seatPref = getSelect(props['Seat Preference']);
    const dietary = plainRT(props['Dietary Restrictions']);
    const emergencyContact = plainRT(props['Emergency Contact']);
    const referralSource = plainRT(props['Referral Source']);
    const travelJoyId = plainRT(props['TravelJoy Client ID']);
    const supplierRel = getRelationIds(props['Preferred Supplier']);
    const preferredSupplierPgId = supplierRel[0] ? (supplierIdMap[supplierRel[0]] || null) : null;
    const res = await pool.query(
      `INSERT INTO clients (notion_id, name, email, phone, date_of_birth, passport_number, passport_expiry, passport_country, frequent_flyer_numbers, seat_preference, dietary_restrictions, emergency_contact, referral_source, preferred_supplier_id, traveljoy_client_id, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15, now())
       ON CONFLICT (notion_id) DO UPDATE SET name=$2, email=$3, phone=$4, date_of_birth=$5, passport_number=$6, passport_expiry=$7, passport_country=$8, frequent_flyer_numbers=$9, seat_preference=$10, dietary_restrictions=$11, emergency_contact=$12, referral_source=$13, preferred_supplier_id=$14, traveljoy_client_id=$15, updated_at=now()
       RETURNING id`,
      [page.id, name, email, phone, dob, passportNumber, passportExpiry, passportCountry, ffNumbers, seatPref, dietary, emergencyContact, referralSource, preferredSupplierPgId, travelJoyId]
    );
    clientIdMap[page.id] = res.rows[0].id;
  }

  for (const page of tripPages) {
    const props = page.properties;
    const name = plainTitle(props['Name']);
    const clientRel = getRelationIds(props['Client']);
    const supplierRel = getRelationIds(props['Supplier']);
    const clientPgId = clientRel[0] ? (clientIdMap[clientRel[0]] || null) : null;
    const supplierPgId = supplierRel[0] ? (supplierIdMap[supplierRel[0]] || null) : null;
    const destination = plainRT(props['Destination']);
    const tripType = getSelect(props['Trip Type']);
    const departureDate = getDate(props['Departure Date']);
    const returnDate = getDate(props['Return Date']);
    const numTravelers = getNumber(props['Number of Travelers']);
    const tripValue = getNumber(props['Trip Value']);
    const commission = getNumber(props['Commission']);
    const bookingStatus = getSelect(props['Booking Status']);
    const travelJoyTripId = plainRT(props['TravelJoy Trip ID']);
    const needsSync = getCheckbox(props['Needs Sync to TravelJoy']);
    await pool.query(
      `INSERT INTO trips (notion_id, name, client_id, supplier_id, destination, trip_type, departure_date, return_date, number_of_travelers, trip_value, commission, booking_status, traveljoy_trip_id, needs_sync_to_traveljoy, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
       ON CONFLICT (notion_id) DO UPDATE SET name=$2, client_id=$3, supplier_id=$4, destination=$5, trip_type=$6, departure_date=$7, return_date=$8, number_of_travelers=$9, trip_value=$10, commission=$11, booking_status=$12, traveljoy_trip_id=$13, needs_sync_to_traveljoy=$14, updated_at=now()`,
      [page.id, name, clientPgId, supplierPgId, destination, tripType, departureDate, returnDate, numTravelers, tripValue, commission, bookingStatus, travelJoyTripId, needsSync]
    );
  }

  for (const page of taskPages) {
    const props = page.properties;
    const title = plainTitle(props['Title']);
    const dueDate = getDate(props['Due Date']);
    const relatedTo = plainRT(props['Related To']);
    const done = getCheckbox(props['Done']);
    await pool.query(
      `INSERT INTO activities (notion_id, name, due_date, done, updated_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (notion_id) DO UPDATE SET name=$2, due_date=$3, done=$4, updated_at=now()`,
      [page.id, title || relatedTo || '(untitled)', dueDate, done]
    );
  }

  console.log('Migration complete.');
  await pool.end();
}

main().catch(err => { console.error('Migration failed:', err); process.exit(1); });
