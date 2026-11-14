import { apiRequest, ApiError } from './client';
import { AccountBlockedError, isAccountBlockedApiError, isBlockedAccountStatus } from '@/lib/auth/account-blocked';
import { getDashboardHeaderImageUrl, getUserImageUrl, resolveUserProfileImageUrl } from '@/lib/utils/image-url';
import { formatIranianMobileForApi } from '@/lib/validation/registration';

const ACCOUNT_BASE = 'Account';
const USER_BASE = 'User';

// —— Login ——
export interface LoginRequest {
  userNameOrEmail: string;
  password: string;
}

export interface LoginResponseUserData {
  Token?: string;
  Id?: string;
  Name?: string;
  UserName?: string;
  Email?: string;
  TeacherId?: number | null;
  AvatarUrl?: string;
  Role?: string;
  Status?: string;
  LastLogin?: string | null;
}

export interface LoginResponse {
  userData?: LoginResponseUserData;
  requiresTwoFactor?: boolean;
  twoFactorSessionId?: string;
  maskedPhone?: string;
  resendCooldownSeconds?: number;
  expiresInSeconds?: number;
}

function boolFrom(raw: unknown): boolean {
  return raw === true || raw === 'true' || raw === 1 || raw === '1';
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const raw = await apiRequest<unknown>(`${ACCOUNT_BASE}/Login`, {
    method: 'POST',
    credentials: 'include',
    body: {
      userNameOrEmail: body.userNameOrEmail.trim(),
      password: body.password,
    },
  });
  const record = unwrapAuthPayload(raw);
  if (!record) return {};
  const requiresTwoFactor = boolFrom(record.requiresTwoFactor ?? record.RequiresTwoFactor);
  if (requiresTwoFactor) {
    return {
      requiresTwoFactor: true,
      twoFactorSessionId: String(record.twoFactorSessionId ?? record.TwoFactorSessionId ?? ''),
      maskedPhone: String(record.maskedPhone ?? record.MaskedPhone ?? ''),
      resendCooldownSeconds: Number(record.resendCooldownSeconds ?? record.ResendCooldownSeconds ?? 120),
      expiresInSeconds: Number(record.expiresInSeconds ?? record.ExpiresInSeconds ?? 600),
    };
  }
  const nestedUserData = record.userData ?? record.UserData;
  if (nestedUserData && typeof nestedUserData === 'object') {
    return { userData: nestedUserData as LoginResponseUserData };
  }
  return record as LoginResponse;
}

export interface GoogleLoginRequest {
  token: string;
  /** 1 = student, 2 = teacher — required only for new Google accounts */
  userRole?: number | null;
}

export interface GoogleLoginResponse {
  requiresAccountType?: boolean;
  email?: string;
  name?: string;
  isNewUser?: boolean;
  requiresPhoneVerification?: boolean;
  userData?: LoginResponseUserData;
  message?: string;
}

let cachedGoogleClientId: string | null | undefined;

export async function getGoogleClientId(): Promise<string> {
  if (cachedGoogleClientId) return cachedGoogleClientId;

  try {
    const raw = await apiRequest<unknown>(`${ACCOUNT_BASE}/Google-ClientId`, {
      method: 'GET',
      credentials: 'include',
    });
    const record = unwrapAuthPayload(raw) ?? (raw as Record<string, unknown> | null);
    const clientId = String(record?.clientId ?? record?.ClientId ?? '').trim();
    if (clientId) {
      cachedGoogleClientId = clientId;
      return clientId;
    }
  } catch {
    // fall through to env
  }

  const fromEnv = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  if (fromEnv) {
    cachedGoogleClientId = fromEnv;
    return fromEnv;
  }

  throw new Error('Google sign-in is not configured.');
}

