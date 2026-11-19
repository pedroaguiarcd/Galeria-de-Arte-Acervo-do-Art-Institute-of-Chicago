/** Helper do frontend: toda chamada vai para /api/... e lança Error com a mensagem do backend. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new Error('Falha de rede. Verifique sua conexão e tente novamente.');
  }
  if (res.status === 204) return undefined as T;
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Erro inesperado (${res.status}).`;
    throw new Error(msg);
  }
  return body as T;
}

export function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Erro inesperado.';
}

/** As imagens passam pelo backend (/api/image) para o servidor enviar o AIC-User-Agent. */
export function imageSrc(imageUrl: string): string {
  return `/api/image?url=${encodeURIComponent(imageUrl)}`;
}
