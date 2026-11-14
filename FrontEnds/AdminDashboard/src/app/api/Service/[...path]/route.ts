import { NextRequest } from 'next/server';
import { proxyBackendRequest, type ProxyRouteContext } from '@/lib/backend-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Legacy path; production IIS often blocks /api before Next.js. Prefer /svc/Service in the browser. */
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
