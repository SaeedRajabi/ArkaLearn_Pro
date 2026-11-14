'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  Context,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useAuthStore } from '@/stores/auth-store';
import * as authApi from '@/lib/auth/api';
import type { AuthUser, RoleName } from '@/lib/auth/types';
import {
  getSessionHint,
  setSessionHint,
  clearSessionHint,
  hintToAuthUser,
  SessionHint
} from '@/lib/auth/session-storage';
import {
  hasPermission,
  hasRoleAtLeast,
  getPermissionForPath,
  type PermissionId,
} from '@/lib/auth/permissions';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { isAdminDashboardRole } from '@/lib/auth/dashboard-access';
import { loginPathWithRedirect } from '@/lib/auth/routes';
import { resetLoginRedirectGuard } from '@/lib/auth/session-expired';
import { registerNavigateToLogin } from '@/lib/auth/auth-navigation';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';
import {
  clearAllClientAuthState,
  clearAuthCookiesClient,
  clearForceRelogin,
  consumeLogoutPending,
  expireClientSession,
  markLogoutPending,
} from '@/lib/auth/logout-client';

function isDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

function isRoomPath(pathname: string): boolean {
  return pathname === '/room' || pathname.startsWith('/room/');
}

type AuthContextValue = {
  user: User | null;
  authUser: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  /** Confirmed by API (`/User/get-user` or login), not from session hint alone. */
  sessionVerified: boolean;
  /**
   * Password login. May return captcha/2FA challenges instead of completing the session.
   * Pass captcha fields when retrying after puzzle verification.
   */
  login: (
    credentials: {
      userNameOrEmail: string;
      password: string;
      captchaId?: string;
      captchaSlidePercent?: number;
    },
    redirectTo?: string | false
  ) => Promise<import('@/lib/auth/types').LoginAttemptResult>;
  confirmTwoFactor: (
    body: { twoFactorSessionId: string; otpCode: string },
    redirectTo?: string | false
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  hasRole: (role: RoleName) => boolean;
  hasPermission: (permission: PermissionId) => boolean;
  canAccessPath: (pathname: string) => boolean;
};

const AuthContext:Context<AuthContextValue | undefined> = createContext<AuthContextValue | undefined>(undefined);

function authUserToUser(a: AuthUser): User {
  let role: User['role'] = 'User';
  if (a.roleName === 'admin') role = 'Admin';
  if (a.roleName === 'teacher') role = 'User';
  if (a.roleName === 'student') role = 'User';
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    role,
    status: a.status === 'ACTIVE' ? 'Active' : 'Blocked',
    avatarUrl: resolveUserAvatarUrl(a.avatarUrl),
    initials: a.initials,
    registrationDate: a.registrationDate,
    lastLogin: a.lastLogin,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router: AppRouterInstance = useRouter();
  const sessionCheckRef = useRef(0);
  const {
    user: authUser,
    loading,
    initialized,
    sessionVerified,
    setUser,
    setLoading,
    setInitialized,
    setSessionVerified,
    clearSession,
  } = useAuthStore();

  useEffect(() => {
    registerNavigateToLogin((redirectPath) => {
      router.replace(loginPathWithRedirect(redirectPath ?? window.location.pathname));
    });
    return () => registerNavigateToLogin(null);
  }, [router]);

  useEffect(():(() =>void) | undefined => {
    let cancelled:boolean = false;
    if (initialized) return;

    const checkId = ++sessionCheckRef.current;

    if (typeof window !== 'undefined' && consumeLogoutPending()) {
      clearAllClientAuthState();
      setUser(null);
      setSessionVerified(false);
      setLoading(false);
      setInitialized(true);
      return;
    }

    const verifySession = async (): Promise<'ok' | '401' | 'uncertain'> => {
      try {
        let user = await authApi.getCurrentUser();
        if (!user) {
          await new Promise((r) => setTimeout(r, 400));
          if (!cancelled) user = await authApi.getCurrentUser();
        }
        if (cancelled || checkId !== sessionCheckRef.current) return 'uncertain';
        if (user) {
          if (!isAdminDashboardRole(user.roleName)) {
            try {
              await authApi.logout();
            } catch {
              /* ignore */
            }
            clearSessionHint();
            if (!cancelled && checkId === sessionCheckRef.current) setUser(null);
            if (
              typeof window !== 'undefined' &&
              checkId === sessionCheckRef.current &&
              isDashboardPath(window.location.pathname)
            ) {
              router.replace(loginPathWithRedirect(window.location.pathname));
            }
            return '401';
          }
          setUser(user);
          setSessionHint(user);
          return 'ok';
        }
        return 'uncertain';
      } catch (e: unknown) {
        if ((e as { response?: { status?: number } })?.response?.status === 401) {
          return '401';
        }
        return 'uncertain';
      }
    };

    const applyHintVerifyResult = (status: 'ok' | '401' | 'uncertain') => {
      if (cancelled || checkId !== sessionCheckRef.current) return;
      setSessionVerified(status === 'ok');
      if (status !== 'ok') {
        expireClientSession();
        if (typeof window !== 'undefined' && isDashboardPath(window.location.pathname)) {
          router.replace(loginPathWithRedirect(window.location.pathname));
        }
      }
    };

    const applyColdVerifyResult = (status: 'ok' | '401' | 'uncertain') => {
      if (cancelled || checkId !== sessionCheckRef.current) return;
      setSessionVerified(status === 'ok');
      if (status === '401' || status === 'uncertain') {
        expireClientSession();
      }
    };

    const hint:SessionHint | null = getSessionHint();
    const onRoomPage =
      typeof window !== 'undefined' && isRoomPath(window.location.pathname);

    if (onRoomPage && !hint) {
      setSessionVerified(false);
      setLoading(false);
      setInitialized(true);
      return ():void => { cancelled = true; };
    }

    if (hint) {
      setSessionVerified(false);
      setUser(hintToAuthUser(hint));
      setLoading(true);
      verifySession()
        .then((status) => applyHintVerifyResult(status))
        .finally(():void => {
          if (cancelled) return;
          if (checkId === sessionCheckRef.current) {
            setLoading(false);
            setInitialized(true);
          } else {
            setLoading(false);
          }
        });
      return ():void => { cancelled = true; };
    }

    setSessionVerified(false);
    setLoading(true);

    if (onRoomPage) {
      setLoading(false);
      setInitialized(true);
      return ():void => { cancelled = true; };
    }

    verifySession()
      .then((status) => applyColdVerifyResult(status))
      .finally(():void => {
        if (cancelled) return;
        if (checkId === sessionCheckRef.current) {
          setLoading(false);
          setInitialized(true);
        } else {
          setLoading(false);
        }
      });
    return ():void => { cancelled = true; };
  }, [setUser, setLoading, setInitialized, setSessionVerified, router]);

  const establishAuthenticatedSession = useCallback(
    async (
      user: AuthUser,
      loginCheckId: number,
      redirectTo: string | false
    ): Promise<void> => {
      if (!isAdminDashboardRole(user.roleName)) {
        try {
          await authApi.logout();
        } catch {
          /* ignore */
        }
        clearSessionHint();
        setUser(null);
        setSessionVerified(false);
        throw new Error('DASHBOARD_ADMIN_ONLY');
      }
      resetLoginRedirectGuard();
      clearForceRelogin();
      setLoading(false);
      if (!initialized) setInitialized(true);
      setUser(user);
      setSessionVerified(true);
      setSessionHint(user);
      try {
        const refreshed = await authApi.getCurrentUser();
        if (loginCheckId !== sessionCheckRef.current) return;
        if (refreshed) {
          setUser(refreshed);
          setSessionHint(refreshed);
        }
      } catch {
        /* keep login payload user */
      }
      if (redirectTo !== false) {
        router.replace(redirectTo);
      }
    },
    [setUser, setLoading, setInitialized, setSessionVerified, router, initialized]
  );

  const login = useCallback(
    async (
      credentials: {
        userNameOrEmail: string;
        password: string;
        captchaId?: string;
        captchaSlidePercent?: number;
      },
      redirectTo: string | false = '/dashboard'
    ): Promise<import('@/lib/auth/types').LoginAttemptResult> => {
      const loginCheckId = ++sessionCheckRef.current;
      try {
        const result = await authApi.login(credentials);
        if (loginCheckId !== sessionCheckRef.current) return result;

        if (result.kind === 'authenticated') {
          await establishAuthenticatedSession(result.user, loginCheckId, redirectTo);
        }
        return result;
      } catch (e) {
        if (loginCheckId === sessionCheckRef.current) {
          setUser(null);
          setSessionVerified(false);
          clearSessionHint();
        }
        throw e;
      }
    },
    [establishAuthenticatedSession, setUser, setSessionVerified]
  );

  const confirmTwoFactor = useCallback(
    async (
      body: { twoFactorSessionId: string; otpCode: string },
      redirectTo: string | false = '/dashboard'
    ): Promise<void> => {
      const loginCheckId = ++sessionCheckRef.current;
      try {
        const result = await authApi.confirmLoginTwoFactor(body);
        if (loginCheckId !== sessionCheckRef.current) return;
        if (result.kind !== 'authenticated') {
          throw new Error('Two-factor confirmation failed.');
        }
        await establishAuthenticatedSession(result.user, loginCheckId, redirectTo);
      } catch (e) {
        if (loginCheckId === sessionCheckRef.current) {
          setUser(null);
          setSessionVerified(false);
          clearSessionHint();
        }
        throw e;
      }
    },
    [establishAuthenticatedSession, setUser, setSessionVerified]
  );

  const logout: () => Promise<void> = useCallback(async (): Promise<void> => {
    ++sessionCheckRef.current;
    markLogoutPending();
    clearAllClientAuthState();
    clearSession();
    resetLoginRedirectGuard();
    router.replace('/');
    try {
      await authApi.logout();
    } catch {
      /* still clear client state */
    } finally {
      clearAuthCookiesClient();
    }
  }, [clearSession, router]);

  const refreshUser:() => Promise<AuthUser | null> = useCallback(async ():Promise<AuthUser | null> => {
    try {
      const nextUser:AuthUser | null = await authApi.getCurrentUser();
      if (nextUser && !isAdminDashboardRole(nextUser.roleName)) {
        try {
          await authApi.logout();
        } catch {
          /* ignore */
        }
        clearSessionHint();
        setUser(null);
        setSessionVerified(false);
        return null;
      }
      setUser(nextUser);
      setSessionVerified(!!nextUser);
      if (nextUser) setSessionHint(nextUser);
      return nextUser;
    } catch (e: unknown) {
      if ((e as { response?: { status?: number } })?.response?.status === 401) {
        expireClientSession();
      }
      return null;
    }
  }, [setUser, setSessionVerified]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!useAuthStore.getState().initialized || !useAuthStore.getState().sessionVerified) return;
      if (typeof window === 'undefined' || !isDashboardPath(window.location.pathname)) return;

      void (async () => {
        try {
          const nextUser = await authApi.getCurrentUser();
          if (nextUser && !isAdminDashboardRole(nextUser.roleName)) {
            try {
              await authApi.logout();
            } catch {
              /* ignore */
            }
            clearSessionHint();
            setUser(null);
            setSessionVerified(false);
            router.replace(loginPathWithRedirect(window.location.pathname));
            return;
          }
          if (nextUser) {
            setUser(nextUser);
            setSessionHint(nextUser);
            setSessionVerified(true);
          }
        } catch (e: unknown) {
          if ((e as { response?: { status?: number } })?.response?.status === 401) {
            expireClientSession();
            router.replace(loginPathWithRedirect(window.location.pathname));
          }
        }
      })();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [router, setUser, setSessionVerified]);

  const hasRole:(role:RoleName) => boolean = useCallback(
    (role: RoleName):boolean => (authUser ? hasRoleAtLeast(authUser.roleName, role) : false),
    [authUser]
  );

  const hasPermissionCheck:(permission:PermissionId) => boolean = useCallback(
    (permission: PermissionId):boolean => (authUser ? hasPermission(authUser.roleName, permission) : false),
    [authUser]
  );

  const canAccessPath:(pathname:string) => boolean = useCallback(
    (pathname: string):boolean => {
      if (!authUser) return false;
      const perm:PermissionId | null = getPermissionForPath(pathname);
      if (!perm) return true;
      return hasPermission(authUser.roleName, perm);
    },
    [authUser]
  );

  const user: User | null = authUser ? authUserToUser(authUser) : null;

  const value:AuthContextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      authUser,
      loading,
      initialized,
      sessionVerified,
      login,
      confirmTwoFactor,
      logout,
      refreshUser,
      hasRole,
      hasPermission: hasPermissionCheck,
      canAccessPath,
    }),
    [
      user,
      authUser,
      loading,
      initialized,
      sessionVerified,
      login,
      confirmTwoFactor,
      logout,
      refreshUser,
      hasRole,
      hasPermissionCheck,
      canAccessPath,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx:AuthContextValue | undefined = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
