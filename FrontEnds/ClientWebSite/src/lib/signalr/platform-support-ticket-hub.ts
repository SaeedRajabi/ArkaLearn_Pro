import * as signalR from '@microsoft/signalr';
import type {
  PlatformTicketMessagePostedPayload,
  PlatformTicketOpenedPayload,
  PlatformTicketStatusChangedPayload,
} from '@/lib/api/platform-support-ticket';
import { getBackendApiOrigin } from '@/lib/api/config';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/signalr/hub-url';
import {
  connectHubWithFallback,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/signalr/hub-client-shared';

const HUB_PATH = '/hubs/platform-support-ticket';

export type PlatformSupportTicketHubEvent =
  | 'TicketOpened'
  | 'MessagePosted'
  | 'TicketStatusChanged'
  | 'NotificationPulse';

export type MessagePostedPayload = PlatformTicketMessagePostedPayload;
export type TicketOpenedPayload = PlatformTicketOpenedPayload;
export type TicketStatusChangedPayload = PlatformTicketStatusChangedPayload;

type EventHandler = (...args: unknown[]) => void;

export function getPlatformSupportTicketHubUrl(): string {
  return resolveHubUrl(HUB_PATH, {
    directEnvKey: 'NEXT_PUBLIC_PLATFORM_TICKET_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_PLATFORM_TICKET_HUB_PROXY',
  });
}

class PlatformSupportTicketHubClient {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private refCount = 0;
  private handlers = new Map<PlatformSupportTicketHubEvent, Set<EventHandler>>();

  private buildConnection(hubUrl: string): signalR.HubConnection {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        ...(isProxiedHubUrl(hubUrl) ? { transport: signalR.HttpTransportType.LongPolling } : {}),
      })
      .withAutomaticReconnect()
      .configureLogging(HUB_CONNECTION_LOG_LEVEL)
      .build();

    (
      ['TicketOpened', 'MessagePosted', 'TicketStatusChanged', 'NotificationPulse'] as PlatformSupportTicketHubEvent[]
    ).forEach((event) => {
      connection.on(event, (...args: unknown[]) => {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
      });
    });

    return connection;
  }

  private ensureConnection(): signalR.HubConnection {
    if (!this.connection) this.connection = this.buildConnection(getPlatformSupportTicketHubUrl());
    return this.connection;
  }

  private async startWithFallback(): Promise<void> {
    const primaryUrl = getPlatformSupportTicketHubUrl();
    const fallbackUrl = `${getBackendApiOrigin()}${HUB_PATH}`;
    await connectHubWithFallback({
      connection: this.connection,
      setConnection: (connection) => {
        this.connection = connection;
      },
      buildConnection: (hubUrl) => this.buildConnection(hubUrl),
      primaryUrl,
      fallbackUrl,
    });
  }

  private async start(): Promise<signalR.HubConnection | null> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return this.connection;
    if (!this.startPromise) {
      this.startPromise = this.startWithFallback().finally(() => {
        this.startPromise = null;
      });
    }
    await this.startPromise;
    return this.connection?.state === signalR.HubConnectionState.Connected ? this.connection : null;
  }

  async acquire(): Promise<signalR.HubConnection | null> {
    this.refCount += 1;
    const connection = await this.start();
    if (!connection) this.refCount = Math.max(0, this.refCount - 1);
    return connection;
  }

  release(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    scheduleDeferredHubDisconnect(
      () => this.refCount,
      () => this.connection,
      (connection) => {
        this.connection = connection;
      }
    );
  }

  async leaveGroups(options: { ticketId?: number; userId?: number }): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
    try {
      if (options.ticketId && options.ticketId > 0) await connection.invoke('LeaveTicket', options.ticketId);
      if (options.userId && options.userId > 0) await connection.invoke('LeaveUser', options.userId);
    } catch {
      /* optional */
    }
  }

  on(event: PlatformSupportTicketHubEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: PlatformSupportTicketHubEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

export const platformSupportTicketHubClient = new PlatformSupportTicketHubClient();
