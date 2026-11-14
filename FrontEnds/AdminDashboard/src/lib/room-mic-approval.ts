/** Stable key for mic approval — survives SignalR reconnect (connectionId changes). */
export function micApprovalKey(userId: string | undefined, connectionId: string): string {
  const uid = String(userId ?? '').trim();
  return uid.length > 0 ? `user:${uid}` : `conn:${connectionId}`;
}

export function isMicApprovedForPeer(
  approved: Record<string, boolean>,
  userId: string | undefined,
  connectionId: string
): boolean {
  const key = micApprovalKey(userId, connectionId);
  return approved[key] === true || approved[connectionId] === true;
}

export function markMicApprovedForPeer(
  approved: Record<string, boolean>,
  userId: string | undefined,
  connectionId: string
): Record<string, boolean> {
  const key = micApprovalKey(userId, connectionId);
  return { ...approved, [key]: true, [connectionId]: true };
}

export function clearMicApprovalForPeer(
  approved: Record<string, boolean>,
  userId: string | undefined,
  connectionId: string
): Record<string, boolean> {
  const key = micApprovalKey(userId, connectionId);
  if (!approved[key] && !approved[connectionId]) return approved;
  const next = { ...approved };
  delete next[key];
  delete next[connectionId];
  return next;
}
