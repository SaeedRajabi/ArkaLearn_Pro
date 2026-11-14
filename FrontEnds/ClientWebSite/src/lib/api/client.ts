import { API_BASE_URL, API_PROXY_BASE_PATH } from './config';
import { emitSessionExpired, shouldHandleUnauthorizedApiResponse } from '@/lib/auth/session-expired';
import { parseJsonWithLongIds } from '@/lib/parse-json-with-long-ids';
import { resolveUserFacingError } from '@/lib/errors/user-facing-message';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Extract a human-readable message from common API error payload shapes. */
export function parseApiErrorBody(parsed: unknown, fallback: string): string {
  if (parsed == null) return fallback;

  if (typeof parsed === 'string' && parsed.trim().length > 0) {
    return parsed.trim();
  }

  if (Array.isArray(parsed)) {
    const parts = parsed.flatMap((item) => {
      if (typeof item === 'string' && item.trim()) return [item.trim()];
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const nested =
          record.message ??
          record.Message ??
          record.errorMessage ??
          record.ErrorMessage ??
          record.error ??
          record.Error;
        if (typeof nested === 'string' && nested.trim()) return [nested.trim()];
      }
      return [];
    });
    if (parts.length > 0) return parts.join(' ');
  }

  if (typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    const direct =
      record.message ??
      record.Message ??
      record.error ??
      record.Error ??
      record.errorMessage ??
      record.ErrorMessage;
    if (typeof direct === 'string' && direct.trim().length > 0) {
      return direct.trim();
    }

    const errorMessages = record.errorMessages ?? record.ErrorMessages;
    if (errorMessages != null) {
      const fromErrorMessages = parseApiErrorBody(errorMessages, '');
      if (fromErrorMessages) return fromErrorMessages;
    }

    const messages = record.messages ?? record.Messages;
    if (messages != null) {
      const fromMessages = parseApiErrorBody(messages, '');
      if (fromMessages) return fromMessages;
    }

    const data = record.data ?? record.Data;
    if (data != null) {
      const fromData = parseApiErrorBody(data, '');
      if (fromData) return fromData;
    }
  }

  return fallback;
}

function getErrorMessage(parsed: unknown, fallback: string): string {
  return parseApiErrorBody(parsed, fallback);
}

/** Raw API error text (for keyword matching). Prefer {@link getUserFacingApiErrorMessage} for UI. */
export function getApiErrorMessage(error: unknown, fallback = ''): string {
  if (error instanceof ApiError) {
    const fromBody = parseApiErrorBody(error.body, '');
    if (fromBody && !isGenericHttpMessage(fromBody, error.status)) {
      return fromBody;
    }
    if (error.message && !isGenericHttpMessage(error.message, error.status)) {
      return error.message;
    }
    if (error.status === 401) {
      return fallback;
    }
    if (error.status === 0 || error.message === 'Failed to fetch' || error.message === 'Network Error') {
      return fallback;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

/** Persian conceptual message for UI (toasts, alerts, inline errors). Never returns raw English API dumps. */
export function getUserFacingApiErrorMessage(error: unknown, fallback?: string): string {
  return resolveUserFacingError(error, fallback);
}

function isGenericHttpMessage(message: string, status: number): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (/^HTTP\s+\d+$/i.test(trimmed)) return true;
  if (status === 400 && /^bad\s*request$/i.test(trimmed)) return true;
  return false;
}

// تعریف دقیق‌تر برای آپشن‌های درخواست
// body در RequestInit استاندارد فقط BodyInit را قبول می‌کند (Blob, Buffer, ...)
// ما می‌خواهیم Plain Object را هم برای JSON قبول کنیم، پس body اصلی را حذف و جایگزین می‌کنیم.
type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown> | FormData | BodyInit |object | null;
  /** Abort the request after this many milliseconds (browser only). */
  timeoutMs?: number;
};

/**
 * درخواست به API بک‌اند با credentials برای ارسال کوکی/احراز هویت
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers: headersInit, timeoutMs, signal: callerSignal, ...rest } = options;
  const headers = new Headers({
    Accept: 'application/json',
    ...(headersInit ?? {}),
  });

  let requestBody: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || typeof body === 'string') {
      // اگر فرم‌دیتا یا انواع استاندارد بادی باشد
      requestBody = body as BodyInit;
    } else {
      // اگر آبجکت معمولی باشد، جیسون می‌کنیم
      headers.set('Content-Type', 'application/json');
      requestBody = JSON.stringify(body);
    }
  }

  const cleanPath = path
    .replace(/^\//, '')
    .replace(new RegExp(`^${API_PROXY_BASE_PATH.replace(/^\//, '').replace(/\//g, '\\/')}/?`, 'i'), '');
  
  // اگر مسیر کامل است (http) که هیچی، وگرنه از Base URL یا نسبی استفاده می‌کنیم
  let url:string = path;
  if (!/^https?:\/\//i.test(path)) {
    url = `${API_BASE_URL.replace(/\/$/, '')}/${cleanPath}`;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (controller && timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  if (controller && callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
  const response = await fetch(url, {
    ...rest,
    headers,
    body: requestBody,
    credentials: 'include', // ارسال کوکی‌ها
    signal: controller?.signal ?? callerSignal,
  });

  if (!response.ok) {
    let parsed: unknown;
    try {
      const text = await response.text();
      parsed = text ? parseJsonWithLongIds(text) : undefined;
    } catch {
      parsed = undefined;
    }
    
    if (response.status === 401 && typeof window !== 'undefined') {
      if (shouldHandleUnauthorizedApiResponse(url)) {
        emitSessionExpired();
      }
    }

    throw new ApiError(
      getErrorMessage(parsed, response.statusText || `HTTP ${response.status}`),
      response.status,
      parsed
    );
  }

  // اگر پاسخ موفق بود
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    // اگر خالی بود نباید جیسون پارس کنیم
    const text = await response.text();
    return text ? (parseJsonWithLongIds(text) as T) : ({} as T);
  }
  
  return await response.text() as unknown as T;
  } catch (error) {
    if (controller?.signal.aborted && !(callerSignal?.aborted)) {
      throw new ApiError('Request timed out.', 0);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof TypeError) {
      throw new ApiError(error.message || 'Failed to fetch', 0);
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const q:string = search.toString();
  return q ? `?${q}` : '';
}
