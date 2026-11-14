# ArkaSoftware Desktop — Architecture (Phase 1)

Locked decisions from product review:

| Decision | Choice |
| --- | --- |
| App path | `FrontEnds/WinAPPs/ArkaLearnDesktop/` |
| WPF base | Existing empty shell `FrontEnds/WinAPPs/SecureOffline.UI/` (new solution layered on that concept) |
| Messenger | **Extend** `SupportChatAggregate` (student ↔ teacher). No separate DesktopMessenger aggregate. VIP gate stays `StudentSupportSubscription`. |
| DRM media | **Extend** existing `MediaAsset` (AES metadata + encrypted URL). No parallel media entity. |
| Offline grant | `OfflinePlaybackGrant` default TTL **72 hours** |
| Remote assist | `RemoteAssistSession` + Remotely-inspired adapter in later phase |
| Mandatory updates | `DesktopAppRelease` with `IsMandatory` / `MinSupportedVersion` |

## Solution layout

```
ArkaLearnDesktop/
  src/ArkaLearnDesktop.App          # WPF shell (dark SPA nav)
  src/ArkaLearnDesktop.Application  # MediatR contracts / use cases
  src/ArkaLearnDesktop.Domain       # Local DRM cache models
  src/ArkaLearnDesktop.Infrastructure
```

Nav placeholders: Player · Messenger · Remote Assist · Downloads · Settings.

## Backend mapping

| Concern | Aggregate / entity |
| --- | --- |
| Encrypted video metadata | `MediaAsset` (+ `EncryptedMediaStatus`) |
| Chat / stories / presence | `SupportConversation`, `SupportMessage`, `SupportTeacherStory`, `DesktopUserPresence` |
| VIP access to messenger | `StudentSupportSubscription` |
| License / device / blocks | `DesktopAppLicense`, `DesktopDeviceRegistration`, `DesktopAccessBlock` |
| Offline playback | `OfflinePlaybackGrant` |
| Remote assist request | `RemoteAssistSession` |
| App version gate | `DesktopAppRelease` |

EF configs live under Commands `Configurations/` + `SupportChat/Configs/`. Migration: `20261008120000_AddDesktopDrmAndMessengerExtensions`.

## Phase roadmap

1. **Done (Phase 1):** scaffold + domain + EF configs/migration + shell UI
2. **Done (Phase 2):** Auth (JWT via `Account/Login`) · API-only data (SQL Server backend) · `DesktopApp/CheckUpdate` gate · Login / MandatoryUpdate / Shell navigation
3. **Done (Phase 3):** AES-256-CBC encrypt-on-upload (`encryptForDesktop`) · `DesktopDrm` APIs · RAM loopback player · `SetWindowDisplayAffinity`
4. **Done (Phase 4):** SignalR SupportChat hub (`/hubs/support-chat`) · in-memory UI cache (no local DB) · VIP gate · stories bar · presence heartbeat
5. **Phase 5 (in progress):** Remote Assist session API + desktop UI · Downloads cache manager · Settings page · Remotely-inspired screen-share adapter · **Admin desktop release UI (done)** · **device access (done)** · **encryptForDesktop admin upload (done)** · obfuscation pipeline · full Remotely control/input

### Phase 4 notes

- Hub: `/hubs/support-chat` with JWT Bearer (desktop uses `AccessTokenProvider`)
- REST: existing `SupportChat/*` + `GetActiveStories`, `HeartbeatPresence`, `GetUserPresence`
- VIP: `SupportSubscription/GetMyStatus` (`HasActiveAccess`); teachers bypass locally
- **No local SQLite** — threads/messages read/write via `SupportChat/*` REST + SignalR; SQL Server is source of truth
- UI: `MessengerView` — thread list, chat pane, stories strip, online indicator

### Phase 5 notes (partial)

- Remote Assist REST: `RemoteAssist/Request`, `Accept`, `End`, `GetMyActive`, `GetPendingForTeacher`
- Remote Assist hub: `/hubs/remote-assist` — `SessionChanged`, `ScreenFrame` (JPEG relay), `InputRelay` (mouse/keyboard)
- Desktop: `RemoteAssistView` — student requests code/password; teacher accepts; live screen preview via `WindowsScreenShareAdapter`; teacher remote control via `WindowsRemoteInputExecutor` + `RelayInput`
- Downloads: `DownloadsView` — lists/deletes `%LocalAppData%/ArkaLearnDesktop/encrypted-cache/*.enc`
- Settings: `SettingsView` — API base URL, device id, logout
- Messenger: `clientMessageId` idempotency on send · auto-scroll to latest message
- **Done (device access):** `DesktopDrm/RegisterDevice`, `AccessStatus`, device/user block APIs + WPF registration on login + admin devices tab
- **Done (admin media):** `encryptForDesktop` toggle on video upload in Admin `MediaLibraryModal`
- **Done (remote control):** `RelayInput` hub relay + `WindowsRemoteInputExecutor` (SendInput)
- **Done (release build):** `build/publish-release.ps1` + `build/obfuscation/obfuscar.xml` (Obfuscar optional)
- **Pending:** full Remotely-grade multi-monitor / clipboard / file transfer

### Desktop local storage (client-only, not business data)

| File | Purpose |
| --- | --- |
| `%LocalAppData%/ArkaLearnDesktop/settings.json` | API base URL, device id |
| `%LocalAppData%/ArkaLearnDesktop/session.bin` | DPAPI-protected JWT (auto-login) |
| `%LocalAppData%/ArkaLearnDesktop/encrypted-cache/*.enc` | Encrypted video payloads (files only) |

SQL Server production script: `scripts/sqlserver-desktop-extensions.sql`

### Phase 3 notes

- Upload encrypted video: `POST Media/Upload` with `encryptForDesktop=true` (video only)
- DRM APIs: `DesktopDrm/MyEncryptedMedia`, `RequestOfflineGrant`, `PlaybackPackage`
- Offline grant TTL: **72 hours** (`OfflinePlaybackGrant.DefaultTtlHours`)
- Desktop decrypts in RAM and serves via loopback HTTP (no plaintext file on disk)
- Player page applies `WDA_EXCLUDEFROMCAPTURE` on the main window
- Production: set `DesktopDrm:MasterKeyBase64` (32-byte key) in API config

### Phase 2 notes

- API base: env `ARKASOFTWARE_API_BASE` (legacy `ARKALEARN_API_BASE`) or `settings.json` (default `https://localhost:5001/api/Service`)
- Startup: version check → mandatory block → validate stored JWT → Shell or Login
- Backend: `GET /api/Service/DesktopApp/CheckUpdate?currentVersion=` (AllowAnonymous)
- Business data: **SQL Server only** via REST/SignalR (no `desktop.db`)
