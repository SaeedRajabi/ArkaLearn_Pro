import { NextRequest } from 'next/server';
import { proxyBackendRequest, type ProxyRouteContext } from '@/lib/backend-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Allow large multipart uploads (student files) through the dashboard proxy. */
export const maxDuration = 3600;

type RouteContext = ProxyRouteContext;

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, context);
}
