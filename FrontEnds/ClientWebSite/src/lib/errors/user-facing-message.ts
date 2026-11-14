import type { ReactNode } from 'react';

const PERSIAN_CHAR = /[\u0600-\u06FF]/;

export function getUiLocale(): 'fa' | 'en' {
  if (typeof window === 'undefined') return 'fa';
  return localStorage.getItem('locale') === 'en' ? 'en' : 'fa';
}

export function hasPersianText(value: string): boolean {
  return PERSIAN_CHAR.test(value);
}

/** True when the string is mostly Latin/ASCII (typical raw backend / English dump). */
export function isMostlyLatinMessage(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (hasPersianText(trimmed)) return false;
  const letters = trimmed.replace(/[^A-Za-z\u00C0-\u024F]/g, '');
  return letters.length >= 3;
}

type MessageKind = 'error' | 'success' | 'info';

const SUCCESS_MAP: Array<{ test: RegExp; fa: string }> = [
  { test: /cache.*(warm|ready|loaded)|warmup.*(complete|success)/i, fa: 'حافظهٔ پنهان با موفقیت آماده شد.' },
  { test: /desktop.*(device|release).*(saved|updated|published|released)/i, fa: 'اطلاعات نسخهٔ دسکتاپ با موفقیت ذخیره شد.' },
  { test: /(course|seminar|article).*(saved|updated|published|created)/i, fa: 'اطلاعات با موفقیت ذخیره شد.' },
  { test: /media|file.*uploaded|upload.*complete/i, fa: 'فایل با موفقیت آپلود شد.' },
  { test: /saved|updated|success|done|completed|published|uploaded|removed|deleted|enabled|disabled/i, fa: 'عملیات با موفقیت انجام شد.' },
  { test: /phone.*(updated|verified|change)/i, fa: 'شماره تماس با موفقیت به‌روزرسانی شد.' },
  { test: /email.*(updated|verified|change|sent)/i, fa: 'ایمیل با موفقیت به‌روزرسانی شد.' },
  { test: /two[- ]?factor|2fa/i, fa: 'تنظیمات احراز هویت دو مرحله‌ای ذخیره شد.' },
  { test: /copied|copy/i, fa: 'کپی شد.' },
  { test: /sent|send/i, fa: 'ارسال با موفقیت انجام شد.' },
];

