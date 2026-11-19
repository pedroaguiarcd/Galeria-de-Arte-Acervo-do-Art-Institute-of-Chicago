import { NextResponse } from 'next/server';
import { articFetch, LIST_FIELDS, mapArtwork, type RawList } from '@/lib/artic';
import { errorResponse, parsePositiveInt, safe } from '@/lib/http';
import type { Artwork, ArtworkPage } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = safe(async (req: Request) => {
  const sp = new URL(req.url).searchParams;
  const page = parsePositiveInt(sp.get('page'), 1);
  const limit = parsePositiveInt(sp.get('limit'), 12);
  if (page === null || limit === null || limit > 100) {
    return errorResponse(400, 'Os parâmetros "page" e "limit" devem ser inteiros positivos (limit máximo: 100).');
  }
  const pd = sp.get('is_public_domain');
  if (pd !== null && pd !== 'true' && pd !== 'false') {
    return errorResponse(400, 'O parâmetro "is_public_domain" deve ser "true" ou "false".');
  }
  const q = sp.get('q')?.trim() ?? '';

  const qs = new URLSearchParams({ fields: LIST_FIELDS, page: String(page), limit: String(limit) });
  const useSearch = q !== '' || pd !== null;
  if (q) qs.set('q', q);
  if (pd !== null) qs.set('query[term][is_public_domain]', pd);

  const raw = await articFetch<RawList>(`${useSearch ? '/artworks/search' : '/artworks'}?${qs}`);
  const data = raw.data.map((a) => mapArtwork(a, raw.config?.iiif_url)).filter((a): a is Artwork => a !== null);
  // A busca da API limita page × limit a 1000 resultados.
  const maxPages = useSearch ? Math.max(1, Math.floor(1000 / limit)) : Number.MAX_SAFE_INTEGER;

  const body: ArtworkPage = {
    data,
    pagination: {
      page,
      limit,
      total: raw.pagination.total,
      total_pages: Math.max(1, Math.min(raw.pagination.total_pages, maxPages)),
    },
  };
  return NextResponse.json(body);
});
