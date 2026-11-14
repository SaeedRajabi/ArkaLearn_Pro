/**
 * سطح دسترسی (Permission) و نقش‌ها — برای محافظت از روت و UI
 */

import type { RoleName } from './types';

/** دسترسی‌های قابل استفاده در اپ */
export const Permission = {
  DASHBOARD_VIEW: 'dashboard:view',
  USERS_VIEW: 'users:view',
  USERS_EDIT: 'users:edit',
  COURSES_VIEW: 'courses:view',
  COURSES_EDIT: 'courses:edit',
  ARTICLES_VIEW: 'articles:view',
  ARTICLES_EDIT: 'articles:edit',
  SEMINARS_VIEW: 'seminars:view',
  SEMINARS_EDIT: 'seminars:edit',
  ROOMS_VIEW: 'rooms:view',
  ROOMS_EDIT: 'rooms:edit',
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
} as const;

export type PermissionId = (typeof Permission)[keyof typeof Permission];

/** نقش → دسترسی‌های مجاز */
const rolePermissions: Record<RoleName, PermissionId[]> = {
  admin: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.USERS_EDIT,
    Permission.COURSES_VIEW,
    Permission.COURSES_EDIT,
    Permission.ARTICLES_VIEW,
    Permission.ARTICLES_EDIT,
    Permission.SEMINARS_VIEW,
    Permission.SEMINARS_EDIT,
    Permission.ROOMS_VIEW,
    Permission.ROOMS_EDIT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],
  teacher: [],
  /** Learner accounts: no dashboard app access (use live room login only). */
  student: [],
  user: [],
};

/** آیا این نقش به این دسترسی مجاز است؟ */
export function hasPermission(roleName: RoleName, permission: PermissionId): boolean {
  const list = rolePermissions[roleName];
  if (!list || list.length === 0) return false;
  return list.includes(permission);
}

/** آیا نقش اول برابر یا بالاتر از نقش دوم است؟ (برای مقایسه سلسله‌مراتب) */
const roleOrder: Record<RoleName, number> = {
  admin: 3,
  teacher: 2,
  student: 1,
  user: 0,
};

export function hasRoleAtLeast(userRole: RoleName, required: RoleName): boolean {
  return (roleOrder[userRole] ?? 0) >= (roleOrder[required] ?? 0);
}

/** نقش‌های مجاز برای هر مسیر داشبورد (اختیاری؛ اگر نباشد فقط لاگین چک می‌شود) */
export const routePermissions: Record<string, PermissionId | null> = {
  '/dashboard': Permission.DASHBOARD_VIEW,
  '/dashboard/teacher-approvals': Permission.USERS_VIEW,
  '/dashboard/courses': Permission.COURSES_VIEW,
  '/dashboard/courses/categories': Permission.COURSES_VIEW,
  '/dashboard/categories': Permission.COURSES_VIEW,
  '/dashboard/articles': Permission.ARTICLES_VIEW,
  '/dashboard/articles/comments': Permission.ARTICLES_EDIT,
  '/dashboard/seminars': Permission.SEMINARS_VIEW,
  '/dashboard/seminar-students': Permission.SEMINARS_VIEW,
  '/dashboard/rooms': Permission.ROOMS_VIEW,
  '/dashboard/students': Permission.DASHBOARD_VIEW,
  '/dashboard/settings': Permission.SETTINGS_VIEW,
};

export function getPermissionForPath(pathname: string): PermissionId | null {
  const normalized = (pathname?.replace(/\/$/, '') || '/dashboard').toLowerCase();
  if (routePermissions[normalized] != null) return routePermissions[normalized];
  const sorted = Object.keys(routePermissions).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (normalized === route || normalized.startsWith(route + '/')) return routePermissions[route];
  }
  return null;
}
