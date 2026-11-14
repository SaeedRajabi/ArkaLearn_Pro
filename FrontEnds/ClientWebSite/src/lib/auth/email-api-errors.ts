import { getApiErrorMessage, getUserFacingApiErrorMessage } from '@/lib/api/client';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

type TranslateFn = (key: string, fallback: string) => string;

/** Map backend email verification / change errors to Persian conceptual text (no raw backend dump). */
export function resolveEmailApiErrorMessage(
  error: unknown,
  dict: Dictionary,
  fallbackKey = 'dashboard.email.genericError',
  fallbackText = 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
): string {
  const t: TranslateFn = (key, fb) => getDictValue(dict, key, fb);
  const fallback = t(fallbackKey, fallbackText);
  const raw = getApiErrorMessage(error, '').toLowerCase();

  if (!raw) return getUserFacingApiErrorMessage(error, fallback);

  if (raw.includes('unauthorized')) {
    return t('dashboard.email.errorUnauthorized', 'برای ادامه باید وارد حساب شوید.');
  }
  if (raw.includes('invalid email')) {
    return t('dashboard.email.errorInvalidEmail', 'یک آدرس ایمیل معتبر وارد کنید.');
  }
  if (raw.includes('invalid or expired verification code') || raw.includes('invalid or expired code')) {
    return t('dashboard.email.errorInvalidOtp', 'کد تأیید نامعتبر یا منقضی شده است.');
  }
  if (raw.includes('please wait before requesting a new code') || raw.includes('wait before requesting')) {
    return t('dashboard.email.errorResendCooldown', 'لطفاً قبل از درخواست کد جدید کمی صبر کنید.');
  }
  if (raw.includes('already registered')) {
    return t('dashboard.email.errorEmailTaken', 'این ایمیل قبلاً ثبت شده است.');
  }
  if (raw.includes('must be different from your current email') || raw.includes('different from your current')) {
    return t('dashboard.email.errorSameEmail', 'ایمیل جدید باید با ایمیل فعلی شما متفاوت باشد.');
  }
  if (raw.includes('already verified')) {
    return t('dashboard.email.errorAlreadyVerified', 'ایمیل شما قبلاً تأیید شده است.');
  }
  if (raw.includes('does not have a valid email')) {
    return t('dashboard.email.errorNoEmail', 'حساب شما ایمیل معتبری ندارد.');
  }
  if (raw.includes('user not found')) {
    return t('dashboard.email.errorUserNotFound', 'حساب کاربری یافت نشد.');
  }
  if (raw === 'failed to fetch' || raw === 'network error' || raw.includes('network')) {
    return t('dashboard.email.errorNetwork', 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
  }
  if (raw === 'bad request' || /^http\s+\d+$/i.test(raw.trim())) {
    return fallback;
  }

  return getUserFacingApiErrorMessage(error, fallback);
}
