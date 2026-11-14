# Online room — production checklist (Plesk / IIS)

The live room depends on **SignalR** (`/meetingHub`) and the **API** (`https://api.arkasoftware.ir`). Most production failures are server routing, not React UI.

## Architecture

```
Browser (admin-dashboard.arkasoftware.ir)
  → /meetingHub       same-origin proxy → Next.js server.js → API /meetingHub (default)
  → /svc/Service/*    same-origin → Next.js proxy → API /api/Service
  → WebRTC media      peer-to-peer (STUN: Google; optional TURN)
```

The browser uses the **same-origin hub proxy** by default so SignalR negotiate never hits cross-origin CORS. Set `NEXT_PUBLIC_MEETING_HUB_DIRECT=1` only if you intentionally connect straight to `api.arkasoftware.ir/meetingHub` (API CORS must allow the dashboard origin).

## 1. Admin Dashboard (Plesk Node.js)

1. Build: `npm run build` (standalone output).
2. Deploy the **standalone** folder contents to the Node app root (includes `server.js`, `.next`, `public/web.config`).
3. In Plesk → Node.js:
   - **Application root** = folder with `server.js`
   - **Application startup file** = `server.js`
   - **Environment variables** (required at build/runtime):
     - `API_URL` = `https://api.arkasoftware.ir`
     - `NODE_ENV` = `production`
4. Restart the Node.js app after every deploy.

### Verify SignalR proxy

Open (while logged into a room):

```
https://admin-dashboard.arkasoftware.ir/meetingHub/negotiate?negotiateVersion=1
```

Expected: JSON with `connectionId` and `availableTransports` — **not** an IIS HTML 404 page.

If you see IIS 404:

- Confirm `public/web.config` was deployed (allows DELETE/OPTIONS, rewrites `meetingHub` → `server.js`).
- Confirm Plesk Node handler is active (do not replace Plesk’s handler block with a broken iisnode-only config).
- Confirm no physical `/meetingHub` folder exists in the site root.

## 2. API (Plesk / IIS + ASP.NET)

1. Publish **ArkaSoftware API** with `MeetingHub` hub and recent CORS/OPTIONS fixes.
2. Verify hub:

```
https://api.arkasoftware.ir/meetingHub/negotiate?negotiateVersion=1
```

3. CORS must allow `https://admin-dashboard.arkasoftware.ir` with credentials (already in `HostingExtension.cs`).
4. IIS must allow **WebSockets** on the API site (optional; dashboard uses LongPolling through proxy).
5. IIS must allow **DELETE** on the API site (SignalR disconnect).

## 3. Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `API_URL` | Dashboard build + Node runtime | Proxy target for `/svc` and `/meetingHub` |
| `NEXT_PUBLIC_API_URL` | Dashboard build | Static assets / client fallbacks |
| `NEXT_PUBLIC_MEETING_HUB_DIRECT` | Optional `1` | Force direct API hub URL (requires API CORS) |
| `NEXT_PUBLIC_TURN_URL` | Dashboard build | Coturn URL(s), comma-separated: `turn:host:3478,turns:host:5349` |
| `NEXT_PUBLIC_TURN_USERNAME` | Dashboard build | Coturn long-term credential username |
| `NEXT_PUBLIC_TURN_CREDENTIAL` | Dashboard build | Coturn password |
| `NEXT_PUBLIC_STUN_URLS` | Optional | Override default Google STUN fallbacks |
| `NEXT_PUBLIC_WEBRTC_ICE_TRANSPORT_POLICY` | Optional `relay` | Force all media through TURN (debug NAT issues) |

### Coturn on Plesk Linux (native, no Docker)

1. Install: `apt install coturn` (or equivalent).
2. Enable in `/etc/default/coturn`: `TURNSERVER_ENABLED=1`.
3. Minimal `/etc/turnserver.conf`:
   ```
   listening-port=3478
   tls-listening-port=5349
   fingerprint
   lt-cred-mech
   user=YOUR_USERNAME:YOUR_PASSWORD
   realm=turn.arkasoftware.ir
   external-ip=YOUR_PUBLIC_IP
   ```
4. Open firewall: UDP/TCP **3478**, TCP **5349** (if using TLS TURN).
5. Set the `NEXT_PUBLIC_TURN_*` variables on the **dashboard** Node.js app and rebuild.

ICE config lives in `src/lib/webrtc-ice-config.ts`; every `RTCPeerConnection` uses `getWebRtcPeerConnectionConfig()`.

## 4. Feature checklist after deploy

| Test | Pass criteria |
|------|----------------|
| Student before teacher | Waiting screen; no 401 spam in console; hub connects |
| Teacher enters | Waiting students auto-join (`AdmittedToRoom`) |
| Teacher mic on/off | Mic button stays enabled; students see correct mute icon |
| Student mic request | Student sees consent dialog; teacher hears after accept |
| Screen share | Students see teacher screen on main stage |
| Kick student | Student leaves; teacher list updates |

## 5. Common console messages (safe to ignore)

- `runtime.lastError: Receiving end does not exist` — browser extension
- `beforeinstallprompt` / PWA banner — install prompt handler
- `picsum.photos` timeout — placeholder avatar when external host is blocked

## 6. Optional: direct API hub (advanced)

Only if you must bypass the dashboard proxy:

1. Set `NEXT_PUBLIC_MEETING_HUB_DIRECT=1` on dashboard build.
2. Ensure API `AllowedOrigins` includes `https://admin-dashboard.arkasoftware.ir` and IIS allows OPTIONS/DELETE on the API site.
3. Rebuild and redeploy dashboard.
