import apiClient from '@/lib/apiClient';

export type EducationPlanInstallmentReminderRule = {
  offsetDays: number;
  sendStudentSms: boolean;
  sendStudentEmail: boolean;
  sendTeacherEmail: boolean;
};

export const DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES: EducationPlanInstallmentReminderRule[] = [
  { offsetDays: -1, sendStudentSms: true, sendStudentEmail: true, sendTeacherEmail: true },
  { offsetDays: 0, sendStudentSms: true, sendStudentEmail: true, sendTeacherEmail: false },
];

export type NotificationSettingsPayload = {
  isEnabled: boolean;
  apiKey?: string;
  lineNumber: number;
  registrationOtpEnabled: boolean;
  registrationVerifyTemplateId: number;
  phoneChangeOtpEnabled: boolean;
  phoneChangeVerifyTemplateId: number;
  educationPlanSmsEnabled: boolean;
  educationPlanVerifyTemplateId: number;
  educationPlanMessageTemplate: string;
  educationPlanRemovedVerifyTemplateId: number;
  educationPlanRemovedMessageTemplate: string;
  educationPlanInstallmentDueVerifyTemplateId: number;
  educationPlanInstallmentDueMessageTemplate: string;
  educationPlanInstallmentReminderRulesJson: string;
  supportChatSmsEnabled: boolean;
  supportChatVerifyTemplateId: number;
  supportChatMessageTemplate: string;
  supportChatStudentUnreadVerifyTemplateId: number;
  supportChatStudentUnreadMessageTemplate: string;
  supportChatUnreadSmsDelayMinutes: number;
  supportChatNotificationSoundKey: string;
  studentSharedFileSmsEnabled: boolean;
  studentSharedFileVerifyTemplateId: number;
  studentSharedFileMessageTemplate: string;
  teacherSharedFileDownloadedEnabled: boolean;
  teacherSharedFileDownloadedVerifyTemplateId: number;
  teacherSharedFileDownloadedMessageTemplate: string;
  calendarEventSmsEnabled: boolean;
  calendarEventVerifyTemplateId: number;
  calendarEventMessageTemplate: string;
  calendarEventReminderMinutesJson: string;
  otpExpiryMinutes: number;
  otpResendCooldownSeconds: number;
};

export type NotificationSettingsResponse = NotificationSettingsPayload & {
  hasApiKey: boolean;
  credit?: number | null;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
  const res = await apiClient.get<unknown>('/NotificationSettings/Get');
  return unwrap<NotificationSettingsResponse>(res.data) ?? {
    isEnabled: false,
    hasApiKey: false,
    lineNumber: 0,
    registrationOtpEnabled: false,
    registrationVerifyTemplateId: 0,
    phoneChangeOtpEnabled: false,
    phoneChangeVerifyTemplateId: 0,
    educationPlanSmsEnabled: false,
    educationPlanVerifyTemplateId: 0,
    educationPlanMessageTemplate: '',
    educationPlanRemovedVerifyTemplateId: 0,
    educationPlanRemovedMessageTemplate: '',
    educationPlanInstallmentDueVerifyTemplateId: 0,
    educationPlanInstallmentDueMessageTemplate: '',
    educationPlanInstallmentReminderRulesJson: JSON.stringify([
      { offsetDays: -1, sendStudentSms: true, sendStudentEmail: true, sendTeacherEmail: true },
      { offsetDays: 0, sendStudentSms: true, sendStudentEmail: true, sendTeacherEmail: false },
    ]),
    supportChatSmsEnabled: false,
    supportChatVerifyTemplateId: 0,
    supportChatMessageTemplate: '',
    supportChatStudentUnreadVerifyTemplateId: 0,
    supportChatStudentUnreadMessageTemplate: '',
    supportChatUnreadSmsDelayMinutes: 20,
    supportChatNotificationSoundKey: 'chime',
    studentSharedFileSmsEnabled: false,
    studentSharedFileVerifyTemplateId: 0,
    studentSharedFileMessageTemplate: '',
    teacherSharedFileDownloadedEnabled: false,
    teacherSharedFileDownloadedVerifyTemplateId: 0,
    teacherSharedFileDownloadedMessageTemplate: 'دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد.',
    calendarEventSmsEnabled: false,
    calendarEventVerifyTemplateId: 0,
    calendarEventMessageTemplate: '',
    calendarEventReminderMinutesJson: '[60,30]',
    otpExpiryMinutes: 10,
    otpResendCooldownSeconds: 120,
  };
}

export async function upsertNotificationSettings(payload: NotificationSettingsPayload): Promise<void> {
  await apiClient.post('/NotificationSettings/Upsert', payload);
}
