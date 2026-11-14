'use client';

// Authentication utility functions

// Check if user is authenticated

import type { CurrentUser } from '@/lib/api/account';
import { resolveUserProfileImageUrl } from '@/lib/utils/image-url';

const AUTH_TOKEN_KEY = 'authToken';
const CURRENT_USER_KEY = 'currentUser';
const AUTH_EXPIRES_AT_KEY = 'authExpiresAt';
const AUTH_PHONE_NUMBER_KEY = 'authPhoneNumber';
const UNAUTHORIZED_EVENT_NAME = 'arka-auth-unauthorized';

function decodeJwtExpiry(token: string): number | null {
    if (!token || token === 'session') return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
        const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

export function isStoredAuthExpired(): boolean {
    if (typeof window === 'undefined') return true;

    const expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_AT_KEY) ?? 0);
    return expiresAt > 0 && Date.now() >= expiresAt;
}

export function notifyUnauthorized(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT_NAME));
}

export function onUnauthorized(handler: () => void): () => void {
    if (typeof window === 'undefined') return () => {};

    window.addEventListener(UNAUTHORIZED_EVENT_NAME, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT_NAME, handler);
}

export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    if (isStoredAuthExpired()) {
        clearAuthData();
        return false;
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
}

// Get current user from localStorage (sync)
export function getStoredUser(): CurrentUser | null {
    if (typeof window === 'undefined') return null;

    if (isStoredAuthExpired()) {
        clearAuthData();
        return null;
    }

    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    if (!userStr) return null;

    try {
        const user = JSON.parse(userStr) as CurrentUser;
        if (!user?.id) return null;
        return {
            ...user,
            profileImage: resolveUserProfileImageUrl(user.profileImage),
        };
    } catch {
        return null;
    }
}

// Save authentication data
export function saveAuthData(token: string, user: CurrentUser): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

    const expiresAt = decodeJwtExpiry(token);
    if (expiresAt) {
        localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(expiresAt));
    } else {
        localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    }
}

// Clear authentication data
export function clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    localStorage.removeItem(AUTH_PHONE_NUMBER_KEY);
    localStorage.removeItem('isLoggedIn');
}

export {
    clearAllClientAuthState,
    clearAuthCookiesClient,
    consumeLogoutPending,
    isLogoutPending,
    markLogoutPending,
} from '@/lib/auth/logout-client';

// Get auth token
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    if (isStoredAuthExpired()) {
        clearAuthData();
        return null;
    }
    return localStorage.getItem(AUTH_TOKEN_KEY);
}