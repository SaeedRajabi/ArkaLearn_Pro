import { getApiErrorMessage, ApiError } from '@/lib/api/client';

export class AccountBlockedError extends Error {
  constructor(message = 'Account blocked') {
    super(message);
    this.name = 'AccountBlockedError';
  }
}

export function isBlockedAccountStatus(status: unknown): boolean {
  if (status == null) return false;
  return String(status).trim().toUpperCase() === 'BLOCKED';
}

export function isAccountBlockedApiError(error: unknown): boolean {
  if (error instanceof AccountBlockedError) return true;
  if (!(error instanceof ApiError)) return false;
  const msg = getApiErrorMessage(error, '').toLowerCase();
  return msg.includes('account blocked') || msg.includes('blocked by');
}
