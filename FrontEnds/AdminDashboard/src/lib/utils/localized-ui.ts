import type {
  SeminarClassSchedule,
  SeminarPaymentPlan,
  SeminarPaymentTransaction,
  SeminarPlanHistoryItem,
  SeminarRoomRole,
} from '@/lib/types';

type TranslationValue = string | number | boolean | null | undefined;
export type TranslateFn = (key: string, params?: Record<string, TranslationValue>) => string;

export function getIntlLocale(locale: string) {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}

export function formatLocalizedDate(
  value: string | Date | null | undefined,
  locale: string,
  t: TranslateFn
) {
  if (!value) return t('not_available');

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return t('not_available');

  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-persian' : getIntlLocale(locale), {
    dateStyle: 'long',
  }).format(date);
}

export function formatLocalizedDateTime(
  value: string | Date | null | undefined,
  locale: string,
  t: TranslateFn
) {
  if (!value) return t('not_available');

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return t('not_available');

  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-persian' : getIntlLocale(locale), {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

export function formatLocalizedNumber(value: number, locale: string) {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function formatLocalizedCurrency(amount: number, locale: string, t: TranslateFn) {
  return `${formatLocalizedNumber(Math.round(amount), locale)} ${t('currency_toman')}`;
}

export function getSeminarRoleLabel(role: SeminarRoomRole, t: TranslateFn) {
  const keyByRole: Record<SeminarRoomRole, string> = {
    organizer: 'seminar_role_organizer',
    admin: 'seminar_role_admin',
    presenter: 'seminar_role_presenter',
    participant: 'seminar_role_participant',
    guest: 'seminar_role_guest',
  };

  return t(keyByRole[role]);
}

export function getSeminarPlanStatusLabel(
  status: SeminarPaymentPlan['status'] | SeminarPlanHistoryItem['status'],
  t: TranslateFn
) {
  switch (status) {
    case 'Active':
      return t('seminar_plan_status_active');
    case 'Pending Payment':
      return t('seminar_plan_status_pending_payment');
    case 'Overdue':
      return t('seminar_plan_status_overdue');
    case 'Suspended':
      return t('seminar_plan_status_suspended');
    case 'Settled':
      return t('seminar_plan_status_settled');
    case 'Expired':
      return t('seminar_plan_status_expired');
    case 'Canceled':
      return t('seminar_plan_status_canceled');
    default:
      return status;
  }
}

export function getSeminarPaymentStatusLabel(
  status: SeminarPaymentTransaction['status'],
  t: TranslateFn
) {
  switch (status) {
    case 'Completed':
      return t('payment_status_completed');
    case 'Pending':
      return t('payment_status_pending');
    case 'Failed':
      return t('payment_status_failed');
    default:
      return status;
  }
}

export function getSeminarClassStatusLabel(
  status: SeminarClassSchedule['status'],
  t: TranslateFn
) {
  switch (status) {
    case 'completed':
      return t('class_status_completed');
    case 'pending':
      return t('class_status_pending');
    default:
      return status;
  }
}

export function getRoomStatusLabel(status: number | string, t: TranslateFn) {
  if (status === 1 || status === '1' || status === 'Active') return t('status_active');
  if (status === 2 || status === '2' || status === 'Inactive') return t('status_inactive');
  if (status === 3 || status === '3' || status === 'Suspended') return t('seminar_plan_status_suspended');
  return String(status);
}

export function getRoomFileTypeLabel(fileType: number, t: TranslateFn) {
  if (fileType === 1) return t('room_file_type_video');
  if (fileType === 2) return t('room_file_type_audio');
  if (fileType === 3) return t('room_file_type_slide');
  if (fileType === 4) return t('room_file_type_recording');
  if (fileType === 5) return t('room_file_type_shared_file');
  return t('room_file_type_unknown');
}
