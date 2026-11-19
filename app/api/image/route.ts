import { errorResponse, safe } from '@/lib/http';
import { ARTIC_USER_AGENT } from '@/lib/artic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aceita somente URLs IIIF do Art Institute of Chicago (evita proxy aberto / SSRF).
const IIIF_URL = /^https:\/\/www\.artic\.edu\/iiif\/2\/[0-9a-f-]{36}\/full\/\d+,\/0\/default\.jpg$/i;

export const GET = safe(async (req: Request) => {
  const url = new URL(req.url).searchParams.get('url') ?? '';
  if (!IIIF_URL.test(url)) return errorResponse(400, 'URL de imagem inválida.');

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { 'AIC-User-Agent': ARTIC_USER_AGENT, Accept: 'image/*' },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return errorResponse(502, 'Não foi possível baixar a imagem do Art Institute of Chicago.');
  }
  const type = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !type.startsWith('image/')) {
    return errorResponse(502, `O servidor de imagens respondeu com erro (${upstream.status}).`);
  }
  return new Response(upstream.body, {
    status: 200,
    headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' },
  });
});
