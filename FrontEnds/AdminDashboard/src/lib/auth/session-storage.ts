/**
 * نشان نشست در localStorage — فقط برای جلوگیری از فلش لاگین تا زمان تأیید کوکی با get-user.
 * انقضای واقعی نشست فقط سمت سرور (کوکی) است؛ این hint را عمداً TTL نمی‌کنیم تا رفرش مرورگر کاربر را بیرون نکند.
 */

import type { AuthUser } from './types';
import type { RoleId } from './types';

const KEY = 'edcentral-auth-hint';

export type SessionHint = {
  id: string;
  userName: string;
  name: string;
  email: string;
  roleId: RoleId;
  roleName: AuthUser['roleName'];
  initials: string;
  ts: number;
};

export function getSessionHint(): SessionHint | null {
  if (typeof window === 'undefined') return null;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      const legacy = sessionStorage.getItem(KEY);
      if (legacy) {
        localStorage.setItem(KEY, legacy);
        sessionStorage.removeItem(KEY);
        raw = legacy;
      }
    }
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionHint;
    if (!data?.id) return null;
    return data;
  } catch {
    return null;
  }
}

export function setSessionHint(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    const hint: SessionHint = {
      id: user.id,
      userName: user.userName,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
      initials: user.initials,
      ts: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(hint));
  } catch {
    // ignore
  }
}

export function clearSessionHint(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** تبدیل hint به AuthUser موقت برای نمایش تا زمان پاسخ get-user */
export function hintToAuthUser(h: SessionHint): AuthUser {
  return {
    id: h.id,
    userName: h.userName,
    name: h.name,
    email: h.email,
    roleId: h.roleId,
    roleName: h.roleName,
    status: 'ACTIVE',
    avatarUrl: null,
    initials: h.initials,
    registrationDate: new Date(),
    lastLogin: new Date(),
  };
}
