interface Props {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, disabled, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <button type="button" className="btn btn-secondary" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span aria-live="polite">Página {page} de {totalPages}</span>
      <button type="button" className="btn btn-secondary" disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>
        Próxima
      </button>
    </nav>
  );
}
