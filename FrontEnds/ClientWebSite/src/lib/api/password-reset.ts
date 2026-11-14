import { apiRequest } from './client';

export async function requestPasswordReset(email: string): Promise<string> {
  const raw = await apiRequest<unknown>('User/RequestPasswordReset', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const data = record.data ?? record.Data ?? record.message ?? record.Message;
    if (typeof data === 'string') return data;
  }
  return '';
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const raw = await apiRequest<unknown>('User/ResetPassword', {
    method: 'POST',
    body: { token, newPassword },
  });
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const data = record.data ?? record.Data ?? record.message ?? record.Message;
    if (typeof data === 'string') return data;
  }
  return '';
}
