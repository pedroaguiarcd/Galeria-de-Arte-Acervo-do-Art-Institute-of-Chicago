'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import FeedbackMessage from '@/components/FeedbackMessage';
import Frame from '@/components/Frame';
import { apiFetch, errorMessage, isAbortError } from '@/lib/api';
import { lastListUrl } from '@/lib/listState';
import type { ArtworkDetail, CollectionItem } from '@/lib/types';

export default function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const [art, setArt] = useState<ArtworkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Volta para a listagem exatamente como estava (busca, página e filtro).
  const [backHref, setBackHref] = useState('/');

  useEffect(() => setBackHref(lastListUrl()), []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    apiFetch<ArtworkDetail>(`/api/artworks/${id}`, { signal: ctrl.signal })
      .then(setArt)
      .catch((e: unknown) => { if (!isAbortError(e)) setError(errorMessage(e)); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!art) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch<CollectionItem>('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artwork_id: art.id,
          title: art.title,
          artist: art.artist,
          image_url: art.image_url,
          note: note.trim() || undefined,
        }),
      });
      setSaved(true);
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container"><FeedbackMessage kind="loading">Carregando obra…</FeedbackMessage></div>;
  if (error || !art) {
    return (
      <div className="container">
        <FeedbackMessage kind="error">{error ?? 'Obra não encontrada.'}</FeedbackMessage>
        <p><Link href={backHref}>Voltar para o acervo</Link></p>
      </div>
    );
  }

  return (
    <div className="container detail">
      <div className="hang-large">
        <Frame src={art.image_url} alt={`${art.title}, de ${art.artist}`} large />
      </div>

      <div className="info">
        <p><Link href={backHref} className="back">← Voltar ao acervo</Link></p>
        <p className="eyebrow">Obra nº {art.id}</p>
        <h1>{art.title}</h1>
        <p className="artist-line">{art.artist}</p>

        <dl className="spec">
          {art.date && (<><dt>Data</dt><dd>{art.date}</dd></>)}
          {art.medium && (<><dt>Técnica</dt><dd>{art.medium}</dd></>)}
          {art.place_of_origin && (<><dt>Origem</dt><dd>{art.place_of_origin}</dd></>)}
          {art.dimensions && (<><dt>Dimensões</dt><dd>{art.dimensions}</dd></>)}
          <dt>Domínio público</dt><dd>{art.is_public_domain ? 'Sim' : 'Não'}</dd>
        </dl>

        {art.description && <p className="description">{art.description}</p>}

        <form className="add-form" onSubmit={onSubmit}>
          <h2>Adicionar à coleção</h2>
          <label htmlFor="nota">Anotação (opcional)</label>
          <textarea id="nota" rows={4} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} disabled={saved} />
          <p className="muted">{note.length}/500</p>
          <button type="submit" className="btn" disabled={saving || saved}>
            {saving ? 'Salvando…' : saved ? 'Salva na coleção' : 'Salvar na coleção'}
          </button>
          {saved && <FeedbackMessage kind="success">Obra salva. <Link href="/collection">Ver minha coleção</Link></FeedbackMessage>}
          {saveError && <FeedbackMessage kind="error">{saveError}</FeedbackMessage>}
        </form>
      </div>
    </div>
  );
}
