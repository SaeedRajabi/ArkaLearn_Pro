const ROOM_JOIN_TICKET_KEY = 'edcentral-room-join-ticket';

export function persistRoomJoinTicket(ticket: string | undefined | null) {
  if (typeof window === 'undefined') return;
  if (ticket) {
    sessionStorage.setItem(ROOM_JOIN_TICKET_KEY, ticket);
  } else {
    sessionStorage.removeItem(ROOM_JOIN_TICKET_KEY);
  }
}

export function getRoomJoinTicket(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ROOM_JOIN_TICKET_KEY);
}

export function clearRoomJoinTicket() {
  persistRoomJoinTicket(null);
}
