'use client';

import React, {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { CurrentUser, LoginRequest, LoginResponse } from '@/lib/api/account';
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  confirmLoginTwoFactor as apiConfirmLoginTwoFactor,
  userFromLoginUserData,
} from '@/lib/api/account';
import { ApiError } from '@/lib/api/client';
import { resolveLoginErrorMessage } from '@/lib/auth/login-error-messages';
import { AccountBlockedError } from '@/lib/auth/account-blocked';
import {
  hasIntentionalLogout,
  markIntentionalLogout,
} from '@/lib/auth/logout-intent';
import { isProtectedPath, shouldRedirectHomeOnLogout } from '@/lib/auth/protected-routes';
import { buildLoginRedirectUrl, isAuthEntryPath } from '@/lib/auth/session-expired';
import { installFetchSessionHandler } from '@/lib/auth/install-fetch-session-handler';
import { postLogoutNavigate } from '@/lib/auth/post-auth-navigate';
import { getDefaultDashboardPath } from '@/lib/auth/roles';
import {
  clearAuthData,
  saveAuthData,
  getStoredUser,
  isStoredAuthExpired,
  onUnauthorized,
  clearAllClientAuthState,
  clearAuthCookiesClient,
  markLogoutPending,
  consumeLogoutPending,
  isLogoutPending,
} from '@/lib/auth';

