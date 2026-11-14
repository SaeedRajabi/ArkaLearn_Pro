import * as signalR from '@microsoft/signalr';
import { getBackendApiOrigin } from '@/lib/api/config';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/signalr/hub-url';
import {
  connectHubWithFallback,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/signalr/hub-client-shared';

const HUB_PATH = '/hubs/project-qa';

export type ProjectQaHubEvent =
  | 'AnswerPosted'
  | 'QuestionSubmitted'
  | 'QuestionReviewed'
  | 'NotificationPulse';

export interface AnswerPostedPayload {
  projectId: number;
  questionId: number;
}

export interface QuestionSubmittedPayload {
  projectId: number;
  questionId: number;
}

export interface QuestionReviewedPayload {
  projectId: number;
  questionId: number;
  approved: boolean;
}

type EventHandler = (...args: unknown[]) => void;

export function getProjectQaHubUrl(): string {
  return resolveHubUrl(HUB_PATH, {
    directEnvKey: 'NEXT_PUBLIC_PROJECT_QA_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_PROJECT_QA_HUB_PROXY',
  });
}

class ProjectQaHubClient {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private refCount = 0;
  private handlers = new Map<ProjectQaHubEvent, Set<EventHandler>>();

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
    const wire = (event: ProjectQaHubEvent) => {
      connection.on(event, (...args: unknown[]) => {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
      });
    };

    wire('AnswerPosted');
    wire('QuestionSubmitted');
    wire('QuestionReviewed');
    wire('NotificationPulse');
  }

  private ensureConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = this.buildConnection(getProjectQaHubUrl());
    }
    return this.connection;
  }

  private async startWithFallback(): Promise<void> {
    const primaryUrl = getProjectQaHubUrl();
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
    projectId?: number;
    userId?: number;
    isAdmin?: boolean;
  }): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    if (options.projectId && options.projectId > 0) {
      await connection.invoke('LeaveProject', options.projectId);
    }

    if (options.userId && options.userId > 0) {
      await connection.invoke('LeaveUser', options.userId);
    }

    if (options.isAdmin) {
      await connection.invoke('LeaveAdmin');
    }
  }

  on(event: ProjectQaHubEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: ProjectQaHubEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

export const projectQaHubClient = new ProjectQaHubClient();
