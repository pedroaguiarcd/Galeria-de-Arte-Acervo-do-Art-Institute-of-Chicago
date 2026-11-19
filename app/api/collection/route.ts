import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { errorResponse, safe } from '@/lib/http';
import type { CollectionItem } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTE_MAX = 500;

export const GET = safe(async () => {
  const db = await getDb();
  const rows = db.prepare('SELECT * FROM collection ORDER BY id DESC').all() as CollectionItem[];
  return NextResponse.json(rows);
});

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== '';
}

export const POST = safe(async (req: Request) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'O corpo da requisição deve ser um JSON válido.');
  }
  if (typeof body !== 'object' || body === null) {
    return errorResponse(400, 'O corpo da requisição deve ser um objeto JSON.');
  }
  const { artwork_id, title, artist, image_url, note } = body as Record<string, unknown>;

  if (typeof artwork_id !== 'number' || !Number.isSafeInteger(artwork_id) || artwork_id <= 0) {
    return errorResponse(400, 'O campo "artwork_id" deve ser um inteiro positivo.');
  }
  if (!isNonEmptyString(title) || !isNonEmptyString(artist) || !isNonEmptyString(image_url)) {
    return errorResponse(400, 'Os campos "title", "artist" e "image_url" são obrigatórios.');
  }
  if (note !== undefined && note !== null && typeof note !== 'string') {
    return errorResponse(400, 'O campo "note" deve ser um texto.');
  }
  if (typeof note === 'string' && note.length > NOTE_MAX) {
    return errorResponse(400, `A anotação deve ter no máximo ${NOTE_MAX} caracteres.`);
  }
  const cleanNote = typeof note === 'string' && note.trim() !== '' ? note.trim() : null;

  const db = await getDb();
  const exists = db.prepare('SELECT 1 FROM collection WHERE artwork_id = ?').get(artwork_id);
  if (exists) return errorResponse(409, 'Esta obra já está na sua coleção.');

  const info = db
    .prepare('INSERT INTO collection (artwork_id, title, artist, image_url, note) VALUES (?, ?, ?, ?, ?)')
    .run(artwork_id, title.trim(), artist.trim(), image_url.trim(), cleanNote);
  const created = db
    .prepare('SELECT * FROM collection WHERE id = ?')
    .get(info.lastInsertRowid) as CollectionItem;
  return NextResponse.json(created, { status: 201 });
});
