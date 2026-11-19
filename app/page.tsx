'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import ArtworkCard from '@/components/ArtworkCard';
import FeedbackMessage from '@/components/FeedbackMessage';
import Pagination from '@/components/Pagination';
import { apiFetch, errorMessage, isAbortError } from '@/lib/api';
import {
  buildListUrl,
  clearSavedScroll,
  getCachedPage,
  peekSavedScroll,
  rememberList,
  restoreScroll,
  scrollToTop,
  setCachedPage,
} from '@/lib/listState';
import type { ArtworkPage } from '@/lib/types';

const PAGE_SIZE = 12;

/**
 * Busca, página e filtro ficam na URL (?q=...&page=...&is_public_domain=true).
 * Assim o botão "voltar" do navegador e o link "Voltar ao acervo" reabrem a listagem
 * exatamente no ponto em que o usuário estava.
 */
function Gallery() {
  const router = useRouter();
  const params = useSearchParams();

  const term = params?.get('q') ?? '';
  const pageParam = Number(params?.get('page') ?? '1');
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const publicOnly = params?.get('is_public_domain') === 'true';
  const listUrl = buildListUrl(term, page, publicOnly);

  const [input, setInput] = useState(term);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<ArtworkPage | null>(() => getCachedPage(listUrl));
  const [loading, setLoading] = useState(result === null);
  const [error, setError] = useState<string | null>(null);
  const pendingScroll = useRef<number | null>(null);

  // Ao montar, verifica se o usuário está voltando de uma obra (posição salva para esta URL).
  useEffect(() => {
    if (pendingScroll.current === null) pendingScroll.current = peekSavedScroll(listUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só deve rodar na montagem
  }, []);

  // Mantém o campo de busca sincronizado quando a URL muda (ex.: botão voltar).
  useEffect(() => setInput(term), [term]);

  useEffect(() => {
    const ctrl = new AbortController();
    const cached = getCachedPage(listUrl);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (term) qs.set('q', term);
    if (publicOnly) qs.set('is_public_domain', 'true');

    apiFetch<ArtworkPage>(`/api/artworks?${qs}`, { signal: ctrl.signal })
      .then((data) => {
        setCachedPage(listUrl, data);
        setResult(data);
      })
      // Se já havia dados em cache exibidos, uma falha na atualização em segundo plano é ignorada.
      .catch((e: unknown) => { if (!isAbortError(e) && !cached) setError(errorMessage(e)); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listUrl é derivado de term/page/publicOnly
  }, [listUrl, reload]);

  // Depois que as obras aparecem, restaura a rolagem (somente ao voltar de uma obra).
  useEffect(() => {
    if (loading || !result || pendingScroll.current === null) return;
    restoreScroll(pendingScroll.current);
    pendingScroll.current = null;
    clearSavedScroll();
  }, [loading, result]);

  function navigate(url: string) {
    if (url === listUrl) setReload((n) => n + 1);
    else router.push(url, { scroll: false });
    scrollToTop();
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    navigate(buildListUrl(input.trim(), 1, publicOnly));
  }

  return (
    <div className="container">
      <header className="page-head">
        <p className="eyebrow">Exposição permanente</p>
        <h1>Acervo do <em>Art Institute</em> of Chicago</h1>
        <p className="divider" aria-hidden="true">◆</p>
        <form className="search" role="search" onSubmit={onSearch}>
          <label htmlFor="busca" className="sr-only">Buscar por título, artista ou tema</label>
          <div className="search-box">
            <input id="busca" type="search" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Buscar na exposição…" />
            <button type="submit" className="search-btn" aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
              </svg>
            </button>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={publicOnly}
              onChange={(e) => navigate(buildListUrl(term, 1, e.target.checked))}
            />
            <span>Somente obras de domínio público</span>
          </label>
        </form>
      </header>

      {loading && <FeedbackMessage kind="loading">Carregando obras…</FeedbackMessage>}
      {error && <FeedbackMessage kind="error" onRetry={() => setReload((n) => n + 1)}>{error}</FeedbackMessage>}
      {!loading && !error && result && result.data.length === 0 && (
        <FeedbackMessage kind="info">Nenhuma obra com imagem foi encontrada. Tente outro termo ou desative o filtro.</FeedbackMessage>
      )}

      {!error && result && result.data.length > 0 && (
        <>
          <div className="grid" aria-busy={loading}>
            {result.data.map((a) => (
              <ArtworkCard key={a.id} artwork={a} onOpen={() => rememberList(listUrl, window.scrollY)} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={result.pagination.total_pages}
            disabled={loading}
            onChange={(p) => navigate(buildListUrl(term, p, publicOnly))}
          />
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  // useSearchParams exige um limite de Suspense para o build de produção.
  return (
    <Suspense fallback={<div className="container"><FeedbackMessage kind="loading">Carregando obras…</FeedbackMessage></div>}>
      <Gallery />
    </Suspense>
  );
}