export async function loginWithGoogle(body: GoogleLoginRequest): Promise<GoogleLoginResponse> {
  const raw = await apiRequest<unknown>(`${ACCOUNT_BASE}/Google-Login`, {
    method: 'POST',
    credentials: 'include',
    body: {
      token: body.token,
      userRole: body.userRole ?? null,
    },
  });
  const record = unwrapAuthPayload(raw);
  if (!record) return {};

  const requiresAccountType = boolFrom(record.requiresAccountType ?? record.RequiresAccountType);
  if (requiresAccountType) {
    return {
      requiresAccountType: true,
      email: String(record.email ?? record.Email ?? ''),
      name: String(record.name ?? record.Name ?? ''),
    };
  }

  const nestedUserData = record.userData ?? record.UserData;
  return {
    isNewUser: boolFrom(record.isNewUser ?? record.IsNewUser),
    requiresPhoneVerification: boolFrom(
      record.requiresPhoneVerification ?? record.RequiresPhoneVerification
    ),
    userData:
      nestedUserData && typeof nestedUserData === 'object'
        ? (nestedUserData as LoginResponseUserData)
        : undefined,
    message: record.message != null ? String(record.message) : undefined,
  };
}

export const PHONE_VERIFY_NUDGE_KEY = 'arkalearn_phone_verify_nudge';

