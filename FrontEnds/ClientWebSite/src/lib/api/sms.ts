import { apiRequest } from './client';

export type RegistrationSmsConfig = {
  registrationOtpEnabled: boolean;
  resendCooldownSeconds: number;
  otpExpiryMinutes: number;
};

export type OtpSessionResponse = {
  sessionId: string;
  resendCooldownSeconds: number;
  expiresInSeconds: number;
};

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function getRegistrationSmsConfig(): Promise<RegistrationSmsConfig> {
  const raw = await apiRequest<unknown>('Sms/Registration/Config', { method: 'GET' });
  const data = unwrapData<Record<string, unknown>>(raw);
  return {
    registrationOtpEnabled: Boolean(data?.registrationOtpEnabled ?? data?.RegistrationOtpEnabled),
    resendCooldownSeconds: Number(data?.resendCooldownSeconds ?? data?.ResendCooldownSeconds ?? 120),
    otpExpiryMinutes: Number(data?.otpExpiryMinutes ?? data?.OtpExpiryMinutes ?? 10),
  };
}

export async function sendRegistrationOtp(body: {
  userName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}): Promise<OtpSessionResponse> {
  const raw = await apiRequest<unknown>('Sms/Registration/Send', {
    method: 'POST',
    body,
    timeoutMs: 35000,
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data?.sessionId && !data?.SessionId) {
    throw new Error('Failed to start phone verification.');
  }
  return {
    sessionId: String(data.sessionId ?? data.SessionId),
    resendCooldownSeconds: Number(data.resendCooldownSeconds ?? data.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data.expiresInSeconds ?? data.ExpiresInSeconds ?? 600),
  };
}

export async function sendPhoneChangeOtp(newPhoneNumber: string): Promise<OtpSessionResponse> {
  const raw = await apiRequest<unknown>('Sms/PhoneChange/Send', {
    method: 'POST',
    credentials: 'include',
    body: { newPhoneNumber },
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  return {
    sessionId: String(data?.sessionId ?? data?.SessionId ?? ''),
    resendCooldownSeconds: Number(data?.resendCooldownSeconds ?? data?.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data?.expiresInSeconds ?? data?.ExpiresInSeconds ?? 600),
  };
}

export async function confirmPhoneChange(body: {
  newPhoneNumber: string;
  otpSessionId: string;
  otpCode: string;
}): Promise<void> {
  await apiRequest<unknown>('Sms/PhoneChange/Confirm', {
    method: 'POST',
    credentials: 'include',
    body: {
      newPhoneNumber: body.newPhoneNumber,
      otpSessionId: body.otpSessionId,
      otpCode: body.otpCode,
    },
  });
}

export async function sendProfilePhoneVerificationOtp(): Promise<OtpSessionResponse> {
  const raw = await apiRequest<unknown>('Sms/ProfileVerification/Send', {
    method: 'POST',
    credentials: 'include',
    body: {},
    timeoutMs: 35000,
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  return {
    sessionId: String(data?.sessionId ?? data?.SessionId ?? ''),
    resendCooldownSeconds: Number(data?.resendCooldownSeconds ?? data?.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data?.expiresInSeconds ?? data?.ExpiresInSeconds ?? 600),
  };
}

export async function confirmProfilePhoneVerification(body: {
  otpSessionId: string;
  otpCode: string;
}): Promise<void> {
  await apiRequest<unknown>('Sms/ProfileVerification/Confirm', {
    method: 'POST',
    credentials: 'include',
    body: {
      otpSessionId: body.otpSessionId,
      otpCode: body.otpCode,
    },
  });
}

export async function sendProjectOrderOtp(body: {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}): Promise<OtpSessionResponse> {
  const raw = await apiRequest<unknown>('Sms/ProjectOrder/Send', {
    method: 'POST',
    body,
    timeoutMs: 35000,
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data?.sessionId && !data?.SessionId) {
    throw new Error('Failed to start phone verification.');
  }
  return {
    sessionId: String(data.sessionId ?? data.SessionId),
    resendCooldownSeconds: Number(data.resendCooldownSeconds ?? data.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data.expiresInSeconds ?? data.ExpiresInSeconds ?? 600),
  };
}

export async function verifyProjectOrderOtp(body: {
  sessionId: string;
  phoneNumber: string;
  otpCode: string;
}): Promise<void> {
  const raw = await apiRequest<unknown>('Sms/ProjectOrder/Verify', {
    method: 'POST',
    body: {
      sessionId: body.sessionId,
      phoneNumber: body.phoneNumber,
      otpCode: body.otpCode,
    },
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  const verified = Boolean(data?.verified ?? data?.Verified);
  if (!verified) {
    throw new Error('Invalid or expired verification code.');
  }
}
