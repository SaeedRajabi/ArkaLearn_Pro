import type { RoleName } from './types';

/** Only administrators may access the AdminDashboard application. */
export function isAdminDashboardRole(roleName: RoleName): boolean {
  return roleName === 'admin';
}

/** @deprecated Professors use the ClientWebSite portal, not AdminDashboard. */
export function isProfessorDashboardRole(_roleName: RoleName): boolean {
  return false;
}

/** @deprecated Use isAdminDashboardRole — AdminDashboard is admin-only. */
export function isDashboardStaffRole(roleName: RoleName): boolean {
  return isAdminDashboardRole(roleName);
}
