// One-time backfill for columns added after the original Notion->Postgres
// migration (clients.anniversary/notes, suppliers.notes, trips.notes/
// commission_status, activities.related_to/notes). Safe to re-run.
require('dotenv').config();
const { Client } = require('@notionhq/client');
const { Pool } = require('pg');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const CLIENTS_DB = process.env.NOTION_CLIENTS_DB_ID;
const TRIPS_DB = process.env.NOTION_TRIPS_DB_ID;
const SUPPLIERS_DB = process.env.NOTION_SUPPLIERS_DB_ID;
const ACTIVITIES_DB = process.env.NOTION_ACTIVITIES_DB_ID;

function plainTitle(p) { return (p && p.title && p.title[0] && p.title[0].plain_text) || ''; }
function plainRT(p) { return (p && p.rich_text && p.rich_text[0] && p.rich_text[0].plain_text) || null; }
function getDate(p) { return (p && p.date && p.date.start) || null; }
function getSelect(p) { return (p && p.select && p.select.name) || null; }

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
  console.log('Backfilling new columns from Notion...');

  const clientPages = await queryAll(CLIENTS_DB);
  let n = 0;
  for (const page of clientPages) {
    const props = page.properties;
    const anniversary = getDate(props['Anniversary']);
    const notes = plainRT(props['Notes']);
    if (anniversary === null && notes === null) continue;
    await pool.query(
      `UPDATE clients SET anniversary = COALESCE($2, anniversary), notes = COALESCE($3, notes) WHERE notion_id = $1`,
      [page.id, anniversary, notes]
    );
    n++;
  }
  console.log(`clients backfilled: ${n}/${clientPages.length}`);

  const supplierPages = await queryAll(SUPPLIERS_DB);
  n = 0;
  for (const page of supplierPages) {
    const props = page.properties;
    const notes = plainRT(props['Notes']);
    if (notes === null) continue;
    await pool.query(`UPDATE suppliers SET notes = $2 WHERE notion_id = $1`, [page.id, notes]);
    n++;
  }
  console.log(`suppliers backfilled: ${n}/${supplierPages.length}`);

  const tripPages = await queryAll(TRIPS_DB);
  n = 0;
  for (const page of tripPages) {
    const props = page.properties;
    const notes = plainRT(props['Notes']);
    const commissionStatus = getSelect(props['Commission Status']);
    if (notes === null && commissionStatus === null) continue;
    await pool.query(
      `UPDATE trips SET notes = COALESCE($2, notes), commission_status = COALESCE($3, commission_status) WHERE notion_id = $1`,
      [page.id, notes, commissionStatus]
    );
    n++;
  }
  console.log(`trips backfilled: ${n}/${tripPages.length}`);

  const taskPages = await queryAll(ACTIVITIES_DB);
  n = 0;
  for (const page of taskPages) {
    const props = page.properties;
    const relatedTo = plainRT(props['Related To']);
    const notes = plainRT(props['Notes']);
    if (relatedTo === null && notes === null) continue;
    await pool.query(
      `UPDATE activities SET related_to = COALESCE($2, related_to), notes = COALESCE($3, notes) WHERE notion_id = $1`,
      [page.id, relatedTo, notes]
    );
    n++;
  }
  console.log(`activities backfilled: ${n}/${taskPages.length}`);

  console.log('Backfill complete.');
  await pool.end();
}

main().catch((err) => { console.error('Backfill failed:', err); process.exit(1); });
