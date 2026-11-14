/**
 * Authentication API helpers.
 * Uses cookie-based auth and normalizes inconsistent backend payload shapes.
 */

import apiClient from '@/lib/apiClient';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';
import type { AuthUser, LoginAttemptResult, LoginResponse } from './types';
import { Role, roleIdToName, type RoleId } from './types';
import type { AxiosResponse } from 'axios';

const AUTH_BASE = '/Account';
const USER_BASE = '/User';

/** Unwrap common API envelopes and ReferenceHandler noise so get-user parses reliably after refresh. */
function unwrapUserPayload(payload: unknown): Record<string, unknown> {
  if (payload == null || payload === '') return {};
  if (typeof payload !== 'object' || Array.isArray(payload)) return {};

  let cur: Record<string, unknown> = payload as Record<string, unknown>;
  for (let depth = 0; depth < 4; depth++) {
    const next =
      (cur.data && typeof cur.data === 'object' && !Array.isArray(cur.data) ? (cur.data as Record<string, unknown>) : null) ??
      (cur.Data && typeof cur.Data === 'object' && !Array.isArray(cur.Data) ? (cur.Data as Record<string, unknown>) : null) ??
      (cur.result && typeof cur.result === 'object' && !Array.isArray(cur.result) ? (cur.result as Record<string, unknown>) : null) ??
      (cur.Result && typeof cur.Result === 'object' && !Array.isArray(cur.Result) ? (cur.Result as Record<string, unknown>) : null);
    if (!next || next === cur) break;
    cur = next;
  }
  return cur;
}

function boolFrom(raw: unknown): boolean {
  return raw === true || raw === 'true' || raw === 1 || raw === '1';
}

function mapAuthUser(payload: Record<string, unknown>): AuthUser {
  const id = readKnownString(payload, ['id', 'Id']);
  const userName = readKnownString(payload, ['userName', 'UserName']);
  const name = readKnownString(payload, ['name', 'Name', 'fullName', 'FullName']) || userName;
  const email = parseEmail(readKnownValue(payload, ['email', 'Email']));
  const roleId = parseRole(readKnownValue(payload, ['role', 'Role', 'roleName', 'RoleName', 'userRole', 'UserRole']));
  const status = parseStatus(readKnownValue(payload, ['status', 'Status']));
  const avatarUrl = readKnownString(payload, ['avatarUrl', 'AvatarUrl', 'profileImage', 'ProfileImage']);
  const lastLogin = parseDate(readKnownValue(payload, ['lastLogin', 'LastLogin']));

  return {
    id,
    userName,
    name,
    email,
    roleId,
    roleName: roleIdToName(roleId),
    status,
    avatarUrl: normalizeAvatarUrl(avatarUrl),
    initials: (name || userName || '?').slice(0, 2).toUpperCase(),
    registrationDate: new Date(),
    lastLogin,
    phoneNumber: readKnownString(payload, ['phoneNumber', 'PhoneNumber']) || null,
    phoneNumberVerified: boolFrom(payload.phoneNumberVerified ?? payload.PhoneNumberVerified),
    emailVerified: boolFrom(payload.emailVerified ?? payload.EmailVerified),
    twoFactorEnabled: boolFrom(payload.twoFactorEnabled ?? payload.TwoFactorEnabled),
  };
}

function parseLoginAttempt(raw: unknown): LoginAttemptResult {
  const root = unwrapUserPayload(raw);
  const requiresCaptcha = boolFrom(root.requiresCaptcha ?? root.RequiresCaptcha);
  if (requiresCaptcha) {
    return {
      kind: 'captcha',
      captchaId: readKnownString(root, ['captchaId', 'CaptchaId']),
      targetPercent: Number(root.targetPercent ?? root.TargetPercent ?? 50) || 50,
      tolerancePercent: Number(root.tolerancePercent ?? root.TolerancePercent ?? 4) || 4,
      loginFailed: boolFrom(root.loginFailed ?? root.LoginFailed),
      message: readKnownString(root, ['message', 'Message']) || undefined,
    };
  }

  const requiresTwoFactor = boolFrom(root.requiresTwoFactor ?? root.RequiresTwoFactor);
  if (requiresTwoFactor) {
    const channel = readKnownString(root, ['channel', 'Channel']) || 'sms';
    const maskedDestination =
      readKnownString(root, ['maskedDestination', 'MaskedDestination']) ||
      readKnownString(root, ['maskedPhone', 'MaskedPhone']) ||
      readKnownString(root, ['maskedEmail', 'MaskedEmail']);
    return {
      kind: 'twoFactor',
      twoFactorSessionId: readKnownString(root, ['twoFactorSessionId', 'TwoFactorSessionId']),
      channel,
      maskedDestination,
      resendCooldownSeconds: Number(root.resendCooldownSeconds ?? root.ResendCooldownSeconds ?? 120) || 120,
      expiresInSeconds: Number(root.expiresInSeconds ?? root.ExpiresInSeconds ?? 600) || 600,
    };
  }

  if (boolFrom(root.loginFailed ?? root.LoginFailed)) {
    throw new Error(readKnownString(root, ['message', 'Message']) || 'Invalid credentials');
  }

  const userLayer =
    (root.userData && typeof root.userData === 'object'
      ? (root.userData as Record<string, unknown>)
      : null) ??
    (root.UserData && typeof root.UserData === 'object'
      ? (root.UserData as Record<string, unknown>)
      : null) ??
    root;

  const id = readKnownString(userLayer, ['id', 'Id']);
  if (!id) throw new Error('Invalid login response');

  const user = mapAuthUser(userLayer);
  const token =
    readKnownString(root, ['token', 'Token']) || readKnownString(userLayer, ['token', 'Token']);
  return { kind: 'authenticated', user, token: token || undefined };
}

