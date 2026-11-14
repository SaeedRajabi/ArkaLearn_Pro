'use client';

import React from 'react';
import { useAuth } from './auth-provider';
import type { PermissionId } from '@/lib/auth/permissions';
import type { RoleName } from '@/lib/auth/types';

type RoleGuardProps = {
  children: React.ReactNode;
  /** حداقل یکی از این نقش‌ها لازم است */
  roles?: RoleName[];
  /** یا این دسترسی لازم است */
  permission?: PermissionId;
  fallback?: React.ReactNode;
};

/**
 * برای مخفی/نمایش بخشی از UI بر اساس نقش یا دسترسی.
 * اگر شرط برقرار نبود fallback یا null رندر می‌شود.
 */
export function RoleGuard({ children, roles, permission, fallback = null }: RoleGuardProps) {
  const { authUser, hasPermission } = useAuth();

  if (!authUser) return <>{fallback}</>;

  if (roles?.length && !roles.includes(authUser.roleName)) return <>{fallback}</>;
  if (permission && !hasPermission(permission)) return <>{fallback}</>;

  return <>{children}</>;
}
