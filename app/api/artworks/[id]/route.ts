import { NextResponse } from 'next/server';
import { articFetch, DETAIL_FIELDS, mapArtworkDetail, type RawDetail } from '@/lib/artic';
import { errorResponse, parseId, safe } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = safe(async (_req: Request, { params }: { params: { id: string } }) => {
  const id = parseId(params.id);
  if (id === null) return errorResponse(400, 'O ID da obra deve ser um inteiro positivo.');

  const raw = await articFetch<RawDetail>(
    `/artworks/${id}?fields=${DETAIL_FIELDS}`,
    'Obra não encontrada.',
  );
  const detail = mapArtworkDetail(raw.data, raw.config?.iiif_url);
  if (!detail) return errorResponse(404, 'Esta obra não possui imagem disponível.');
  return NextResponse.json(detail);
});