/** Get current user from cookie/session */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await apiClient.get<unknown>(`${USER_BASE}/get-user`, {
    timeout: 10_000,
    validateStatus: (status) => status === 200 || status === 204 || status === 401,
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized') as Error & { response: typeof res };
    err.response = res;
    throw err;
  }

  if (res.status === 204 || res.data == null || res.data === '') {
    return null;
  }

  const raw = unwrapUserPayload(res.data);
  const id = readKnownString(raw, ['id', 'Id']);
  const userName = readKnownString(raw, ['userName', 'UserName']);
  if (!id && !userName) return null;
  return mapAuthUser(raw);
}

export async function login(credentials: {
  userNameOrEmail: string;
  password: string;
  captchaId?: string;
  captchaSlidePercent?: number;
}): Promise<LoginAttemptResult> {
  const body: Record<string, unknown> = {
    userNameOrEmail: credentials.userNameOrEmail,
    password: credentials.password,
    clientApp: 'AdminDashboard',
    ClientApp: 'AdminDashboard',
  };
  if (credentials.captchaId) body.captchaId = credentials.captchaId;
  if (credentials.captchaSlidePercent != null) body.captchaSlidePercent = credentials.captchaSlidePercent;

  const res: AxiosResponse<LoginResponse> = await apiClient.post(`${AUTH_BASE}/Login`, body);
  return parseLoginAttempt(res.data);
}

export async function fetchLoginCaptchaChallenge(): Promise<{
  captchaId: string;
  targetPercent: number;
  tolerancePercent: number;
}> {
  const res = await apiClient.get<unknown>(`${AUTH_BASE}/LoginCaptcha/Challenge`);
  const row = unwrapUserPayload(res.data);
  return {
    captchaId: readKnownString(row, ['captchaId', 'CaptchaId']),
    targetPercent: Number(row.targetPercent ?? row.TargetPercent ?? 50) || 50,
    tolerancePercent: Number(row.tolerancePercent ?? row.TolerancePercent ?? 4) || 4,
  };
}

export async function confirmLoginTwoFactor(body: {
  twoFactorSessionId: string;
  otpCode: string;
}): Promise<LoginAttemptResult> {
  const res = await apiClient.post(`${AUTH_BASE}/LoginTwoFactor/Confirm`, {
    twoFactorSessionId: body.twoFactorSessionId,
    otpCode: body.otpCode,
  });
  return parseLoginAttempt(res.data);
}

export async function resendLoginTwoFactor(twoFactorSessionId: string): Promise<LoginAttemptResult> {
  const res = await apiClient.post(`${AUTH_BASE}/LoginTwoFactor/Resend`, {
    twoFactorSessionId,
  });
  return parseLoginAttempt(res.data);
}

export async function setTwoFactorEnabled(enabled: boolean): Promise<void> {
  await apiClient.post(`${USER_BASE}/SetTwoFactorEnabled`, { enabled });
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  try {
    await apiClient.post(`${USER_BASE}/ChangePassword`, {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      CurrentPassword: input.currentPassword,
      NewPassword: input.newPassword,
    });
  } catch (error) {
    const { getApiErrorMessage } = await import('@/lib/api-command-result');
    throw new Error(getApiErrorMessage(error, 'Could not change password.'));
  }
}

function parseRole(role: unknown): RoleId {
  if (typeof role === 'number') {
    if (role === Role.ADMIN || role === Role.TEACHER || role === Role.STUDENT || role === Role.USER) {
      return role as RoleId;
    }
    return Role.USER;
  }

  const normalized = String(role ?? '').trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'administrator' || normalized === '3') return Role.ADMIN;
  if (normalized === 'teacher' || normalized === '2') return Role.TEACHER;
  if (normalized === 'student' || normalized === '1') return Role.STUDENT;
  if (normalized === 'user' || normalized === '0') return Role.USER;
  return Role.USER;
}

function parseStatus(status: unknown): AuthUser['status'] {
  if (typeof status === 'number') return status === 1 ? 'ACTIVE' : 'BLOCKED';

  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === '') return 'ACTIVE';
  if (normalized === '1' || normalized === 'active' || normalized === 'enabled' || normalized === 'true') return 'ACTIVE';
  if (normalized === '0' || normalized === '2' || normalized === 'blocked' || normalized === 'inactive' || normalized === 'disabled' || normalized === 'false') return 'BLOCKED';
  return 'ACTIVE';
}

function parseEmail(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const emailObj = value as Record<string, unknown>;
    const nested = emailObj.value ?? emailObj.Value;
    if (typeof nested === 'string') return nested;
  }
  return '';
}

function parseDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function readKnownValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function readKnownString(source: Record<string, unknown>, keys: string[]): string {
  const value = readKnownValue(source, keys);
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function normalizeAvatarUrl(value?: string | null): string {
  return resolveUserAvatarUrl(value);
}

export async function updateCurrentUserFullName(input: {
  userId: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  await apiClient.post(`${USER_BASE}/UpdateUserFN`, {
    userId: input.userId,
    firstName: input.firstName,
    lastName: input.lastName,
  });
}

export async function uploadCurrentUserProfileImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('profileImage', file);

  const { data } = await apiClient.post(`${USER_BASE}/UploadProfileImage`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const payload = unwrapUserPayload(data);
  const imageUrl = readKnownString(payload, ['imageUrl', 'ImageUrl', 'profileImage', 'ProfileImage']);
  return normalizeAvatarUrl(imageUrl);
}

/** Logout and clear server cookie */
export async function logout(): Promise<void> {
  try {
    await apiClient.post(`${AUTH_BASE}/Logout`, {});
  } catch {
    /* Client state is still cleared by AuthProvider on logout. */
  }
}
