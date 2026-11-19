'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import CollectionCard from '@/components/CollectionCard';
import FeedbackMessage from '@/components/FeedbackMessage';
import { apiFetch, errorMessage, isAbortError } from '@/lib/api';
import type { CollectionItem } from '@/lib/types';

export default function CollectionPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    apiFetch<CollectionItem[]>('/api/collection', { signal: ctrl.signal })
      .then(setItems)
      .catch((e: unknown) => { if (!isAbortError(e)) setError(errorMessage(e)); })
      .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [reload]);

  async function saveNote(id: number, note: string) {
    const updated = await apiFetch<CollectionItem>(`/api/collection/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  }

  async function remove(id: number) {
    await apiFetch<void>(`/api/collection/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="container">
      <header className="page-head">
        <p className="eyebrow">Acervo pessoal</p>
        <h1>Minha <em>coleção</em></h1>
        <p className="divider" aria-hidden="true">◆</p>
      </header>
      {loading && <FeedbackMessage kind="loading">Carregando coleção…</FeedbackMessage>}
      {error && <FeedbackMessage kind="error" onRetry={() => setReload((n) => n + 1)}>{error}</FeedbackMessage>}
      {!loading && !error && items.length === 0 && (
        <FeedbackMessage kind="info">Sua coleção está vazia. <Link href="/">Explore o acervo</Link> e salve uma obra.</FeedbackMessage>
      )}
      <div className="grid">
        {items.map((i) => <CollectionCard key={i.id} item={i} onSaveNote={saveNote} onDelete={remove} />)}
      </div>
    </div>
  );
}
