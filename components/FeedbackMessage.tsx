import type { ReactNode } from 'react';

interface Props {
  kind: 'loading' | 'error' | 'success' | 'info';
  children: ReactNode;
  onRetry?: () => void;
}

export default function FeedbackMessage({ kind, children, onRetry }: Props) {
  return (
    <div className={`feedback feedback-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span>{children}</span>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
