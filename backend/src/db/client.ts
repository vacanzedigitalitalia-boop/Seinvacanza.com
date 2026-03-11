import Database from 'better-sqlite3';
import { env } from '../config/env.js';

export const db = new Database(env.DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  regione TEXT,
  localita TEXT,
  categoria TEXT,
  descrizione TEXT,
  distanza_mare INTEGER,
  trattamento TEXT,
  servizi_json TEXT NOT NULL,
  target_json TEXT NOT NULL,
  keywords_json TEXT NOT NULL,
  obiezioni_json TEXT NOT NULL,
  tono_vendita TEXT,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS price_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_slug TEXT NOT NULL,
  checkin TEXT NOT NULL,
  checkout TEXT NOT NULL,
  adulti INTEGER NOT NULL,
  bambini INTEGER NOT NULL,
  eta_bambini_json TEXT,
  camera TEXT,
  prezzo REAL,
  disponibile INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
`);

const cols = db.prepare("PRAGMA table_info(price_cache)").all() as Array<{ name: string }>;
const names = new Set(cols.map(c => c.name));
if (!names.has('eta_bambini_json')) {
  db.exec('ALTER TABLE price_cache ADD COLUMN eta_bambini_json TEXT');
}
if (!names.has('camera')) {
  db.exec('ALTER TABLE price_cache ADD COLUMN camera TEXT');
}
