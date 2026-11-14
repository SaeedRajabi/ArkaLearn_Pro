import { NextRequest } from 'next/server';
import { proxySupportChatHubRequest, type ProxyRouteContext } from '@/lib/backend-api-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = ProxyRouteContext;

export async function GET(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxySupportChatHubRequest(request, context);
}
