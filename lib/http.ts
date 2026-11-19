import { NextResponse } from 'next/server';

/** Erro com status HTTP associado; convertido em JSON {"error": "..."} por safe(). */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** null → valor padrão; inteiro positivo → número; qualquer outra coisa → null (inválido). */
export function parsePositiveInt(value: string | null, fallback: number): number | null {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export function parseId(raw: string): number | null {
  return parsePositiveInt(raw, 0) || null;
}

/** Envolve um handler: HttpError → status próprio; qualquer outro erro → 500. */
export function safe<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof HttpError) return errorResponse(e.status, e.message);
      console.error(e);
      return errorResponse(500, 'Erro interno do servidor.');
    }
  };
}
