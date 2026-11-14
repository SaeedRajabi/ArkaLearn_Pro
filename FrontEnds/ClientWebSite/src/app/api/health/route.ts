import { getBackendApiOrigin } from '@/lib/api/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const target = `${getBackendApiOrigin().replace(/\/$/, '')}/Health`;

  try {
    const upstream = await fetch(target, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });

    if (!upstream.ok) {
      return Response.json({ status: 'down', targetUrl: target }, { status: 503 });
    }

    const payload = await upstream.json().catch(() => ({ status: 'ok' }));
    return Response.json({ status: 'ok', upstream: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    return Response.json({ status: 'down', message, targetUrl: target }, { status: 503 });
  }
}
