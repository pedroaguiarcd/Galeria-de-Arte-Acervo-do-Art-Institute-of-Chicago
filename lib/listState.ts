import type { ArtworkPage } from './types';

/**
 * Estado da listagem preservado entre navegações no navegador:
 * - cache em memória das páginas de resultados já carregadas (volta instantânea, sem "Carregando…");
 * - posição de rolagem e URL da listagem, guardadas em sessionStorage ao abrir uma obra.
 * Tudo é opcional: se o armazenamento estiver indisponível, a aplicação funciona normalmente.
 */

const LAST_URL_KEY = 'gallery:last-list-url';
const SCROLL_KEY = 'gallery:list-scroll';
const CACHE_LIMIT = 30;

const artworkCache = new Map<string, ArtworkPage>();

export function getCachedPage(key: string): ArtworkPage | null {
  return artworkCache.get(key) ?? null;
}

export function setCachedPage(key: string, page: ArtworkPage): void {
  artworkCache.delete(key);
  artworkCache.set(key, page);
  if (artworkCache.size > CACHE_LIMIT) {
    const oldest = artworkCache.keys().next().value;
    if (oldest !== undefined) artworkCache.delete(oldest);
  }
}

/** Monta a URL canônica da listagem: só inclui os parâmetros que diferem do padrão. */
export function buildListUrl(term: string, page: number, publicOnly: boolean): string {
  const qs = new URLSearchParams();
  if (term) qs.set('q', term);
  if (page > 1) qs.set('page', String(page));
  if (publicOnly) qs.set('is_public_domain', 'true');
  const text = qs.toString();
  return text ? `/?${text}` : '/';
}

/** Chamado ao abrir uma obra: guarda de onde o usuário veio e a posição da rolagem. */
export function rememberList(url: string, scrollY: number): void {
  try {
    sessionStorage.setItem(LAST_URL_KEY, url);
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ url, y: Math.round(scrollY) }));
  } catch {
    /* armazenamento indisponível: segue sem restaurar */
  }
}

/** URL da última listagem visitada (para o link "Voltar ao acervo"). */
export function lastListUrl(): string {
  try {
    return sessionStorage.getItem(LAST_URL_KEY) ?? '/';
  } catch {
    return '/';
  }
}

/** Posição salva para esta URL, ou null. Não apaga: use clearSavedScroll depois de restaurar. */
export function peekSavedScroll(url: string): number | null {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    if (!raw) return null;
    const saved: unknown = JSON.parse(raw);
    if (
      typeof saved === 'object' && saved !== null &&
      'url' in saved && 'y' in saved &&
      saved.url === url && typeof saved.y === 'number' && saved.y > 0
    ) {
      return saved.y;
    }
  } catch {
    /* ignora */
  }
  return null;
}

export function clearSavedScroll(): void {
  try {
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    /* ignora */
  }
}

/**
 * Rola até a posição y. Tenta por alguns quadros porque, logo após a navegação, a página
 * ainda pode estar sendo montada (e o Next.js pode ter rolado para o topo antes).
 */
export function restoreScroll(y: number): void {
  let tries = 0;
  const tick = () => {
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) > 2 && tries++ < 40) window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, left: 0 });
}
