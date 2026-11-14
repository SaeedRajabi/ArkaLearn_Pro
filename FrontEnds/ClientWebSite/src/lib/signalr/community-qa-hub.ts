import * as signalR from '@microsoft/signalr';
import { getBackendApiOrigin } from '@/lib/api/config';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/signalr/hub-url';
import {
  connectHubWithFallback,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/signalr/hub-client-shared';

const HUB_PATH = '/hubs/community-qa';

export type CommunityQaHubEvent =
  | 'ThreadCreated'
  | 'ReplyPosted'
  | 'ThreadReactionChanged'
  | 'ReplyLikeChanged'
  | 'NotificationPulse';

export interface ThreadCreatedPayload {
  threadId: number;
}

export interface ReplyPostedPayload {
  threadId: number;
  replyId: number;
}

export interface ThreadReactionChangedPayload {
  threadId: number;
  likes: number;
  dislikes: number;
}

export interface ReplyLikeChangedPayload {
  threadId: number;
  replyId: number;
  likeCount: number;
}

type EventHandler = (...args: unknown[]) => void;

export function getCommunityQaHubUrl(): string {
  return resolveHubUrl(HUB_PATH, {
    directEnvKey: 'NEXT_PUBLIC_COMMUNITY_QA_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_COMMUNITY_QA_HUB_PROXY',
  });
}

class CommunityQaHubClient {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private refCount = 0;
  private handlers = new Map<CommunityQaHubEvent, Set<EventHandler>>();

  private buildConnection(hubUrl: string): signalR.HubConnection {
    const builder = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true,
        ...(isProxiedHubUrl(hubUrl)
          ? { transport: signalR.HttpTransportType.LongPolling }
          : {}),
      })
      .withAutomaticReconnect()
      .configureLogging(HUB_CONNECTION_LOG_LEVEL);

    const connection = builder.build();
    this.wireEvents(connection);
    return connection;
  }

  private wireEvents(connection: signalR.HubConnection): void {
    const wire = (event: CommunityQaHubEvent) => {
      connection.on(event, (...args: unknown[]) => {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
      });
    };

    wire('ThreadCreated');
    wire('ReplyPosted');
    wire('ThreadReactionChanged');
    wire('ReplyLikeChanged');
    wire('NotificationPulse');
  }

  private ensureConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = this.buildConnection(getCommunityQaHubUrl());
    }
    return this.connection;
  }

  private async startWithFallback(): Promise<void> {
    const primaryUrl = getCommunityQaHubUrl();
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
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (!this.startPromise) {
      this.startPromise = this.startWithFallback().finally(() => {
        this.startPromise = null;
      });
    }

    await this.startPromise;

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    return null;
  }

  async acquire(): Promise<signalR.HubConnection | null> {
    this.refCount += 1;
    const connection = await this.start();
    if (!connection) {
      this.refCount = Math.max(0, this.refCount - 1);
    }
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

  async leaveGroups(options: {
    threadId?: number;
    userId?: number;
    onList?: boolean;
  }): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    if (options.onList) {
      await connection.invoke('LeaveList');
    }

    if (options.threadId && options.threadId > 0) {
      await connection.invoke('LeaveThread', options.threadId);
    }

    if (options.userId && options.userId > 0) {
      await connection.invoke('LeaveUser', options.userId);
    }
  }

  on(event: CommunityQaHubEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: CommunityQaHubEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

export const communityQaHubClient = new CommunityQaHubClient();
