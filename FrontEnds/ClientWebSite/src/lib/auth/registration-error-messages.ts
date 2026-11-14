import { ApiError, getApiErrorMessage } from '@/lib/api/client';

type RegisterDict = Record<string, string | undefined>;

function isNetworkFailure(error: unknown, raw: string): boolean {
  if (error instanceof ApiError && (error.status === 0 || error.status >= 502)) {
    return true;
  }

  const lower = raw.toLowerCase();
  return (
    lower === 'failed to fetch' ||
    lower === 'network error' ||
    lower.includes('network') ||
    lower.includes('http2') ||
    lower.includes('load failed')
  );
}

function isTimeout(error: unknown, raw: string): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  const lower = raw.toLowerCase();
  return lower.includes('timeout') || lower.includes('did not respond in time');
}

/** Map registration OTP errors to localized, user-friendly text. */
export function resolveRegistrationOtpError(error: unknown, dict: RegisterDict): string {
  const fallback = dict.otpSendFailed ?? 'Could not send verification code.';
  const raw = getApiErrorMessage(error, fallback);
  const lower = raw.toLowerCase();

  if (isTimeout(error, raw)) {
    return dict.otpSendTimeout ?? 'Sending the verification code took too long. Please try again.';
  }

  if (isNetworkFailure(error, raw)) {
    return dict.otpNetworkError ?? dict.loginNetworkError ?? 'Could not reach the server. Check your connection and try again.';
  }

  if (lower.includes('phone number already exists')) {
    return dict.otpPhoneExists ?? 'An account with this phone number already exists.';
  }

  if (lower.includes('email already exists')) {
    return dict.otpEmailExists ?? 'An account with this email already exists.';
  }

  if (lower.includes('username already exists')) {
    return dict.otpUsernameExists ?? 'An account with this username already exists.';
  }

  if (lower.includes('user already exists') || lower.includes('already exists')) {
    return dict.otpUserExists ?? 'An account with this email or username already exists.';
  }

  if (lower.includes('wait before requesting')) {
    return dict.otpResendTooSoon ?? 'Please wait before requesting a new code.';
  }

  if (lower.includes('insufficient sms credit')) {
    return dict.otpSmsCredit ?? 'SMS service credit is insufficient. Please contact support.';
  }

  if (lower.includes('template')) {
    return dict.otpSmsTemplate ?? 'SMS verification template is not configured correctly. Please contact support.';
  }

  if (lower.includes('verification service is temporarily unavailable')) {
    return dict.otpServiceUnavailable ?? 'Verification service is temporarily unavailable. Please try again in a moment.';
  }

  if (lower.includes('disabled')) {
    return dict.otpSmsDisabled ?? 'Phone verification is currently disabled.';
  }

  if (lower.includes('invalid phone')) {
    return dict.phoneInvalid ?? 'Enter a valid Iranian mobile number (11 digits, starting with 09).';
  }

  if (lower === 'bad request' || /^http\s+\d+$/i.test(raw.trim())) {
    return fallback;
  }

  return raw.trim() || fallback;
}
