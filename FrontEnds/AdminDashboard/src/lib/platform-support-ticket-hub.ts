import * as signalR from '@microsoft/signalr';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/hub-url';
import {
  connectHubWithCandidates,
  getHubUrlCandidates,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/hub-client-shared';

const HUB_PATH = '/hubs/platform-support-ticket';

export type PlatformTicketHubEvent = 'TicketOpened' | 'MessagePosted' | 'TicketStatusChanged' | 'NotificationPulse';

export interface PlatformTicketMessagePostedPayload {
  ticketId: number;
  messageId: number;
  senderUserId: number;
  senderName: string;
  contentHtml: string;
  sentAtUtc: string;
  isStaffMessage: boolean;
  requesterUserId: number;
  status: string;
  subject: string;
  replyToMessageId?: number | null;
  replyToSenderName?: string | null;
  replyToContentPreview?: string | null;
}

type EventHandler = (...args: unknown[]) => void;

export function getPlatformSupportTicketHubUrl(): string {
  return resolveHubUrl(HUB_PATH, {
    directEnvKey: 'NEXT_PUBLIC_PLATFORM_TICKET_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_PLATFORM_TICKET_HUB_PROXY',
  });
}

class PlatformSupportTicketHubClient {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<signalR.HubConnection | null> | null = null;
  private refCount = 0;
  private handlers = new Map<PlatformTicketHubEvent, Set<EventHandler>>();

  private buildConnection(hubUrl: string): signalR.HubConnection {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        ...(isProxiedHubUrl(hubUrl) ? { transport: signalR.HttpTransportType.LongPolling } : {}),
      })
      .withAutomaticReconnect()
      .configureLogging(HUB_CONNECTION_LOG_LEVEL)
      .build();

    (['TicketOpened', 'MessagePosted', 'TicketStatusChanged', 'NotificationPulse'] as PlatformTicketHubEvent[]).forEach(
      (event) => {
        connection.on(event, (...args: unknown[]) => {
          this.handlers.get(event)?.forEach((handler) => handler(...args));
        });
      },
    );

    return connection;
  }

  private async start(): Promise<signalR.HubConnection | null> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (!this.startPromise) {
      this.startPromise = connectHubWithCandidates({
        connection: this.connection,
        setConnection: (connection) => {
          this.connection = connection;
        },
        buildConnection: (hubUrl) => this.buildConnection(hubUrl),
        hubUrlCandidates: getHubUrlCandidates(HUB_PATH, getPlatformSupportTicketHubUrl),
      }).finally(() => {
        this.startPromise = null;
      });
    }

    return this.startPromise;
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
      },
    );
  }

  on(event: PlatformTicketHubEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: PlatformTicketHubEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

export const platformSupportTicketHubClient = new PlatformSupportTicketHubClient();
