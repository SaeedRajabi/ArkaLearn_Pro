'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './auth-provider';
import { getPermissionForPath, Permission } from '@/lib/auth/permissions';
import { isAdminDashboardRole } from '@/lib/auth/dashboard-access';
import { expireSessionAndRedirectToLogin } from '@/lib/auth/session-expired';
import { isLogoutPending } from '@/lib/auth/logout-client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { AppBootstrapLoading } from '@/components/app-bootstrap-loading';

type AuthGuardProps = {
  children: React.ReactNode;
  /** If set, only these roles may access the route tree. */
  allowedRoles?: Array<'admin' | 'teacher' | 'student' | 'user'>;
  /** If set, this permission is required; otherwise inferred from the path. */
  requiredPermission?: string;
};

export function AuthGuard({ children, allowedRoles, requiredPermission }: AuthGuardProps) {
  const { authUser, loading, initialized, sessionVerified, hasPermission, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { t } = useLanguage();
  const denyToastKeyRef = useRef<string | null>(null);

  const isStaff = authUser != null && isAdminDashboardRole(authUser.roleName);
  const isAuthed = initialized && !loading && sessionVerified && isStaff;

  useEffect(() => {
    if (!initialized || loading) return;

    if (!isAuthed) {
      if (!isLogoutPending()) {
        expireSessionAndRedirectToLogin(pathname);
      }
      return;
    }

    if (allowedRoles?.length && authUser && !allowedRoles.includes(authUser.roleName)) {
      const key = `${pathname ?? ''}|role`;
      if (denyToastKeyRef.current !== key) {
        denyToastKeyRef.current = key;
        toast({
          variant: 'destructive',
          title: t('auth_access_denied_title'),
          description: t('auth_access_denied_description'),
        });
      }
      void logout();
      return;
    }

    const permission = requiredPermission ?? getPermissionForPath(pathname ?? '');
    if (permission && !hasPermission(permission as Parameters<typeof hasPermission>[0])) {
      const key = `${pathname ?? ''}|perm`;
      if (denyToastKeyRef.current !== key) {
        denyToastKeyRef.current = key;
        toast({
          variant: 'destructive',
          title: t('auth_access_denied_title'),
          description: t('auth_access_denied_description'),
        });
      }
      if (!hasPermission(Permission.DASHBOARD_VIEW)) {
        void logout();
      } else {
        router.push('/dashboard');
      }
      return;
    }

    denyToastKeyRef.current = null;
  }, [
    initialized,
    loading,
    isAuthed,
    authUser,
    pathname,
    router,
    allowedRoles,
    requiredPermission,
    hasPermission,
    toast,
    t,
    logout,
  ]);

  if (!initialized || loading || !isAuthed) {
    return <AppBootstrapLoading />;
  }

  if (allowedRoles?.length && authUser && !allowedRoles.includes(authUser.roleName)) {
    return null;
  }

  return <>{children}</>;
}