export function markPhoneVerifyNudge(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(PHONE_VERIFY_NUDGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumePhoneVerifyNudge(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = sessionStorage.getItem(PHONE_VERIFY_NUDGE_KEY);
    if (v) sessionStorage.removeItem(PHONE_VERIFY_NUDGE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function confirmLoginTwoFactor(body: {
  twoFactorSessionId: string;
  otpCode: string;
}): Promise<LoginResponse> {
  const raw = await apiRequest<unknown>(`${ACCOUNT_BASE}/LoginTwoFactor/Confirm`, {
    method: 'POST',
    credentials: 'include',
    body: {
      twoFactorSessionId: body.twoFactorSessionId,
      otpCode: body.otpCode,
    },
  });
  const record = unwrapAuthPayload(raw);
  if (!record) return {};
  const nestedUserData = record.userData ?? record.UserData;
  if (nestedUserData && typeof nestedUserData === 'object') {
    return { userData: nestedUserData as LoginResponseUserData };
  }
  return record as LoginResponse;
}

export async function resendLoginTwoFactor(twoFactorSessionId: string): Promise<LoginResponse> {
  const raw = await apiRequest<unknown>(`${ACCOUNT_BASE}/LoginTwoFactor/Resend`, {
    method: 'POST',
    credentials: 'include',
    body: { twoFactorSessionId },
  });
  const record = unwrapAuthPayload(raw);
  if (!record) return {};
  return {
    requiresTwoFactor: true,
    twoFactorSessionId: String(record.twoFactorSessionId ?? record.TwoFactorSessionId ?? twoFactorSessionId),
    maskedPhone: String(record.maskedPhone ?? record.MaskedPhone ?? ''),
    resendCooldownSeconds: Number(record.resendCooldownSeconds ?? record.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(record.expiresInSeconds ?? record.ExpiresInSeconds ?? 600),
  };
}

export async function setTwoFactorEnabled(enabled: boolean): Promise<void> {
  await apiRequest(`${USER_BASE}/SetTwoFactorEnabled`, {
    method: 'POST',
    credentials: 'include',
    body: { enabled },
  });
}

// —— Logout ——
export async function logout(): Promise<{ message?: string }> {
  return apiRequest<{ message?: string }>(`${ACCOUNT_BASE}/Logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

// —— Register (Create User) ——
/** UserRole: 1 = STUDENT, 2 = TEACHER, 3 = ADMIN */
export interface RegisterRequest {
  userName: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  userRole: number;
  acceptedTerms: boolean;
  otpSessionId?: string;
  otpCode?: string;
}

export const USER_ROLE_STUDENT = 1;
export const USER_ROLE_TEACHER = 2;

export interface RegisterResponse {
  userName?: string;
  email?: string;
  token?: string;
  userData?: LoginResponseUserData;
}

function unwrapAuthPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
    return layer as Record<string, unknown>;
  }
  return root;
}

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const raw = await apiRequest<unknown>(`${USER_BASE}/Create`, {
    method: 'POST',
    credentials: 'include',
    body: {
      userName: body.userName.trim(),
      fullName: body.fullName.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      phoneNumber: formatIranianMobileForApi(body.phoneNumber),
      userRole: body.userRole,
      acceptedTerms: body.acceptedTerms,
      otpSessionId: body.otpSessionId,
      otpCode: body.otpCode,
    },
  });
  const record = unwrapAuthPayload(raw);
  if (!record) return {};

  const nestedUserData = record.userData ?? record.UserData;
  const userData =
    nestedUserData && typeof nestedUserData === 'object'
      ? (nestedUserData as LoginResponseUserData)
      : undefined;

  return {
    userName: (record.userName ?? record.UserName) as string | undefined,
    email: (record.email ?? record.Email) as string | undefined,
    token: (record.token ?? record.Token) as string | undefined,
    userData,
  };
}

// —— Current user (profile) ——
/** Backend may return PascalCase or camelCase (JSON serialization) */
export interface CurrentUser {
  id: string | null;
  userName: string | null;
  fullName: string | null;
  role: string | null;
  email: string | null;
  emailVerified?: boolean;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  twoFactorEnabled?: boolean;
  profileImage: string | null;
}

function unwrapUserRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
    return layer as Record<string, unknown>;
  }
  return root;
}

/** Split display name into first / last for profile update API. */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** از آبجکت API (با هر دو حالت PascalCase و camelCase) به CurrentUser */
function normalizeUser(d: Record<string, unknown> | null | undefined): CurrentUser | null {
  if (!d || typeof d !== 'object') return null;
  const id = (d.Id ?? d.id) != null ? String(d.Id ?? d.id) : null;
  const userName = (d.UserName ?? d.userName) != null ? String(d.UserName ?? d.userName) : null;
  const fullName = (d.FullName ?? d.fullName) != null ? String(d.FullName ?? d.fullName) : null;
  const role = (d.Role ?? d.role) != null ? String(d.Role ?? d.role) : null;
  const email = (d.Email ?? d.email) != null ? String(d.Email ?? d.email) : null;
  const emailVerifiedRaw = d.EmailVerified ?? d.emailVerified;
  const emailVerified =
    emailVerifiedRaw === true || emailVerifiedRaw === 'true' || emailVerifiedRaw === 1 || emailVerifiedRaw === '1';
  const phoneNumberRaw = d.PhoneNumber ?? d.phoneNumber;
  const phoneNumber = phoneNumberRaw != null && String(phoneNumberRaw).trim() ? String(phoneNumberRaw) : null;
  const phoneNumberVerified = boolFrom(d.PhoneNumberVerified ?? d.phoneNumberVerified);
  const twoFactorEnabled = boolFrom(d.TwoFactorEnabled ?? d.twoFactorEnabled);
  const rawProfileImage =
    (d.ProfileImage ?? d.profileImage) != null ? String(d.ProfileImage ?? d.profileImage) : null;
  const profileImage = rawProfileImage ? resolveUserProfileImageUrl(rawProfileImage) : resolveUserProfileImageUrl(null);
  return {
    id,
    userName,
    fullName,
    role,
    email,
    emailVerified,
    phoneNumber,
    phoneNumberVerified,
    twoFactorEnabled,
    profileImage,
  };
}

/** از userData پاسخ لاگین (PascalCase یا camelCase) به CurrentUser */
export function userFromLoginUserData(data: Record<string, unknown> | null | undefined): CurrentUser | null {
  if (!data || typeof data !== 'object') return null;
  const status = data.Status ?? data.status;
  if (isBlockedAccountStatus(status)) return null;
  const id = (data.Id ?? data.id) != null ? String(data.Id ?? data.id) : null;
  if (id == null) return null;
  const userName = (data.UserName ?? data.userName) != null ? String(data.UserName ?? data.userName) : null;
  const name = (data.Name ?? data.name) != null ? String(data.Name ?? data.name) : null;
  const fullNameField = (data.FullName ?? data.fullName) != null ? String(data.FullName ?? data.fullName) : null;
  const fullName = fullNameField ?? name ?? userName ?? null;
  const role = (data.Role ?? data.role) != null ? String(data.Role ?? data.role) : null;
  const email = (data.Email ?? data.email) != null ? String(data.Email ?? data.email) : null;
  const emailVerifiedRaw = data.EmailVerified ?? data.emailVerified;
  const emailVerified =
    emailVerifiedRaw === true || emailVerifiedRaw === 'true' || emailVerifiedRaw === 1 || emailVerifiedRaw === '1';
  const phoneNumberRaw = data.PhoneNumber ?? data.phoneNumber;
  const phoneNumber = phoneNumberRaw != null && String(phoneNumberRaw).trim() ? String(phoneNumberRaw) : null;
  const phoneNumberVerified = boolFrom(data.PhoneNumberVerified ?? data.phoneNumberVerified);
  const twoFactorEnabled = boolFrom(data.TwoFactorEnabled ?? data.twoFactorEnabled);
  const rawAvatar =
    (data.AvatarUrl ?? data.avatarUrl) != null ? String(data.AvatarUrl ?? data.avatarUrl) : null;
  const profileImage = resolveUserProfileImageUrl(rawAvatar);
  return {
    id,
    userName,
    fullName,
    role,
    email,
    emailVerified,
    phoneNumber,
    phoneNumberVerified,
    twoFactorEnabled,
    profileImage,
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const raw = await apiRequest<unknown>(`${USER_BASE}/get-user`, {
      method: 'GET',
      credentials: 'include',
      timeoutMs: 12000,
    });
    const record = unwrapUserRecord(raw);
    return record ? normalizeUser(record) : null;
  } catch (e) {
    if (isAccountBlockedApiError(e)) {
      throw new AccountBlockedError();
    }
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export async function updateUserFullName(params: {
  userId: string;
  fullName: string;
}): Promise<void> {
  const { firstName, lastName } = splitFullName(params.fullName);
  await apiRequest(`${USER_BASE}/UpdateUserFN`, {
    method: 'POST',
    credentials: 'include',
    body: {
      UserId: params.userId,
      FirstName: firstName,
      LastName: lastName,
    },
  });
}

export async function uploadProfileImage(
  file: File,
  options?: { returnRelativePath?: boolean }
): Promise<string> {
  const formData = new FormData();
  formData.append('profileImage', file);
  const relativePath = await parseUploadedImagePath(
    await apiRequest<unknown>(`${USER_BASE}/UploadProfileImage`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }),
    'Profile image upload did not return a URL.'
  );
  return options?.returnRelativePath ? relativePath : getUserImageUrl(relativePath);
}

/** Uploads a dashboard header/banner image without changing the user's profile photo. */
export async function uploadHeaderImage(
  file: File,
  options?: { returnRelativePath?: boolean }
): Promise<string> {
  const formData = new FormData();
  formData.append('headerImage', file);
  const relativePath = await parseUploadedImagePath(
    await apiRequest<unknown>(`${USER_BASE}/UploadHeaderImage`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }),
    'Header image upload did not return a URL.'
  );
  return options?.returnRelativePath ? relativePath : getDashboardHeaderImageUrl(relativePath);
}

function parseUploadedImagePath(raw: unknown, emptyMessage: string): string {
  let record: Record<string, unknown> | null =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;

  for (let depth = 0; depth < 4 && record; depth++) {
    const nested =
      (record.data && typeof record.data === 'object' && !Array.isArray(record.data)
        ? (record.data as Record<string, unknown>)
        : null) ??
      (record.Data && typeof record.Data === 'object' && !Array.isArray(record.Data)
        ? (record.Data as Record<string, unknown>)
        : null) ??
      (record.result && typeof record.result === 'object' && !Array.isArray(record.result)
        ? (record.result as Record<string, unknown>)
        : null) ??
      (record.Result && typeof record.Result === 'object' && !Array.isArray(record.Result)
        ? (record.Result as Record<string, unknown>)
        : null);

    if (!nested || nested === record) break;
    record = nested;
  }

  const path = record?.imageUrl ?? record?.ImageUrl;
  if (path == null || String(path).trim() === '') {
    throw new Error(emptyMessage);
  }

  return String(path).trim();
}

export async function getToken(): Promise<{ token?: string }> {
  return apiRequest<{ token?: string }>(`${ACCOUNT_BASE}/get-token`, {
    method: 'GET',
  });
}
