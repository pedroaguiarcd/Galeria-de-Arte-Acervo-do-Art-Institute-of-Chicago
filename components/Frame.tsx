import { imageSrc } from '@/lib/api';

interface Props {
  src: string;
  alt: string;
  large?: boolean;
}

/** Moldura dourada (CSS puro) + passe-partout ao redor da pintura. */
export default function Frame({ src, alt, large }: Props) {
  return (
    <div className={large ? 'frame frame-large' : 'frame'}>
      <div className="passepartout">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc(src)} alt={alt} loading={large ? 'eager' : 'lazy'} decoding="async" />
      </div>
    </div>
  );
}
