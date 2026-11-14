import { NextRequest } from 'next/server';
import { proxyStaticAssetRequest, type ProxyRouteContext } from '@/lib/backend-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = ProxyRouteContext;

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyStaticAssetRequest(request, context, 'media');
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyStaticAssetRequest(request, context, 'media');
}
