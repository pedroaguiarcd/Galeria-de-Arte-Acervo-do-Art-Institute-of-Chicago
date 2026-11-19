import { HttpError } from './http';
import type { Artwork, ArtworkDetail } from './types';

export const ARTIC_API = 'https://api.artic.edu/api/v1';
export const ARTIC_USER_AGENT = 'ArtGalleryApp (aluno@uespi.br)';

export const LIST_FIELDS =
  'id,title,artist_display,image_id,is_public_domain,date_display,medium_display';
export const DETAIL_FIELDS = `${LIST_FIELDS},description,place_of_origin,dimensions`;

export interface RawArtwork {
  id: number;
  title: string | null;
  artist_display: string | null;
  image_id: string | null;
  is_public_domain: boolean | null;
  date_display: string | null;
  medium_display: string | null;
  description?: string | null;
  place_of_origin?: string | null;
  dimensions?: string | null;
}

/** Bloco "config" presente em toda resposta da API; traz a URL base IIIF das imagens. */
export interface RawConfig {
  iiif_url?: string;
}

export interface RawList {
  data: RawArtwork[];
  pagination: { total: number; total_pages: number; current_page: number };
  config?: RawConfig;
}

export interface RawDetail {
  data: RawArtwork;
  config?: RawConfig;
}

/** Única função que fala com a API externa; sempre envia o cabeçalho AIC-User-Agent. */
export async function articFetch<T>(pathAndQuery: string, notFoundMessage?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${ARTIC_API}${pathAndQuery}`, {
      headers: { 'AIC-User-Agent': ARTIC_USER_AGENT, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpError(502, 'Não foi possível conectar à API do Art Institute of Chicago.');
  }
  if (res.status === 404) {
    throw new HttpError(404, notFoundMessage ?? 'Recurso não encontrado na API externa.');
  }
  if (!res.ok) {
    throw new HttpError(502, `A API do Art Institute of Chicago respondeu com erro (${res.status}).`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new HttpError(502, 'Resposta inválida da API do Art Institute of Chicago.');
  }
}

// Usada somente se a resposta da API vier sem "config.iiif_url".
const DEFAULT_IIIF_URL = 'https://www.artic.edu/iiif/2';

/** Padrão IIIF: {iiif_url}/{image_id}/full/843,/0/default.jpg, com iiif_url vindo da resposta da API. */
export function buildImageUrl(imageId: string, iiifUrl?: string): string {
  const base = (iiifUrl || DEFAULT_IIIF_URL).replace(/\/+$/, '');
  return `${base}/${imageId}/full/843,/0/default.jpg`;
}

/** Converte HTML (campo description) em texto simples. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n: string) => (Number(n) <= 0x10ffff ? String.fromCodePoint(Number(n)) : ''))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Retorna null quando a obra não tem imagem (deve ser descartada). */
export function mapArtwork(raw: RawArtwork, iiifUrl?: string): Artwork | null {
  if (!raw.image_id) return null;
  return {
    id: raw.id,
    title: raw.title?.trim() || 'Sem título',
    artist: raw.artist_display?.split('\n')[0].trim() || 'Artista desconhecido',
    image_url: buildImageUrl(raw.image_id, iiifUrl),
    date: raw.date_display ?? null,
    medium: raw.medium_display ?? null,
    is_public_domain: raw.is_public_domain === true,
  };
}

export function mapArtworkDetail(raw: RawArtwork, iiifUrl?: string): ArtworkDetail | null {
  const base = mapArtwork(raw, iiifUrl);
  if (!base) return null;
  return {
    ...base,
    description: raw.description ? htmlToText(raw.description) || null : null,
    place_of_origin: raw.place_of_origin ?? null,
    dimensions: raw.dimensions ?? null,
  };
}