const ERROR_RULES: Array<{ test: RegExp; fa: string }> = [
  { test: /admin access required|administrator access/i, fa: 'برای انجام این عملیات دسترسی مدیر لازم است.' },
  { test: /video duration cannot exceed|duration.*(exceed|too (?:long|large))/i, fa: 'مدت‌زمان ویدیو بیش از حد مجاز است.' },
  { test: /invalid object name|MediaUploadSettings/i, fa: 'تنظیمات لازم در سامانه کامل نیست. لطفاً با پشتیبانی تماس بگیرید.' },
  { test: /database.*(connection|unavailable|failed)|cannot connect.*database|sql.*connection/i, fa: 'ارتباط با پایگاه داده برقرار نشد. لطفاً کمی بعد دوباره تلاش کنید.' },
  { test: /redis|cache.*(fail|error|unavailable)|warmup.*(fail|error)/i, fa: 'آماده‌سازی حافظهٔ پنهان انجام نشد. لطفاً کمی بعد دوباره تلاش کنید.' },
  { test: /failed to fetch|network error|load failed|ECONNREFUSED|ERR_NETWORK|timeout|timed out/i, fa: 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.' },
  { test: /axioserror|request failed|status code\s*\d{3}/i, fa: 'درخواست به سرور انجام نشد. لطفاً دوباره تلاش کنید.' },
  { test: /could not (?:load|save|start|create|update|delete|upload)|failed to (?:load|save|start)/i, fa: 'عملیات درخواستی انجام نشد. لطفاً دوباره تلاش کنید.' },
  { test: /ip[_\s-]?blocked|IP_BLOCKED/i, fa: 'دسترسی این آدرس IP محدود شده است.' },
  { test: /blocked|account.*(block|suspend)/i, fa: 'حساب کاربری شما مسدود شده است. با پشتیبانی تماس بگیرید.' },
  { test: /invalid credentials|wrong password|incorrect password|login failed|unauthorized/i, fa: 'نام کاربری یا رمز عبور نادرست است.' },
  { test: /too many.*(attempt|request)|rate limit/i, fa: 'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.' },
  { test: /forbidden|access denied|not allowed|permission/i, fa: 'اجازهٔ انجام این عملیات را ندارید.' },
  { test: /not found|no .* available|was not found/i, fa: 'مورد درخواستی یافت نشد.' },
  { test: /phone number already|already in use by another|PHONE_ALREADY_IN_USE|duplicate key.*PhoneNumber|phone.*(taken|in use)|already.*phone/i, fa: 'شماره تماس ثبت نشد و اعتبارسنجی نشد؛ این شماره قبلاً استفاده شده است.' },
  { test: /otp|verification code|verify.*(code|phone|email)|invalid or expired/i, fa: 'کد تأیید نامعتبر یا منقضی شده است.' },
  { test: /phone.*(required|invalid|verify|change)|mobile/i, fa: 'شماره تماس معتبر نیست یا هنوز تأیید نشده است.' },
  { test: /email.*(required|invalid|taken|verify|already)/i, fa: 'ایمیل معتبر نیست یا امکان استفاده از آن وجود ندارد.' },
  { test: /two[- ]?factor|2fa|TWO_FACTOR/i, fa: 'تأیید دو مرحله‌ای انجام نشد. دوباره تلاش کنید.' },
  { test: /sms.*(disabled|fail|template|config)/i, fa: 'ارسال پیامک در حال حاضر امکان‌پذیر نیست.' },
  { test: /payment|gateway|invoice|wallet|balance|insufficient/i, fa: 'خطا در عملیات مالی. لطفاً دوباره تلاش کنید.' },
  { test: /intro video|course introduction|drm|desktop-encrypted/i, fa: 'ویدیوی معرفی باید عمومی باشد و رمزنگاری‌نشده آپلود شود. لطفاً دوباره آپلود کنید.' },
  { test: /media upload|file url|upload|file.*(large|type|invalid)|content[- ]?type/i, fa: 'آپلود فایل انجام نشد. نوع یا حجم فایل را بررسی کنید.' },
  { test: /(course|seminar|article).*(save|update|create|publish).*(fail|error)|failed to (?:save|update|create).*(course|seminar|article)/i, fa: 'ذخیرهٔ اطلاعات انجام نشد. لطفاً ورودی‌ها را بررسی کنید.' },
  { test: /desktop.*(device|release).*(fail|error)|failed.*desktop.*(device|release)/i, fa: 'ذخیرهٔ اطلاعات نسخهٔ دسکتاپ انجام نشد.' },
  { test: /title is required/i, fa: 'عنوان الزامی است.' },
  { test: /short description is required/i, fa: 'توضیح کوتاه الزامی است.' },
  { test: /description is required/i, fa: 'توضیحات الزامی است.' },
  { test: /category is required/i, fa: 'دسته‌بندی الزامی است.' },
  { test: /(course )?level is required/i, fa: 'سطح دوره الزامی است.' },
  { test: /language is required/i, fa: 'زبان الزامی است.' },
  { test: /validation|required|invalid|bad request/i, fa: 'اطلاعات واردشده معتبر نیست. لطفاً ورودی‌ها را بررسی کنید.' },
  { test: /conflict|already exists|duplicate/i, fa: 'این مورد قبلاً ثبت شده است.' },
  { test: /server|exception|internal/i, fa: 'خطای داخلی سرور رخ داد. لطفاً کمی بعد دوباره تلاش کنید.' },
  { test: /session|expired|token|cookie|sign[- ]?in/i, fa: 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.' },
];

const DEFAULTS: Record<MessageKind, string> = {
  error: 'عملیات ناموفق بود. لطفاً دوباره تلاش کنید.',
  success: 'عملیات با موفقیت انجام شد.',
  info: 'پیام سیستم',
};

function matchRule(raw: string, rules: Array<{ test: RegExp; fa: string }>): string | null {
  for (const rule of rules) {
    if (rule.test.test(raw)) return rule.fa;
  }
  return null;
}

function extractRawErrorText(error: unknown): { text: string; status?: number } {
  if (error == null) return { text: '' };

  if (typeof error === 'string') return { text: error };

  if (typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const status = typeof record.status === 'number' ? record.status : undefined;
    const body = record.body;
    const fromBody = extractMessageFromBody(body);
    if (fromBody) return { text: fromBody, status };

    if (typeof record.message === 'string' && record.message.trim()) {
      return { text: record.message.trim(), status };
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return { text: error.message.trim() };
  }

  return { text: '' };
}

function extractMessageFromBody(parsed: unknown): string {
  if (parsed == null) return '';
  if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();

  if (Array.isArray(parsed)) {
    const parts = parsed
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const r = item as Record<string, unknown>;
          const nested = r.message ?? r.Message ?? r.errorMessage ?? r.ErrorMessage;
          return typeof nested === 'string' ? nested.trim() : '';
        }
        return '';
      })
      .filter(Boolean);
    return parts.join(' ');
  }

  if (typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    const direct = record.message ?? record.Message ?? record.error ?? record.Error ?? record.errorMessage;
    if (typeof direct === 'string' && direct.trim()) return direct.trim();

    for (const key of ['errorMessages', 'ErrorMessages', 'messages', 'Messages', 'data', 'Data'] as const) {
      const nested = extractMessageFromBody(record[key]);
      if (nested) return nested;
    }
  }

  return '';
}

