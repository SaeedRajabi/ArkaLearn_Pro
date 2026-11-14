/**
 * Pure permission/grant logic for the online classroom.
 *
 * Roles:
 *   organizer / admin  → implicit full control (host side)
 *   presenter          → role-level presenter grant (legacy all-in-one)
 *   participant        → student; capabilities come from granular grants
 *
 * Grants:
 *   voice     → may unmute/publish microphone
 *   video     → may enable/publish camera
 *   presenter → may share the screen
 */

export type RoomRole = 'organizer' | 'admin' | 'presenter' | 'participant';

export interface ParticipantGrants {
  voice: boolean;
  video: boolean;
  presenter: boolean;
}

export const HOST_ROLES: readonly RoomRole[] = ['organizer', 'admin'];

export function isHostRole(role: string): boolean {
  return role === 'organizer' || role === 'admin';
}

/** Default (revoked) grants for a student entering the room. */
export function defaultGrants(): ParticipantGrants {
  return { voice: false, video: false, presenter: false };
}

/** Grants implied by a legacy all-in-one role change. */
export function grantsAfterRoleChange(role: 'participant' | 'presenter'): ParticipantGrants {
  return role === 'presenter'
    ? { voice: true, video: true, presenter: true }
    : defaultGrants();
}

/** Hosts and presenters implicitly hold every capability. */
export function canUseMic(role: RoomRole | string, grants?: ParticipantGrants): boolean {
  if (isHostRole(role) || role === 'presenter') return true;
  return Boolean(grants?.voice);
}

export function canUseCamera(role: RoomRole | string, grants?: ParticipantGrants): boolean {
  if (isHostRole(role) || role === 'presenter') return true;
  return Boolean(grants?.video);
}

export function canShareScreen(role: RoomRole | string, grants?: ParticipantGrants): boolean {
  if (isHostRole(role) || role === 'presenter') return true;
  return Boolean(grants?.presenter);
}

/** Applies a partial grant change (from the host) onto current grants. */
export function applyGrantChange(
  current: ParticipantGrants,
  change: Partial<ParticipantGrants>
): ParticipantGrants {
  return {
    voice: change.voice ?? current.voice,
    video: change.video ?? current.video,
    presenter: change.presenter ?? current.presenter,
  };
}

/**
 * Which local media must be force-stopped after a revocation.
 * Returns only the kinds that were ON and are no longer permitted.
 */
export type MediaKind = 'mic' | 'camera' | 'screen';

export function revokedMedia(
  role: RoomRole | string,
  grants: ParticipantGrants,
  active: { mic: boolean; camera: boolean; screen: boolean }
): MediaKind[] {
  const revoked: MediaKind[] = [];
  if (active.mic && !canUseMic(role, grants)) revoked.push('mic');
  if (active.camera && !canUseCamera(role, grants)) revoked.push('camera');
  if (active.screen && !canShareScreen(role, grants)) revoked.push('screen');
  return revoked;
}
