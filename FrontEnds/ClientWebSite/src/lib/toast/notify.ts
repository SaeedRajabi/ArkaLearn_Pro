'use client';

import { toast } from '@/hooks/use-toast';
import { resolveUserFacingError, toUserFacingMessage } from '@/lib/errors/user-facing-message';

type NotifyOptions = {
  title?: string;
  description?: string;
  duration?: number;
};

/** Success confirmation — Persian conceptual copy, polished success toast. */
export function notifySuccess(titleOrOptions?: string | NotifyOptions, description?: string) {
  const opts = normalize(titleOrOptions, description);
  return toast({
    variant: 'success',
    title: toUserFacingMessage(opts.title ?? 'عملیات با موفقیت انجام شد.', 'success'),
    description: opts.description ? toUserFacingMessage(opts.description, 'success') : undefined,
    duration: opts.duration ?? 4200,
  });
}

/** Error alert — maps backend/English dumps to a short Persian concept. */
export function notifyError(error: unknown, fallbackTitle?: string) {
  const message = resolveUserFacingError(
    error,
    fallbackTitle && fallbackTitle.trim() ? fallbackTitle : undefined
  );
  return toast({
    variant: 'destructive',
    title: fallbackTitle?.trim() && /[\u0600-\u06FF]/.test(fallbackTitle)
      ? fallbackTitle.trim()
      : 'خطا',
    description: message,
    duration: 5600,
  });
}

export function notifyInfo(titleOrOptions?: string | NotifyOptions, description?: string) {
  const opts = normalize(titleOrOptions, description);
  return toast({
    variant: 'info',
    title: toUserFacingMessage(opts.title ?? 'اطلاع‌رسانی', 'info'),
    description: opts.description ? toUserFacingMessage(opts.description, 'info') : undefined,
    duration: opts.duration ?? 4500,
  });
}

function normalize(
  titleOrOptions?: string | NotifyOptions,
  description?: string
): NotifyOptions {
  if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
    return titleOrOptions;
  }
  return {
    title: titleOrOptions,
    description,
  };
}
