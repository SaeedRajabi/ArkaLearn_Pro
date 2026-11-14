import * as signalR from '@microsoft/signalr';
import { getBackendApiOrigin } from '@/lib/api-config';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/hub-url';

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
      .configureLogging(signalR.LogLevel.Error);

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

  private getHubUrlCandidates(): string[] {
    const directUrl = `${getBackendApiOrigin()}${HUB_PATH}`;
    if (typeof window === 'undefined') {
      return [getProjectQaHubUrl()];
    }

    const proxyUrl = `${window.location.origin}${HUB_PATH}`;
    const primaryUrl = getProjectQaHubUrl();
    const ordered = [primaryUrl, proxyUrl, directUrl];
    const seen = new Set<string>();

    return ordered.filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }

  private async startWithFallback(): Promise<void> {
    let lastError: unknown;

    for (const hubUrl of this.getHubUrlCandidates()) {
      try {
        try {
          await this.connection?.stop();
        } catch {
          /* ignore */
        }

        this.connection = this.buildConnection(hubUrl);
        await this.connection.start();
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  private async start(): Promise<signalR.HubConnection> {
    const connection = this.ensureConnection();
    if (connection.state === signalR.HubConnectionState.Connected) {
      return connection;
    }

    if (!this.startPromise) {
      this.startPromise = this.startWithFallback().finally(() => {
        this.startPromise = null;
      });
    }

    await this.startPromise;
    return this.ensureConnection();
  }

  async acquire(): Promise<signalR.HubConnection> {
    this.refCount += 1;
    return this.start();
  }

  release(): void {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0 && this.connection) {
      void this.connection.stop();
      this.connection = null;
    }
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
