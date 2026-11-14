import { getApiErrorMessage, getUserFacingApiErrorMessage } from '@/lib/api/client';

type LoginDict = Record<string, string | undefined>;

/** Map backend login errors to localized, user-friendly Persian text (no raw backend dump). */
export function resolveLoginErrorMessage(error: unknown, dict: LoginDict): string {
  const fallback =
    dict.loginFailed ?? 'ورود ناموفق بود. لطفاً نام کاربری یا ایمیل و رمز عبور را بررسی کنید.';
  // Keyword match against raw backend text, then return dict/Persian only.
  const raw = getApiErrorMessage(error, '').toLowerCase();

  if (raw.includes('invalid credential') || raw.includes('wrong password') || raw.includes('incorrect password')) {
    return dict.loginInvalidCredentials ?? 'نام کاربری/ایمیل یا رمز عبور اشتباه است.';
  }

  if (raw.includes('account blocked') || raw.includes('blocked by')) {
    return (
      dict.loginAccountBlocked ??
      'سیستم شما را مسدود کرده است. برای رفع مسدودیت با پشتیبانی آرکا نرم‌افزار تماس بگیرید.'
    );
  }

  if (raw.includes('ip_blocked') || raw.includes('ip blocked')) {
    return dict.loginIpBlocked ?? 'آدرس IP شما مسدود شده است. از صفحه درخواست رفع مسدودیت اقدام کنید.';
  }

  if (raw.includes('too many failed') || raw.includes('try again later') || raw.includes('rate limit')) {
    return dict.loginTooManyAttempts ?? 'تعداد تلاش‌های ناموفق زیاد است. لطفاً کمی بعد دوباره تلاش کنید.';
  }

  if (
    raw === 'failed to fetch' ||
    raw === 'network error' ||
    raw.includes('network') ||
    raw.includes('failed to fetch')
  ) {
    return dict.loginNetworkError ?? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.';
  }

  if (raw.includes('two') && raw.includes('factor')) {
    return dict.twoFactorFailed ?? 'تأیید دو مرحله‌ای انجام نشد. دوباره تلاش کنید.';
  }

  // Never surface raw English — always a conceptual Persian message.
  return getUserFacingApiErrorMessage(error, fallback);
}
