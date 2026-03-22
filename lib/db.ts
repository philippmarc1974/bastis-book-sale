import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookStatus = 'available' | 'reserved' | 'sold';

export interface RawBook {
  id: number;
  row_number: number;
  series_author_group: string;
  title: string;
  author: string;
  series_number: number | null;
  language: string;
  format: string;
  notes: string | null;
  cover_url: string | null;
  description: string | null;
  price: number; // cents
  condition: string;
  status: BookStatus;
  reserved_at: string | null;
}

export interface BookResponse extends RawBook {
  series: string | null;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (global.__db) return global.__db;

  const dbPath = path.resolve(process.cwd(), 'data', 'books.db');
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);
  seedIfEmpty(db);

  global.__db = db;
  return db;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      row_number          INTEGER NOT NULL DEFAULT 0,
      series_author_group TEXT    NOT NULL DEFAULT '',
      title               TEXT    NOT NULL,
      author              TEXT    NOT NULL DEFAULT '',
      series_number       INTEGER,
      language            TEXT    NOT NULL DEFAULT 'English',
      format              TEXT    NOT NULL DEFAULT 'Paperback',
      notes               TEXT,
      cover_url           TEXT,
      description         TEXT,
      price               INTEGER NOT NULL DEFAULT 0,
      condition           TEXT    NOT NULL DEFAULT 'Good',
      status              TEXT    NOT NULL DEFAULT 'available',
      reserved_at         TEXT
    )
  `);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

interface SeedRow {
  '#': number | null;
  'Series / Author Group': string;
  Title: string;
  Author: string;
  'Series #': number | null;
  Language: string;
  Format: string;
  Notes: string | null;
  'Cover URL': string | null;
  Description: string | null;
}

function seedIfEmpty(db: Database.Database): void {
  const { n } = db.prepare('SELECT COUNT(*) as n FROM books').get() as { n: number };
  if (n > 0) return;

  const seedPath = path.resolve(process.cwd(), 'data', 'seed.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('[db] seed.json not found, skipping seed');
    return;
  }

  const rows: SeedRow[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  const insert = db.prepare(`
    INSERT INTO books
      (row_number, series_author_group, title, author, series_number,
       language, format, notes, cover_url, description, price, condition, status)
    VALUES
      (@row_number, @series_author_group, @title, @author, @series_number,
       @language, @format, @notes, @cover_url, @description, 500, 'Good', 'available')
  `);

  const insertMany = db.transaction((data: SeedRow[]) => {
    for (const r of data) {
      insert.run({
        row_number:          r['#'] ?? 0,
        series_author_group: r['Series / Author Group'] ?? '',
        title:               r['Title'],
        author:              r['Author'] ?? '',
        series_number:       r['Series #'] ?? null,
        language:            r['Language'] ?? 'English',
        format:              r['Format'] ?? 'Paperback',
        notes:               r['Notes'] ?? null,
        cover_url:           r['Cover URL'] ?? null,
        description:         r['Description'] ?? null,
      });
    }
  });

  insertMany(rows);
  console.log(`[db] Seeded ${rows.length} books`);
}

// ─── Auto-release ─────────────────────────────────────────────────────────────

export function releaseExpired(db: Database.Database): void {
  const res = db
    .prepare(
      `UPDATE books
       SET status = 'available', reserved_at = NULL
       WHERE status = 'reserved'
         AND reserved_at IS NOT NULL
         AND datetime(reserved_at) <= datetime('now', '-24 hours')`
    )
    .run();
  if (res.changes > 0) {
    console.log(`[db] Auto-released ${res.changes} reservation(s)`);
  }
}

// ─── Series extraction ────────────────────────────────────────────────────────

export function extractSeries(group: string): string | null {
  const idx = group.indexOf(' \u2014 ');
  if (idx === -1) return null;
  const part = group.slice(idx + 3).trim();
  return part.length > 0 ? part : null;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getAllBooks(db: Database.Database): BookResponse[] {
  releaseExpired(db);
  const rows = db
    .prepare('SELECT * FROM books ORDER BY row_number ASC')
    .all() as RawBook[];
  return rows.map(toResponse);
}

export function getBookById(db: Database.Database, id: number): BookResponse | undefined {
  const row = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as RawBook | undefined;
  return row ? toResponse(row) : undefined;
}

export function toResponse(raw: RawBook): BookResponse {
  return { ...raw, series: extractSeries(raw.series_author_group) };
}
