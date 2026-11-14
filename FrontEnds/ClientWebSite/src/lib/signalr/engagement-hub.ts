import * as signalR from '@microsoft/signalr';
import { getBackendApiOrigin } from '@/lib/api/config';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/signalr/hub-url';
import {
  connectHubWithFallback,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/signalr/hub-client-shared';

const HUB_PATH = '/hubs/engagement';

export const ENGAGEMENT_SCOPES = {
  course: 'course',
  article: 'article',
  promotionalVideo: 'promotional-video',
} as const;

export type EngagementScope = (typeof ENGAGEMENT_SCOPES)[keyof typeof ENGAGEMENT_SCOPES];

export type EngagementHubEvent = 'CommentAdded' | 'LikeChanged' | 'NotificationPulse';

export interface CommentAddedPayload {
  scope: EngagementScope;
  entityId: number;
  commentId: number;
  parentId?: number | null;
}

export interface LikeChangedPayload {
  scope: EngagementScope;
  entityId: number;
  likeCount: number;
}

type EventHandler = (...args: unknown[]) => void;

export function getEngagementHubUrl(): string {
  return resolveHubUrl(HUB_PATH, {
    directEnvKey: 'NEXT_PUBLIC_ENGAGEMENT_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_ENGAGEMENT_HUB_PROXY',
  });
}

class EngagementHubClient {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private refCount = 0;
  private handlers = new Map<EngagementHubEvent, Set<EventHandler>>();

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
    const wire = (event: EngagementHubEvent) => {
      connection.on(event, (...args: unknown[]) => {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
      });
    };

    wire('CommentAdded');
    wire('LikeChanged');
    wire('NotificationPulse');
  }

  private ensureConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = this.buildConnection(getEngagementHubUrl());
    }
    return this.connection;
  }

  private async startWithFallback(): Promise<void> {
    const primaryUrl = getEngagementHubUrl();
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
    courseId?: number;
    articleId?: number;
    videoId?: number;
    userId?: number;
  }): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    if (options.courseId && options.courseId > 0) {
      await connection.invoke('LeaveCourse', options.courseId);
    }

    if (options.articleId && options.articleId > 0) {
      await connection.invoke('LeaveArticle', options.articleId);
    }

    if (options.videoId && options.videoId > 0) {
      await connection.invoke('LeaveVideo', options.videoId);
    }

    if (options.userId && options.userId > 0) {
      await connection.invoke('LeaveUser', options.userId);
    }
  }

  on(event: EngagementHubEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: EngagementHubEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

export const engagementHubClient = new EngagementHubClient();