interface AuthState {
  user: CurrentUser | null;
  isLoading: boolean; // لودینگ اولیه (آیا هنوز داریم چک می‌کنیم؟)
  isValidating: boolean; // لودینگ پس‌زمینه (آیا داریم با سرور چک می‌کنیم؟)
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (body: LoginRequest) => Promise<LoginResponse>;
  confirmLoginTwoFactor: (body: { twoFactorSessionId: string; otpCode: string }) => Promise<LoginResponse>;
  setSessionFromUserData: (data: Record<string, unknown> | null | undefined) => boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasBootstrappedRef = useRef(false);
  const userRef = useRef<CurrentUser | null>(null);
  const skipValidationUntilRef = useRef(0);
  /** Clear client auth only after soft-nav leaves the protected shell (avoids empty main). */
  const pendingLogoutClearRef = useRef(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback((next: CurrentUser | null) => {
    userRef.current = next;
    setUser(next);
  }, []);

  const redirectToLoginAfterSessionExpired = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (hasIntentionalLogout()) return;

    const { pathname, search } = window.location;
    if (isAuthEntryPath(pathname)) return;
    // Public pages must stay reachable after silent logout / expired cookies.
    if (!isProtectedPath(pathname)) return;

    router.replace(buildLoginRedirectUrl(pathname, search));
  }, [router]);

  // ۱. مقداردهی اولیه از LocalStorage — UI را فوراً آماده می‌کند (بدون انتظار برای شبکه)
  useEffect(() => {
    if (isStoredAuthExpired()) {
      clearAuthData();
      updateUser(null);
      setIsLoading(false);
      redirectToLoginAfterSessionExpired();
      return;
    }

    const stored = getStoredUser();
    if (stored) {
      updateUser(stored);
    }
    setIsLoading(false);
  }, [redirectToLoginAfterSessionExpired, updateUser]);

  // ۲. تابع اصلی برای همگام‌سازی با سرور
  const refetch = useCallback(async () => {
    if (Date.now() < skipValidationUntilRef.current) {
      return;
    }

    if (isLogoutPending()) {
      return;
    }

    if (isStoredAuthExpired()) {
      updateUser(null);
      clearAuthData();
      redirectToLoginAfterSessionExpired();
      setIsLoading(false);
      setIsValidating(false);
      hasBootstrappedRef.current = true;
      return;
    }

    const isInitialBootstrap = !hasBootstrappedRef.current;
    const hasCachedSession = !!(userRef.current ?? getStoredUser());
    if (isInitialBootstrap && !hasCachedSession) {
      setIsLoading(true);
    }
    // Keep existing UI stable during background rechecks; only surface validating
    // when there is no session to render yet.
    if (!hasCachedSession) {
      setIsValidating(true);
    }
    setError(null);
    try {
      const serverUser = await getCurrentUser();
      
      if (serverUser?.id) {
        // سرور کاربر را تایید کرد -> بروزرسانی State و LocalStorage
        updateUser(serverUser);
        // اینجا توکن را نداریم چون کوکی HttpOnly است، ولی آبجکت یوزر را آپدیت می‌کنیم
        // برای توکن، از هر چیزی که قبلا داشتیم استفاده می‌کنیم یا 'session'
        saveAuthData('session', serverUser); 
      } else {
        const hadUser = !!(userRef.current ?? getStoredUser());
        updateUser(null);
        clearAuthData();
        if (hadUser) {
          redirectToLoginAfterSessionExpired();
        }
      }
    } catch (err) {
      if (err instanceof AccountBlockedError) {
        updateUser(null);
        clearAuthData();
        if (typeof window !== 'undefined') {
          router.replace('/login?blocked=1');
        }
        setIsLoading(false);
        setIsValidating(false);
        hasBootstrappedRef.current = true;
        return;
      }

      // مدیریت خطاها
      if (err instanceof ApiError && err.status === 401) {
        // قطعا کوکی منقضی شده
        updateUser(null);
        clearAuthData();
        redirectToLoginAfterSessionExpired();
      } else {
        // خطای شبکه یا سرور (۵۰۰) -> لاگ‌اوت نمی‌کنیم!
        // به کاربر اجازه میدیم با دیتای کش شده کار کنه (تا حد ممکن)
        console.warn('Auth validation failed (network error), keeping local session:', err);
      }
    } finally {
      hasBootstrappedRef.current = true;
      setIsValidating(false);
      setIsLoading(false);
    }
  }, [redirectToLoginAfterSessionExpired, updateUser, router]);

  // ۳. اجرا فقط یک بار در مونت شدن (یا وقتی فوکوس برمیگرده - اختیاری)
  useEffect(() => {
    refetch().then(r => r);
  }, [refetch]);

  useEffect(() => {
    return installFetchSessionHandler();
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      updateUser(null);
      clearAuthData();
      redirectToLoginAfterSessionExpired();
    });

    return unsubscribe;
  }, [redirectToLoginAfterSessionExpired, updateUser]);

  useEffect(() => {
    const FOCUS_REFETCH_MIN_MS = 30_000;
    let lastFocusRefetchAt = 0;

    const validateSession = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastFocusRefetchAt < FOCUS_REFETCH_MIN_MS) return;
      lastFocusRefetchAt = now;
      refetch().then(() => {});
    };

    window.addEventListener('focus', validateSession);
    document.addEventListener('visibilitychange', validateSession);

    const intervalId = window.setInterval(() => {
      if (isStoredAuthExpired()) {
        updateUser(null);
        clearAuthData();
        redirectToLoginAfterSessionExpired();
        return;
      }

      refetch().then(() => {});
    }, 60_000);

    return () => {
      window.removeEventListener('focus', validateSession);
      document.removeEventListener('visibilitychange', validateSession);
      window.clearInterval(intervalId);
    };
  }, [refetch, redirectToLoginAfterSessionExpired, updateUser]);

  const setSessionFromUserData = useCallback((data: Record<string, unknown> | null | undefined): boolean => {
    const nextUser = userFromLoginUserData(data);
    if (!nextUser?.id) return false;
    consumeLogoutPending();
    pendingLogoutClearRef.current = false;
    skipValidationUntilRef.current = Date.now() + 3000;
    updateUser(nextUser);
    const token = (data?.Token ?? data?.token) != null ? String(data?.Token ?? data?.token) : 'session';
    saveAuthData(token, nextUser);
    setIsLoading(false);
    // Prefetch role home in parallel so post-login navigation is instant.
    try {
      router.prefetch(getDefaultDashboardPath(nextUser.role));
      router.prefetch('/');
    } catch {
      /* ignore */
    }
    return true;
  }, [router, updateUser]);

  const login = useCallback(
    async (body: LoginRequest): Promise<LoginResponse> => {
      setError(null);
      // Warm both dashboards while the password request is in flight.
      try {
        router.prefetch('/account');
        router.prefetch('/professor');
        router.prefetch('/');
      } catch {
        /* ignore */
      }
      try {
        const res = await apiLogin(body);
        if (res.requiresTwoFactor) {
          return res;
        }
        const data = res?.userData as Record<string, unknown> | undefined;
        const status = data?.Status ?? data?.status;
        if (status != null && String(status).trim().toUpperCase() === 'BLOCKED') {
          const msg =
            'Your account has been blocked by the system. Please contact Arka Software support to restore access.';
          setError(msg);
          throw new AccountBlockedError(msg);
        }
        if (!setSessionFromUserData(data)) {
          const msg =
            'Sign-in failed. The server did not return a valid user profile. Please try again.';
          setError(msg);
          throw new Error(msg);
        }
        return res;
      } catch (e: unknown) {
        const msg = resolveLoginErrorMessage(e, {});
        setError(msg);
        throw e;
      }
    },
    [router, setSessionFromUserData]
  );

  const confirmLoginTwoFactor = useCallback(
    async (body: { twoFactorSessionId: string; otpCode: string }): Promise<LoginResponse> => {
      setError(null);
      try {
        const res = await apiConfirmLoginTwoFactor(body);
        const data = res?.userData as Record<string, unknown> | undefined;
        if (!setSessionFromUserData(data)) {
          const msg =
            'Sign-in failed. The server did not return a valid user profile. Please try again.';
          setError(msg);
          throw new Error(msg);
        }
        return res;
      } catch (e: unknown) {
        const msg = resolveLoginErrorMessage(e, {});
        setError(msg);
        throw e;
      }
    },
    [setSessionFromUserData]
  );

  const applyClientLogoutState = useCallback(() => {
    skipValidationUntilRef.current = Date.now() + 15_000;
    updateUser(null);
    clearAllClientAuthState();
    setIsLoading(false);
    // Keep intentional-logout flag briefly so AuthGuard can freeze the shell until soft-nav finishes.
    pendingLogoutClearRef.current = false;
  }, [updateUser]);

  // After soft logout navigation leaves protected routes, clear session (header → logged out).
  useEffect(() => {
    if (!pendingLogoutClearRef.current) return;
    if (isProtectedPath(pathname)) return;
    applyClientLogoutState();
  }, [pathname, applyClientLogoutState]);

  // Warm home while sitting in dashboards so logout soft-nav is instant.
  useEffect(() => {
    if (!user) return;
    if (!isProtectedPath(pathname)) return;
    try {
      router.prefetch('/');
    } catch {
      /* ignore */
    }
  }, [user, pathname, router]);

  const logout = useCallback(async () => {
    setError(null);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    const redirectHome = shouldRedirectHomeOnLogout(currentPath);

    markLogoutPending();
    if (redirectHome) {
      markIntentionalLogout();
      pendingLogoutClearRef.current = true;
    }

    // Server logout + cookie clear run in parallel and never block the UI transition.
    const serverLogoutPromise = (async () => {
      try {
        await apiLogout();
      } catch (e) {
        console.error('Logout API failed', e);
      } finally {
        clearAuthCookiesClient();
      }
    })();

    if (redirectHome) {
      // Soft SPA nav first while user is still set → landing paints under the same Header/Footer.
      startTransition(() => {
        postLogoutNavigate(router, '/');
      });
      // Safety: if soft-nav stalls, still clear auth shortly after.
      window.setTimeout(() => {
        if (pendingLogoutClearRef.current) {
          applyClientLogoutState();
        }
      }, 2500);
      void serverLogoutPromise;
      return;
    }

    await serverLogoutPromise;
    applyClientLogoutState();
  }, [applyClientLogoutState, pathname, router]);

  const value: AuthContextValue = {
    user,
    isLoading,
    isValidating,
    isAuthenticated: !!user,
    login,
    confirmLoginTwoFactor,
    setSessionFromUserData,
    logout,
    refetch,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
