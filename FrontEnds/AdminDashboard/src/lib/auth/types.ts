/**
 * انواع و نقش‌های احراز هویت — هم‌تراز با بک‌اند UserRole
 */
export const Role = {
  USER: 0,
  STUDENT: 1,
  TEACHER: 2,
  ADMIN: 3,
} as const;

export type RoleId = (typeof Role)[keyof typeof Role];

export type RoleName = 'admin' | 'teacher' | 'student' | 'user';

/** نقش عددی سرور را به نام نقش تبدیل می‌کند */
export function roleIdToName(roleId: number): RoleName {
  switch (roleId) {
    case Role.ADMIN:
      return 'admin';
    case Role.TEACHER:
      return 'teacher';
    case Role.STUDENT:
      return 'student';
    case Role.USER:
      return 'user';
    default:
      return 'user';
  }
}

/** کاربر احراز هویت شده — منبع واحد در کل اپ */
export interface AuthUser {
  id: string;
  userName: string;
  name: string;
  email: string;
  roleId: RoleId;
  roleName: RoleName;
  status: 'ACTIVE' | 'BLOCKED';
  avatarUrl?: string | null;
  initials: string;
  registrationDate: Date;
  lastLogin: Date;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

/** پاسخ API get-user (کوکی) */
export interface GetUserByCookieResponse {
  id?: string;
  userName?: string;
  fullName?: string;
  role?: string | number;
  email?: string;
  profileImage?: string | null;
}

/** پاسخ API Login */
export interface LoginResponse {
  userData?: LoginUserData;
  token?: string;
  requiresTwoFactor?: boolean;
  twoFactorSessionId?: string;
  channel?: 'sms' | 'email' | string;
  maskedPhone?: string;
  maskedEmail?: string;
  maskedDestination?: string;
  resendCooldownSeconds?: number;
  expiresInSeconds?: number;
  requiresCaptcha?: boolean;
  captchaId?: string;
  targetPercent?: number;
  tolerancePercent?: number;
  loginFailed?: boolean;
  message?: string;
  code?: string;
}

export interface LoginUserData {
  id?: string | number;
  userName?: string;
  name?: string;
  email?: string | { value?: string } | { Value?: string };
  role?: number | string;
  status?: number | string;
  avatarUrl?: string | null;
  token?: string;
  lastLogin?: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
}

export type LoginAttemptResult =
  | { kind: 'authenticated'; user: AuthUser; token?: string }
  | {
      kind: 'twoFactor';
      twoFactorSessionId: string;
      channel: string;
      maskedDestination: string;
      resendCooldownSeconds: number;
      expiresInSeconds: number;
    }
  | {
      kind: 'captcha';
      captchaId: string;
      targetPercent: number;
      tolerancePercent: number;
      loginFailed?: boolean;
      message?: string;
    };
