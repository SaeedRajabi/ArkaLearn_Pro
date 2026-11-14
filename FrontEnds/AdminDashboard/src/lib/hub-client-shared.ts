import * as signalR from '@microsoft/signalr';
import { getBackendApiOrigin } from '@/lib/api-config';

/** Keep SignalR negotiation failures out of the browser console in normal UX. */
export const HUB_CONNECTION_LOG_LEVEL = signalR.LogLevel.None;

const DISCONNECT_DEFER_MS = 150;

type ConnectHubOptions = {
  connection: signalR.HubConnection | null;
  setConnection: (connection: signalR.HubConnection | null) => void;
  buildConnection: (hubUrl: string) => signalR.HubConnection;
  hubUrlCandidates: string[];
};

export function getHubUrlCandidates(hubPath: string, resolvePrimary: () => string): string[] {
  if (typeof window === 'undefined') {
    return [resolvePrimary()];
  }

  const backendDirect = `${getBackendApiOrigin()}${hubPath}`;
  const proxyUrl = `${window.location.origin}${hubPath}`;
  const primaryUrl = resolvePrimary();
  const ordered = [primaryUrl, proxyUrl, backendDirect];
  const seen = new Set<string>();

  return ordered.filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export async function connectHubWithCandidates({
  connection,
  setConnection,
  buildConnection,
  hubUrlCandidates,
}: ConnectHubOptions): Promise<signalR.HubConnection | null> {
  let lastError: unknown;

  for (const hubUrl of hubUrlCandidates) {
    try {
      try {
        await connection?.stop();
      } catch {
        /* ignore */
      }

      const nextConnection = buildConnection(hubUrl);
      if (nextConnection.state === signalR.HubConnectionState.Disconnected) {
        await nextConnection.start();
      }
      setConnection(nextConnection);
      return nextConnection;
    } catch (error) {
      lastError = error;
    }
  }

  setConnection(null);
  if (process.env.NODE_ENV === 'development' && lastError) {
    console.debug('[hub] all connection candidates failed', lastError);
  }
  return null;
}

export function scheduleDeferredHubDisconnect(
  getRefCount: () => number,
  getConnection: () => signalR.HubConnection | null,
  setConnection: (connection: signalR.HubConnection | null) => void,
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