/**
 * Convert any backend / English / mixed string into a short Persian user-facing message.
 * Persian text is kept as-is. Never returns raw English API dumps.
 */
export function toUserFacingMessage(
  raw: unknown,
  kind: MessageKind = 'error',
  fallback?: string
): string {
  const locale = getUiLocale();
  if (locale === 'en') {
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (raw instanceof Error && raw.message.trim()) return raw.message.trim();
    return fallback?.trim() || (kind === 'success' ? 'Operation completed successfully.' : kind === 'info' ? 'System message' : 'Operation failed. Please try again.');
  }

  const fallbackFa = fallback?.trim() && hasPersianText(fallback) ? fallback.trim() : DEFAULTS[kind];

  if (raw == null) return fallbackFa;

  if (typeof raw !== 'string') {
    if (raw instanceof Error) return toUserFacingMessage(raw.message, kind, fallbackFa);
    return fallbackFa;
  }

  const text = raw.trim();
  if (!text) return fallbackFa;

  if (hasPersianText(text)) {
    const persianOnly = text
      .replace(/\s*[|(]\s*[A-Za-z][\w\s.,:;'"-]{3,}$/u, '')
      .trim();
    return persianOnly || fallbackFa;
  }

  if (kind === 'success' || kind === 'info') {
    return matchRule(text, SUCCESS_MAP) ?? DEFAULTS.success;
  }

  return matchRule(text, ERROR_RULES) ?? fallbackFa;
}

/** Resolve a thrown API/unknown error to a Persian conceptual message (never raw backend English). */
export function resolveUserFacingError(error: unknown, fallback?: string): string {
  if (getUiLocale() === 'en') {
    const { text } = extractRawErrorText(error);
    return text || fallback?.trim() || 'Operation failed. Please try again.';
  }

  const fallbackFa =
    fallback?.trim() && hasPersianText(fallback) ? fallback.trim() : DEFAULTS.error;

  const { text, status } = extractRawErrorText(error);
  if (text) {
    const mapped = toUserFacingMessage(text, 'error', fallbackFa);
    if (mapped !== DEFAULTS.error || hasPersianText(text)) return mapped;
  }

  if (status === 0) return toUserFacingMessage('network error', 'error', fallbackFa);
  if (status === 401) return toUserFacingMessage('unauthorized', 'error', fallbackFa);
  if (status === 403) return toUserFacingMessage('forbidden', 'error', fallbackFa);
  if (status === 404) return toUserFacingMessage('not found', 'error', fallbackFa);
  if (status === 409) return toUserFacingMessage('conflict', 'error', fallbackFa);
  if (status === 429) return toUserFacingMessage('rate limit', 'error', fallbackFa);
  if (typeof status === 'number' && status >= 500) return toUserFacingMessage('server error', 'error', fallbackFa);
  if (status === 400) return toUserFacingMessage('validation', 'error', fallbackFa);

  return fallbackFa;
}

export function sanitizeToastText(
  value: ReactNode | undefined,
  kind: MessageKind
): ReactNode | undefined {
  if (value == null || value === false) return undefined;
  if (typeof value === 'string') {
    return toUserFacingMessage(value, kind);
  }
  return value;
}
