/**
 * db.js — SQLite database via sql.js (WebAssembly SQLite)
 *
 * sql.js is the official SQLite engine compiled to WASM.
 * - No native compilation required
 * - Full SQL support
 * - Data persisted to logs/calls.db (binary SQLite file)
 */
const path    = require('path');
const fs      = require('fs');
const initSql = require('sql.js');

// ─── Paths ────────────────────────────────────────────────────────────────────
const logsDir = path.join(__dirname, '..', 'logs');
const dbFile  = path.join(logsDir, 'calls.db');

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// ─── Database singleton (initialized lazily) ──────────────────────────────────
let _db   = null;
let _ready = false;
const _queue = [];

/**
 * Initialize the sql.js database (async, one-time).
 * Returns a Promise<Database>.
 */
async function getDb() {
  if (_db) return _db;

  const SQL = await initSql();

  // Load existing DB from disk if it exists
  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Create schema
  _db.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id            TEXT PRIMARY KEY,
      phone_number  TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'initiated',
      outcome       TEXT,
      duration_sec  INTEGER,
      recording_url TEXT,
      transcript    TEXT,
      summary       TEXT,
      structured    TEXT,
      cost          REAL,
      started_at    TEXT,
      ended_at      TEXT,
      created_at    TEXT NOT NULL
    );
  `);

  persist(); // save initial empty DB
  _ready = true;
  console.log('[DB] SQLite (sql.js / WASM) initialized →', dbFile);
  return _db;
}

/** Write current DB state to disk (call after every write) */
function persist() {
  if (!_db) return;
  const data = _db.export();   // Uint8Array
  fs.writeFileSync(dbFile, Buffer.from(data));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Insert a new call record when a call is initiated
 */
async function insertCall({ id, phone_number, started_at }) {
  const db = await getDb();
  const now = new Date().toISOString();
  db.run(
    `INSERT OR IGNORE INTO calls (id, phone_number, status, started_at, created_at)
     VALUES (?, ?, 'initiated', ?, ?)`,
    [id, phone_number, started_at || now, now]
  );
  persist();
  console.log(`[DB] Inserted call id=${id}`);
  return id;
}

/**
 * Update a call record with end-of-call data from Vapi webhook
 */
async function updateCall({
  id, status, outcome, duration_sec, recording_url,
  transcript, summary, structured, cost, ended_at,
}) {
  const db  = await getDb();
  const now = new Date().toISOString();

  // Check if the call exists first
  const res = db.exec('SELECT id FROM calls WHERE id = ?', [id]);
  if (!res.length || !res[0].values.length) {
    // Webhook arrived before DB insert — create a placeholder row
    db.run(
      `INSERT INTO calls (id, phone_number, status, created_at)
       VALUES (?, 'unknown', ?, ?)`,
      [id, status || 'ended', now]
    );
  }

  db.run(
    `UPDATE calls SET
       status        = COALESCE(?, status),
       outcome       = COALESCE(?, outcome),
       duration_sec  = COALESCE(?, duration_sec),
       recording_url = COALESCE(?, recording_url),
       transcript    = COALESCE(?, transcript),
       summary       = COALESCE(?, summary),
       structured    = COALESCE(?, structured),
       cost          = COALESCE(?, cost),
       ended_at      = COALESCE(?, ended_at)
     WHERE id = ?`,
    [
      status        || null,
      outcome       || null,
      duration_sec  || null,
      recording_url || null,
      transcript    || null,
      summary       || null,
      structured ? JSON.stringify(structured) : null,
      cost          || null,
      ended_at      || now,
      id,
    ]
  );
  persist();
  console.log(`[DB] Updated call id=${id} outcome=${outcome || '—'}`);
}

/**
 * Fetch all calls ordered by newest first
 */
async function getAllCalls() {
  const db  = await getDb();
  const res = db.exec('SELECT * FROM calls ORDER BY created_at DESC LIMIT 200');
  if (!res.length) return [];

  const cols = res[0].columns;
  return res[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    // Parse structured JSON if present
    if (obj.structured) {
      try { obj.structured = JSON.parse(obj.structured); } catch { /* keep as string */ }
    }
    return obj;
  });
}

/**
 * Fetch a single call by ID
 */
async function getCall(id) {
  const db  = await getDb();
  const res = db.exec('SELECT * FROM calls WHERE id = ?', [id]);
  if (!res.length || !res[0].values.length) return null;

  const cols = res[0].columns;
  const obj  = {};
  cols.forEach((col, i) => { obj[col] = res[0].values[0][i]; });
  if (obj.structured) {
    try { obj.structured = JSON.parse(obj.structured); } catch { /* keep */ }
  }
  return obj;
}

// Pre-initialize the DB on module load
getDb().catch(err => console.error('[DB] Init error:', err));

module.exports = { insertCall, updateCall, getAllCalls, getCall };
