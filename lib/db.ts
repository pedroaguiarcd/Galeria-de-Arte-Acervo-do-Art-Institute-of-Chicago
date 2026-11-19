import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { articFetch, LIST_FIELDS, mapArtwork, type RawList } from './artic';
import { HttpError } from './http';
import type { Artwork } from './types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'app.db');

// Registros iniciais (entre 3 e 10), definidos somente aqui.
// `artwork_id` é o ID real da obra na API do Art Institute of Chicago; título, artista e imagem
// são buscados na API na primeira criação do banco. `note` varia de propósito: algumas
// sementes têm anotação preenchida e outras ficam sem anotação (null).
const SEEDS: ReadonlyArray<{ artwork_id: number; note: string | null }> = [
  { artwork_id: 27992, note: 'Para rever com calma na próxima visita.' },
  { artwork_id: 28560, note: null },
  { artwork_id: 111628, note: 'Boa referência de composição e iluminação.' },
  { artwork_id: 16568, note: null },
  { artwork_id: 20684, note: 'Anotação de exemplo: edite ou remova pela página da coleção.' },
  { artwork_id: 6565, note: null },
  { artwork_id: 129884, note: 'Uma das favoritas da coleção inicial.' },
];

const SCHEMA = `
CREATE TABLE IF NOT EXISTS collection (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  artwork_id INTEGER NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  artist     TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`;

// NÃO ativar WAL: o journal_mode permanece no padrão (DELETE).

async function seed(db: Database.Database): Promise<void> {
  const raw = await articFetch<RawList>(
    `/artworks?ids=${SEEDS.map((s) => s.artwork_id).join(',')}&fields=${LIST_FIELDS}`,
  );
  const artworks = raw.data.map((a) => mapArtwork(a, raw.config?.iiif_url)).filter((a): a is Artwork => a !== null);
  const seeds = artworks.map((a) => ({
    artwork: a,
    note: SEEDS.find((s) => s.artwork_id === a.id)?.note ?? null,
  }));
  if (seeds.length < 3) {
    throw new HttpError(502, 'A API externa não retornou obras suficientes para as sementes.');
  }
  const insert = db.prepare(
    'INSERT INTO collection (artwork_id, title, artist, image_url, note) VALUES (?, ?, ?, ?, ?)',
  );
  db.transaction((items: typeof seeds) => {
    for (const { artwork: a, note } of items) insert.run(a.id, a.title, a.artist, a.image_url, note);
  })(seeds);
}

async function openDb(): Promise<Database.Database> {
  const isNew = !fs.existsSync(DB_PATH);
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.exec(SCHEMA);
  if (isNew) {
    try {
      await seed(db);
    } catch (e) {
      // Sem sementes o banco ficaria "novo" para sempre: remove para tentar de novo na próxima requisição.
      db.close();
      fs.rmSync(DB_PATH, { force: true });
      throw e;
    }
  }
  return db;
}

// Cache em globalThis para sobreviver ao hot reload do `next dev`.
const g = globalThis as unknown as { __artDb?: Promise<Database.Database> };

export function getDb(): Promise<Database.Database> {
  if (!g.__artDb) {
    g.__artDb = openDb().catch((e: unknown) => {
      g.__artDb = undefined;
      throw e;
    });
  }
  return g.__artDb;
}
