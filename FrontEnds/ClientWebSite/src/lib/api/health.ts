export type BackendHealthResult = {
  ok: boolean;
};

export async function checkBackendHealth(): Promise<BackendHealthResult> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}
