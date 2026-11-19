import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { errorResponse, parseId, safe } from '@/lib/http';
import type { CollectionItem } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NOTE_MAX = 500;
type Ctx = { params: { id: string } };

export const PATCH = safe(async (req: Request, { params }: Ctx) => {
  const id = parseId(params.id);
  if (id === null) return errorResponse(400, 'O ID deve ser um inteiro positivo.');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, 'O corpo da requisição deve ser um JSON válido.');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return errorResponse(400, 'O corpo da requisição deve ser um objeto JSON.');
  }
  // Somente campos editáveis são aceitos (aqui, apenas "note").
  const extra = Object.keys(body).filter((k) => k !== 'note');
  if (extra.length > 0) {
    return errorResponse(400, `Campo(s) não editável(is): ${extra.join(', ')}. Apenas "note" pode ser alterado.`);
  }
  const note = (body as Record<string, unknown>).note;
  if (note !== null && typeof note !== 'string') {
    return errorResponse(400, 'O campo "note" é obrigatório e deve ser um texto (ou null para limpar).');
  }
  if (typeof note === 'string' && note.length > NOTE_MAX) {
    return errorResponse(400, `A anotação deve ter no máximo ${NOTE_MAX} caracteres.`);
  }
  const cleanNote = typeof note === 'string' && note.trim() !== '' ? note.trim() : null;

  const db = await getDb();
  const info = db.prepare('UPDATE collection SET note = ? WHERE id = ?').run(cleanNote, id);
  if (info.changes === 0) return errorResponse(404, 'Obra não encontrada na coleção.');
  const updated = db.prepare('SELECT * FROM collection WHERE id = ?').get(id) as CollectionItem;
  return NextResponse.json(updated);
});

export const DELETE = safe(async (_req: Request, { params }: Ctx) => {
  const id = parseId(params.id);
  if (id === null) return errorResponse(400, 'O ID deve ser um inteiro positivo.');

  const db = await getDb();
  const info = db.prepare('DELETE FROM collection WHERE id = ?').run(id);
  if (info.changes === 0) return errorResponse(404, 'Obra não encontrada na coleção.');
  return new Response(null, { status: 204 });
});
