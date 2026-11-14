/**
 * Client-facing data: seminars with room links, registrations, and catalog.
 * In production, this would come from the API.
 */
import type { Seminar, SeminarRegistration, User } from './types';
import { seminars as storeSeminars } from './placeholder-data';
import {
  mockSeminarRooms,
  mockSeminarUsers,
  updateMockSeminarRoom,
} from './seminar-mock-data';

/** Seminars with roomId and price for client catalog */
export const clientSeminars: Seminar[] = storeSeminars.map((s) => {
  return {
    ...s,
    roomId:
      s.id === 'SEM-001'
        ? 'room-1'
        : s.id === 'SEM-002'
          ? 'room-2'
          : undefined,
    price: s.id === 'SEM-001' ? 0 : s.id === 'SEM-002' ? 5000 : 0,
  };
});

/** Client seminar registrations (user registered + paid) */
const _registrations: SeminarRegistration[] = [];

export function getClientSeminarRegistrations(
  userId: string
): SeminarRegistration[] {
  return _registrations.filter((r) => r.userId === userId);
}

export function addClientSeminarRegistration(
  seminarId: string,
  userId: string,
  user: User,
  roomEntryLink: string
): SeminarRegistration {
  const seminar = clientSeminars.find((s) => s.id === seminarId);
  const roomId = seminar?.roomId;
  if (roomId) {
    const room = mockSeminarRooms.find((r) => r.id === roomId);
    if (room) {
      const seminarUserId = `client-${userId}`;
      if (!room.participants.includes(seminarUserId)) {
        updateMockSeminarRoom({
          ...room,
          participants: [...room.participants, seminarUserId],
          participantRoles: {
            ...room.participantRoles,
            [seminarUserId]: 'participant',
          },
        });
      }
      const seminarUser = {
        id: seminarUserId,
        name: user.name,
        displayName: user.name.split(' ').map((n) => n[0]).join('.'),
        username: user.email.split('@')[0],
        email: user.email,
        emailVerified: true,
        role: 'participant' as const,
        avatar: user.avatarUrl || `https://picsum.photos/seed/${userId}/200/200`,
      };
      if (!mockSeminarUsers.find((u) => u.id === seminarUserId)) {
        mockSeminarUsers.push(seminarUser);
      }
    }
  }

  const reg: SeminarRegistration = {
    id: `REG-${Date.now()}`,
    seminarId,
    userId,
    status: 'Paid',
    registeredAt: new Date().toISOString(),
    roomEntryLink,
  };
  _registrations.push(reg);
  return reg;
}

export function isUserRegisteredForSeminar(
  seminarId: string,
  userId: string
): boolean {
  return _registrations.some(
    (r) =>
      r.seminarId === seminarId &&
      r.userId === userId &&
      (r.status === 'Paid' || r.status === 'Pending')
  );
}

export function getRegistrationForSeminar(
  seminarId: string,
  userId: string
): SeminarRegistration | undefined {
  return _registrations.find(
    (r) => r.seminarId === seminarId && r.userId === userId
  );
}
