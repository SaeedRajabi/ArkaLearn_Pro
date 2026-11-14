import { apiRequest } from './client';
import type { OtpSessionResponse } from './sms';

function unwrapData<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function sendNewsletterSubscribeOtp(email: string): Promise<OtpSessionResponse> {
  const raw = await apiRequest<unknown>('Newsletter/Subscribe/SendOtp', {
    method: 'POST',
    body: { email: email.trim() },
    timeoutMs: 35000,
  });
  const data = unwrapData<Record<string, unknown>>(raw);
  return {
    sessionId: String(data?.sessionId ?? data?.SessionId ?? ''),
    resendCooldownSeconds: Number(data?.resendCooldownSeconds ?? data?.ResendCooldownSeconds ?? 120),
    expiresInSeconds: Number(data?.expiresInSeconds ?? data?.ExpiresInSeconds ?? 600),
  };
}

export async function confirmNewsletterSubscribe(body: {
  email: string;
  otpSessionId: string;
  otpCode: string;
}): Promise<void> {
  await apiRequest<unknown>('Newsletter/Subscribe/Confirm', {
    method: 'POST',
    body: {
      email: body.email.trim(),
      otpSessionId: body.otpSessionId,
      otpCode: body.otpCode,
    },
    timeoutMs: 35000,
  });
}
