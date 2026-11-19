/**
 * STUN/TURN configuration for the WebRTC mesh classroom.
 *
 * Install coturn natively on your Plesk Linux server, then set these env vars
 * in Plesk → Node.js → Environment variables (or `.env` for local builds):
 *
 *   NEXT_PUBLIC_TURN_URL=turn:your-plesk-domain-or-ip:3478,turns:your-plesk-domain-or-ip:5349
 *   NEXT_PUBLIC_TURN_USERNAME=your_turn_username
 *   NEXT_PUBLIC_TURN_CREDENTIAL=your_turn_password
 *
 * Optional:
 *   NEXT_PUBLIC_STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
 *   NEXT_PUBLIC_WEBRTC_ICE_TRANSPORT_POLICY=all   (use `relay` to force TURN-only)
 *
 * Example coturn `/etc/turnserver.conf` (minimal):
 *   listening-port=3478
 *   tls-listening-port=5349
 *   fingerprint
 *   lt-cred-mech
 *   user=your_turn_username:your_turn_password
 *   realm=your-plesk-domain-or-ip
 *   external-ip=YOUR_PUBLIC_IP
 */

/** Fallback public STUN when no custom STUN env is set. */
const DEFAULT_PUBLIC_STUN: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * Runtime ICE servers pushed from the admin dashboard (LiveMediaTransportSettings).
 * Admin-managed TURN is the primary source; env vars remain a build-time fallback.
 */
let runtimeIceServers: RTCIceServer[] | null = null;

export type RuntimeIceServerConfig = {
  turnUrls?: string | null;
  turnUsername?: string | null;
  turnPassword?: string | null;
  stunUrls?: string | null;
};

/** Stores ICE servers fetched from the admin settings (call once on room mount). */
export function setRuntimeIceServers(config: RuntimeIceServerConfig): void {
  // Collect every URL from both fields, then sort by scheme so turn:/turns: URLs
  // always land in ONE entry carrying the shared username/credential pair, and
  // stun: URLs stay credential-free. This prevents the browser error
  // "Both username and credential are required when the URL scheme is turn or turns"
  // regardless of which field the admin pastes the URLs into.
  const allUrls = [
    ...parseCommaSeparatedUrls(config.turnUrls ?? null),
    ...parseCommaSeparatedUrls(config.stunUrls ?? null),
  ];

  const turnUrls: string[] = [];
  const servers: RTCIceServer[] = [];

  for (const url of allUrls) {
    if (/^(turn|turns):/i.test(url)) {
      turnUrls.push(url);
    } else if (/^stun:/i.test(url)) {
      servers.push({ urls: url });
    }
    // Unknown schemes are silently skipped — browsers reject them anyway.
  }

  const username = config.turnUsername?.trim();
  const password = config.turnPassword?.trim();
  // آدرس TURN بدون هر دو اعتبارنامه وارد RTCConfiguration نمی‌شود؛ وارد کردن URL به تنهایی کافی نیست.
  if (turnUrls.length > 0 && username && password) {
    servers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username,
      credential: password,
    });
  }

  runtimeIceServers = servers.length > 0 ? servers : null;
}

/**
 * Placeholder TURN block — replace via env vars in production.
 * Do not commit real credentials; use Plesk environment variables instead.
 */
export const EXAMPLE_TURN_ICE_SERVER: RTCIceServer = {
  urls: 'turn:your-plesk-domain-or-ip:3478',
  username: 'your_turn_username',
  credential: 'your_turn_password',
};

/** آدرس‌های جداشده با کاما یا خط جدید را پاک‌سازی می‌کند؛ اعتبار شبکه یا DNS را بررسی نمی‌کند. */
function parseCommaSeparatedUrls(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** fallback زمان build را می‌سازد؛ تغییر NEXT_PUBLIC در سرور به تنهایی بسته مرورگر موجود را تغییر نمی‌دهد. */
function buildTurnIceServer(): RTCIceServer | null {
  const urls = parseCommaSeparatedUrls(process.env.NEXT_PUBLIC_TURN_URL);
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim();
  const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim();

  // A turn: entry without credentials crashes RTCPeerConnection construction —
  // drop incomplete TURN configs instead of breaking every peer connection.
  if (urls.length === 0 || !username || !credential) return null;

  return {
    urls: urls.length === 1 ? urls[0] : urls,
    username,
    credential,
  };
}

/** ICE server list for RTCPeerConnection: admin runtime config first, then env, then public STUN. */
export function getWebRtcIceServers(): RTCIceServer[] {
  if (runtimeIceServers && runtimeIceServers.length > 0) {
    const servers = [...runtimeIceServers];
    // Preserve the configured TURN fallback when runtime settings only contain STUN.
    if (!servers.some((server) => (Array.isArray(server.urls) ? server.urls : [server.urls]).some((url) => /^turns?:/i.test(url)))) {
      const fallbackTurn = buildTurnIceServer();
      if (fallbackTurn) servers.push(fallbackTurn);
    }
    return servers;
  }

  const stunOverride = parseCommaSeparatedUrls(process.env.NEXT_PUBLIC_STUN_URLS);
  const servers: RTCIceServer[] =
    stunOverride.length > 0
      ? stunOverride.map((url) => ({ urls: url }))
      : [...DEFAULT_PUBLIC_STUN];

  const turn = buildTurnIceServer();
  if (turn) {
    servers.push(turn);
  }

  return servers;
}

/**
 * Full RTCConfiguration used for every mesh peer connection.
 * All RTCPeerConnection instances must use this object.
 */
export function getWebRtcPeerConnectionConfig(): RTCConfiguration {
  const policy = process.env.NEXT_PUBLIC_WEBRTC_ICE_TRANSPORT_POLICY?.trim().toLowerCase();

  return {
    iceServers: getWebRtcIceServers(),
    iceTransportPolicy: policy === 'relay' ? 'relay' : 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 0,
  };
}

/** Whether a dedicated TURN server is configured (admin runtime config or env). */
export function isTurnConfigured(): boolean {
  // این تابع وجود تنظیم TURN را می‌سنجد، نه موفقیت تخصیص relay یا عبور ترافیک از آن.
  return getWebRtcIceServers().some((server) =>
    (Array.isArray(server.urls) ? server.urls : [server.urls]).some((url) => /^turns?:/i.test(url))
  );
}
