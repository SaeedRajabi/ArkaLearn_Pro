import { apiRequest } from './client';

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function getIpStatus(): Promise<{ isBlocked: boolean }> {
  const raw = await apiRequest<unknown>('Security/IpStatus', { method: 'GET', credentials: 'include' });
  const data = unwrapData<Record<string, unknown>>(raw);
  return { isBlocked: Boolean(data?.isBlocked ?? data?.IsBlocked) };
}

export type IpUnblockOtpSession = {
  sessionId: string;
  resendCooldownSeconds: number;
  expiresInSeconds: number;
};

export async function sendIpUnblockOtp(phoneNumber: string): Promise<IpUnblockOtpSession> {
  const raw = await apiRequest<unknown>('Security/IpUnblockOtp/Send', {
    method: 'POST',
    credentials: 'include',
    body: { phoneNumber: phoneNumber.trim() },
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  return {
    sessionId: String(data?.sessionId ?? data?.SessionId ?? ''),
    resendCooldownSeconds: Number(data?.resendCooldownSeconds ?? data?.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data?.expiresInSeconds ?? data?.ExpiresInSeconds ?? 600),
  };
}

export async function submitIpUnblockRequest(payload: {
  phoneNumber: string;
  otpSessionId: string;
  otpCode: string;
  message: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>('Security/IpUnblock/Submit', {
    method: 'POST',
    credentials: 'include',
    body: payload,
  });
  const data = unwrapData<unknown>(raw);
  return String(data ?? '');
}
