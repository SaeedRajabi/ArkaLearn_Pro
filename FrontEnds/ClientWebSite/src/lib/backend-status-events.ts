export type BackendStatusEvent = 'failure' | 'success';

type Listener = (event: BackendStatusEvent) => void;

const listeners = new Set<Listener>();

export function subscribeBackendStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitBackendFailure(): void {
  if (typeof window === 'undefined') return;
  listeners.forEach((listener) => listener('failure'));
}

export function emitBackendSuccess(): void {
  if (typeof window === 'undefined') return;
  listeners.forEach((listener) => listener('success'));
}
