import * as signalR from '@microsoft/signalr';

/** Keep SignalR negotiation failures out of the browser console in production UX. */
export const HUB_CONNECTION_LOG_LEVEL = signalR.LogLevel.None;

const DISCONNECT_DEFER_MS = 150;

type ConnectHubOptions = {
  connection: signalR.HubConnection | null;
  setConnection: (connection: signalR.HubConnection | null) => void;
  buildConnection: (hubUrl: string) => signalR.HubConnection;
  primaryUrl: string;
  fallbackUrl: string;
};

export async function connectHubWithFallback({
  connection,
  setConnection,
  buildConnection,
  primaryUrl,
  fallbackUrl,
}: ConnectHubOptions): Promise<signalR.HubConnection | null> {
  let activeConnection = connection ?? buildConnection(primaryUrl);

  try {
    if (activeConnection.state === signalR.HubConnectionState.Disconnected) {
      await activeConnection.start();
    }
    setConnection(activeConnection);
    return activeConnection;
  } catch {
    /* try fallback below */
  }

  if (primaryUrl !== fallbackUrl) {
    try {
      if (activeConnection.state !== signalR.HubConnectionState.Disconnected) {
        await activeConnection.stop();
      }
    } catch {
      /* ignore */
    }

    activeConnection = buildConnection(fallbackUrl);
    try {
      await activeConnection.start();
      setConnection(activeConnection);
      return activeConnection;
    } catch {
      /* hub unavailable */
    }
  }

  try {
    if (activeConnection.state !== signalR.HubConnectionState.Disconnected) {
      await activeConnection.stop();
    }
  } catch {
    /* ignore */
  }

  setConnection(null);
  return null;
}

export function scheduleDeferredHubDisconnect(
  getRefCount: () => number,
  getConnection: () => signalR.HubConnection | null,
  setConnection: (connection: signalR.HubConnection | null) => void
): void {
  if (typeof window === 'undefined') return;

  window.setTimeout(() => {
    if (getRefCount() > 0) return;

    const connection = getConnection();
    if (!connection) return;

    void connection.stop().finally(() => {
      if (getRefCount() === 0) {
        setConnection(null);
      }
    });
  }, DISCONNECT_DEFER_MS);
}
