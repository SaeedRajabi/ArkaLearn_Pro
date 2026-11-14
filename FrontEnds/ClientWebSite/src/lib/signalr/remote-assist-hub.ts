import * as signalR from '@microsoft/signalr';

import { getBackendApiOrigin } from '@/lib/api/config';
import { isProxiedHubUrl, resolveHubUrl } from '@/lib/signalr/hub-url';
import {
  connectHubWithFallback,
  HUB_CONNECTION_LOG_LEVEL,
  scheduleDeferredHubDisconnect,
} from '@/lib/signalr/hub-client-shared';
import {
  normalizeRemoteAssistSession,
  type RemoteAssistSession,
} from '@/lib/api/remote-assist';

const HUB_PATH = '/hubs/remote-assist';

export type RemoteAssistHubEvent =
  | 'SessionChanged'
  | 'ConsentRequired'
  | 'ConsentResolved'
  | 'ScreenFrame'
  | 'InputRelay'
  | 'UserPresenceChanged';

export type RemoteAssistSessionChangedPayload = RemoteAssistSession & {
  changeType?: string;
};

export type RemoteAssistScreenFramePayload = {
  sessionId: number;
  jpegBase64: string;
};

export type RemoteAssistInputRelayPayload = {
  sessionId: number;
  payloadJson: string;
};

export type RemoteAssistUserPresenceChangedPayload = {
  userId: number;
  isOnline: boolean;
};

type EventHandler = (...args: unknown[]) => void;

function normalizeSessionEvent(raw: unknown): RemoteAssistSessionChangedPayload {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    ...normalizeRemoteAssistSession(row),
    changeType: String(row.changeType ?? row.ChangeType ?? ''),
  };
}

function normalizeScreenFrame(raw: unknown): RemoteAssistScreenFramePayload {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    sessionId: Number(row.sessionId ?? row.SessionId ?? 0),
    jpegBase64: String(row.jpegBase64 ?? row.JpegBase64 ?? ''),
  };
}

function normalizeInputRelay(raw: unknown): RemoteAssistInputRelayPayload {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    sessionId: Number(row.sessionId ?? row.SessionId ?? 0),
    payloadJson: String(row.payloadJson ?? row.PayloadJson ?? ''),
  };
}

function normalizeUserPresenceChanged(raw: unknown): RemoteAssistUserPresenceChangedPayload {
  const row = (raw ?? {}) as Record<string, unknown>;
  const online = row.isOnline ?? row.IsOnline;
  return {
    userId: Number(row.userId ?? row.UserId ?? 0),
    isOnline:
      typeof online === 'string'
        ? online.trim().toLowerCase() === 'true' || online.trim() === '1'
        : Boolean(online),
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
  private startPromise: Promise<void> | null = null;
  private refCount = 0;
  private handlers = new Map<RemoteAssistHubEvent, Set<EventHandler>>();
  private joinedUserIds = new Set<number>();
  private joinedSessionIds = new Set<number>();
  private joinedTeacherPool = false;

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
        'UserPresenceChanged',
      ] as RemoteAssistHubEvent[]
    ).forEach((event) => {
      connection.on(event, (...args: unknown[]) => {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
      });
    });

    connection.onreconnected(() => {
      void this.rejoinTrackedGroups(connection);
    });

    return connection;
  }

  private async rejoinTrackedGroups(connection: signalR.HubConnection): Promise<void> {
    if (connection.state !== signalR.HubConnectionState.Connected) return;
    const joins: Promise<unknown>[] = [];
    this.joinedUserIds.forEach((userId) => joins.push(connection.invoke('JoinUser', userId)));
    this.joinedSessionIds.forEach((sessionId) => joins.push(connection.invoke('JoinSession', sessionId)));
    if (this.joinedTeacherPool) joins.push(connection.invoke('JoinTeacherPool'));
    await Promise.allSettled(joins);
  }

  private async startWithFallback(): Promise<void> {
    const primaryUrl = getRemoteAssistHubUrl();
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

    const connection = this.connection;
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      return connection;
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

  async joinUser(userId: number): Promise<void> {
    if (userId <= 0) return;
    this.joinedUserIds.add(userId);
    const connection = this.connection;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('JoinUser', userId);
    }
  }

  async joinSession(sessionId: number): Promise<void> {
    if (sessionId <= 0) return;
    this.joinedSessionIds.add(sessionId);
    const connection = this.connection;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('JoinSession', sessionId);
    }
  }

  async joinTeacherPool(): Promise<void> {
    this.joinedTeacherPool = true;
    const connection = this.connection;
    if (connection?.state === signalR.HubConnectionState.Connected) {
      await connection.invoke('JoinTeacherPool');
    }
  }

  async leaveGroups(options: {
    sessionId?: number;
    userId?: number;
    teacherPool?: boolean;
  }): Promise<void> {
    if (options.sessionId && options.sessionId > 0) {
      this.joinedSessionIds.delete(options.sessionId);
    }
    if (options.userId && options.userId > 0) {
      this.joinedUserIds.delete(options.userId);
    }
    if (options.teacherPool) {
      this.joinedTeacherPool = false;
    }

    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      if (options.sessionId && options.sessionId > 0) {
        await connection.invoke('LeaveSession', options.sessionId);
      }
      if (options.userId && options.userId > 0) {
        await connection.invoke('LeaveUser', options.userId);
      }
      if (options.teacherPool) {
        await connection.invoke('LeaveTeacherPool');
      }
    } catch {
      /* hub may be unavailable */
    }
  }

  async relayInput(sessionId: number, payloadJson: string): Promise<void> {
    const connection = this.connection;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }
    if (sessionId <= 0 || !payloadJson) return;
    try {
      await connection.invoke('RelayInput', sessionId, payloadJson);
    } catch {
      /* ignore transient relay errors */
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

export {
  normalizeSessionEvent,
  normalizeScreenFrame,
  normalizeInputRelay,
  normalizeUserPresenceChanged,
};
