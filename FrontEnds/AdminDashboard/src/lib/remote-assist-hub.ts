import * as signalR from '@microsoft/signalr';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/hub-url';
import {
  connectHubWithCandidates,
  getHubUrlCandidates,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/hub-client-shared';
import {
  normalizeRemoteAssistSession,
  type RemoteAssistSession,
} from '@/services/remote-assist-api.service';

const HUB_PATH = '/hubs/remote-assist';

export type RemoteAssistHubEvent =
  | 'SessionChanged'
  | 'ConsentRequired'
  | 'ConsentResolved'
  | 'ScreenFrame'
  | 'InputRelay';

export type RemoteAssistSessionChangedPayload = RemoteAssistSession & {
  changeType?: string;
};

export type RemoteAssistScreenFramePayload = {
  sessionId: number;
  jpegBase64: string;
};

type EventHandler = (...args: unknown[]) => void;

export function normalizeSessionEvent(raw: unknown): RemoteAssistSessionChangedPayload {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    ...normalizeRemoteAssistSession(row),
    changeType: String(row.changeType ?? row.ChangeType ?? ''),
  };
}

export function normalizeScreenFrame(raw: unknown): RemoteAssistScreenFramePayload {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    sessionId: Number(row.sessionId ?? row.SessionId ?? 0),
    jpegBase64: String(row.jpegBase64 ?? row.JpegBase64 ?? ''),
  };
}

export function getRemoteAssistHubUrl(): string {
  return resolveHubUrl(HUB_PATH, {
    directEnvKey: 'NEXT_PUBLIC_REMOTE_ASSIST_HUB_DIRECT',
    proxyEnvKey: 'NEXT_PUBLIC_REMOTE_ASSIST_HUB_PROXY',
  });
}

class RemoteAssistHubClient {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<signalR.HubConnection | null> | null = null;
  private refCount = 0;
  private handlers = new Map<RemoteAssistHubEvent, Set<EventHandler>>();

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
      [
        'SessionChanged',
        'ConsentRequired',
        'ConsentResolved',
        'ScreenFrame',
        'InputRelay',
      ] as RemoteAssistHubEvent[]
    ).forEach((event) => {
      connection.on(event, (...args: unknown[]) => {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
      });
    });

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
        hubUrlCandidates: getHubUrlCandidates(HUB_PATH, getRemoteAssistHubUrl),
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
      }
    );
  }

  async leaveGroups(options: { sessionId?: number; userId?: number }): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;

    try {
      if (options.sessionId && options.sessionId > 0) {
        await connection.invoke('LeaveSession', options.sessionId);
      }
      if (options.userId && options.userId > 0) {
        await connection.invoke('LeaveUser', options.userId);
      }
    } catch {
      /* optional */
    }
  }

  async relayInput(sessionId: number, payloadJson: string): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
    if (sessionId <= 0 || !payloadJson) return;
    try {
      await connection.invoke('RelayInput', sessionId, payloadJson);
    } catch {
      /* ignore */
    }
  }

  on(event: RemoteAssistHubEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: RemoteAssistHubEvent, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

export const remoteAssistHubClient = new RemoteAssistHubClient();
