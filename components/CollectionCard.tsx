'use client';

import Link from 'next/link';
import { useState } from 'react';
import Frame from './Frame';
import { errorMessage } from '@/lib/api';
import type { CollectionItem } from '@/lib/types';

interface Props {
  item: CollectionItem;
  onSaveNote: (id: number, note: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function CollectionCard({ item, onSaveNote, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>, onOk?: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onOk?.();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  const save = () => run(() => onSaveNote(item.id, draft), () => { setEditing(false); setBusy(false); });
  const remove = () => {
    if (!window.confirm(`Remover "${item.title}" da coleção?`)) return;
    void run(() => onDelete(item.id));
  };

  return (
    <article className="card">
      <div className="hang">
        <Frame src={item.image_url} alt={`${item.title}, de ${item.artist}`} />
      </div>
      <div className="plaque plaque-wide">
        <h2><Link href={`/artworks/${item.artwork_id}`}>{item.title}</Link></h2>
        <p className="plaque-artist">{item.artist}</p>

        {editing ? (
          <div className="note-edit">
            <label htmlFor={`note-${item.id}`}>Anotação</label>
            <textarea id={`note-${item.id}`} value={draft} maxLength={500} rows={4} onChange={(e) => setDraft(e.target.value)} />
            <p className="muted">{draft.length}/500</p>
            <div className="actions">
              <button type="button" className="btn" onClick={save} disabled={busy}>Salvar</button>
              <button type="button" className="btn btn-secondary" disabled={busy}
                onClick={() => { setEditing(false); setDraft(item.note ?? ''); setError(null); }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="plaque-note">{item.note ?? <span className="muted">Sem anotação.</span>}</p>
            <div className="actions">
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)} disabled={busy}>Editar anotação</button>
              <button type="button" className="btn btn-danger" onClick={remove} disabled={busy}>Remover</button>
            </div>
          </>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}
