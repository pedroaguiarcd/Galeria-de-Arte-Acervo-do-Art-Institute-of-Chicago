import Link from 'next/link';
import Frame from './Frame';
import type { Artwork } from '@/lib/types';

interface Props {
  artwork: Artwork;
  /** Chamado ao abrir a obra com um clique simples (útil para guardar a posição da listagem). */
  onOpen?: () => void;
}

export default function ArtworkCard({ artwork, onOpen }: Props) {
  const meta = [artwork.date, artwork.medium].filter(Boolean).join(' · ');
  return (
    <article className="card">
      <Link
        href={`/artworks/${artwork.id}`}
        className="card-link"
        onClick={(e) => {
          const plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
          if (plainClick) onOpen?.();
        }}
      >
        <div className="hang">
          <Frame src={artwork.image_url} alt={`${artwork.title}, de ${artwork.artist}`} />
        </div>
        <div className="plaque">
          <h2>{artwork.title}</h2>
          <p className="plaque-artist">{artwork.artist}</p>
          {meta && <p className="plaque-meta">{meta}</p>}
          {artwork.is_public_domain && <p className="plaque-tag">Domínio público</p>}
        </div>
      </Link>
    </article>
  );
}
