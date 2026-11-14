'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { SeminarUser } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import type { AuthUser } from '@/lib/auth/types';
import { clearRoomAccessToken, persistRoomAccessToken } from '@/lib/room-access-token';
import { clearRoomJoinTicket, persistRoomJoinTicket } from '@/lib/room-join-ticket';
import { usePathname } from 'next/navigation';

const ROOM_SESSION_KEY = 'edcentral-room-student';

type SeminarContextType = {
  user: SeminarUser | null;
  loginForRoom: (user: SeminarUser) => void;
  logoutFromRoom: () => void;
  updateRoomUser: (user: SeminarUser) => void;
  addRecording?: (recording: { name: string; url: string; duration: number; timestamp: number; size: number; fileExtension: string }) => void;
  recordings?: unknown[];
  clearRecordings?: () => void;
};

const SeminarContext = createContext<SeminarContextType | undefined>(undefined);

/** نقش اتاق از roleName احراز هویت — نه از User.role داشبورد (معلم آنجا User است). */
function mapAuthUserToSeminarUser(a: AuthUser): SeminarUser {
  const isAdmin = a.roleName === 'admin';
  const isTeacher = a.roleName === 'teacher';
  const role: SeminarUser['role'] = isAdmin ? 'organizer' : isTeacher ? 'presenter' : 'participant';
  return {
    id: String(a.id),
    name: a.name,
    displayName: a.name || a.userName || a.email.split('@')[0] || String(a.id),
    username: a.userName || a.email.split('@')[0] || String(a.id),
    email: a.email,
    emailVerified: true,
    role,
    avatar: a.avatarUrl ?? '',
  };
}

/**
 * مدیر/معلم فقط وقتی از نشست داشبورد تأییدشده (کوکی/توکن معتبر از API) وارد اتاق می‌شوند.
 * دانش‌آموز باید ورود اتاق (roomStudent) را تکمیل کند.
 */
function selectSeminarUser(
  authUser: AuthUser | null,
  roomStudent: SeminarUser | null,
  sessionVerified: boolean
): SeminarUser | null {
  if (
    sessionVerified &&
    authUser &&
    (authUser.roleName === 'admin' || authUser.roleName === 'teacher')
  ) {
    return mapAuthUserToSeminarUser(authUser);
  }
  if (roomStudent) return roomStudent;
  return null;
}

export function SeminarProvider({ children }: { children: ReactNode }) {
  const { authUser, sessionVerified } = useAuth();
  const pathname = usePathname();
  const onPublicRoomRoute = pathname?.startsWith('/room/') ?? false;
  const [roomStudent, setRoomStudent] = useState<SeminarUser | null>(null);
  const [recordings, setRecordings] = useState<unknown[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // We intentionally do not load from sessionStorage here anymore
    // so that a refresh forces the user to log in again.
    const stored = sessionStorage.getItem(ROOM_SESSION_KEY);
    if (stored) {
      sessionStorage.removeItem(ROOM_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      sessionVerified &&
      authUser &&
      (authUser.roleName === 'admin' || authUser.roleName === 'teacher')
    ) {
      // Staff use cookie auth; drop any stale room JWT so it is not sent as Bearer on Room/* calls.
      clearRoomAccessToken();
    }
  }, [sessionVerified, authUser]);

  const loginForRoom = useCallback((user: SeminarUser) => {
    setRoomStudent(user);
    persistRoomAccessToken(user.roomAccessToken);
    persistRoomJoinTicket(user.roomJoinTicket);
  }, []);

  const logoutFromRoom = useCallback(() => {
    setRoomStudent(null);
    clearRoomAccessToken();
    clearRoomJoinTicket();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ROOM_SESSION_KEY);
    }
  }, []);

  const updateRoomUser = useCallback((user: SeminarUser) => {
    setRoomStudent(user);
    persistRoomAccessToken(user.roomAccessToken);
  }, []);

  const addRecording = useCallback((recording: { name: string; url: string; duration: number; timestamp: number; size: number; fileExtension: string }) => {
    const newRec = { ...recording, id: `rec-${Date.now()}` };
    setRecordings((prev) => [...prev, newRec]);
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('edcentral-recordings');
      const arr = stored ? JSON.parse(stored) : [];
      arr.push(newRec);
      sessionStorage.setItem('edcentral-recordings', JSON.stringify(arr));
    }
  }, []);

  const clearRecordings = useCallback(() => {
    setRecordings([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('edcentral-recordings');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('edcentral-recordings');
    if (stored) {
      try {
        setRecordings(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('edcentral-recordings');
      }
    }
  }, []);

  const user: SeminarUser | null = useMemo(() => {
    if (onPublicRoomRoute) {
      return roomStudent;
    }
    return selectSeminarUser(authUser, roomStudent, sessionVerified);
  }, [onPublicRoomRoute, authUser, roomStudent, sessionVerified]);

  const value: SeminarContextType = {
    user,
    loginForRoom,
    logoutFromRoom,
    updateRoomUser,
    addRecording,
    recordings,
    clearRecordings,
  };

  return <SeminarContext.Provider value={value}>{children}</SeminarContext.Provider>;
}

export function useSeminar() {
  const ctx = useContext(SeminarContext);
  if (ctx === undefined) {
    throw new Error('useSeminar must be used within SeminarProvider');
  }
  return ctx;
}
