'use client';

import { useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  FolderDown,
  GraduationCap,
  Loader2,
  MessageSquare,
  Phone,
  Save,
  Settings2,
  Shield,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES,
  getNotificationSettings,
  upsertNotificationSettings,
  type EducationPlanInstallmentReminderRule,
  type NotificationSettingsPayload,
} from '@/services/notification-settings-api.service';
import { playNotificationSound } from '@/lib/notification-sound';
import * as React from "react";

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 px-4 py-3">
      <Label className="cursor-pointer font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function parseReminderOffsets(json: string | undefined): number[] {
  if (!json?.trim()) return [60, 30];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [60, 30];
    return parsed
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0 && v <= 10080)
      .slice(0, 10);
  } catch {
    return [60, 30];
  }
}

function parseInstallmentReminderRules(json: string | undefined): EducationPlanInstallmentReminderRule[] {
  if (!json?.trim()) return DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES;
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES;
    }
    return parsed
      .map((row) => {
        const item = row as Record<string, unknown>;
        return {
          offsetDays: Number(item.offsetDays ?? 0),
          sendStudentSms: Boolean(item.sendStudentSms),
          sendStudentEmail: Boolean(item.sendStudentEmail),
          sendTeacherEmail: Boolean(item.sendTeacherEmail),
        };
      })
      .filter((row) => Number.isFinite(row.offsetDays))
      .slice(0, 12);
  } catch {
    return DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES;
  }
}

function describeOffsetDays(offsetDays: number): string {
  if (offsetDays < 0) return `${Math.abs(offsetDays)} روز قبل از سررسید`;
  if (offsetDays > 0) return `${offsetDays} روز بعد از سررسید`;
  return 'روز سررسید';
}

export function NotificationSettingsForm() {
  const { t , direction } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [credit, setCredit] = useState<number | null>(null);
  const [form, setForm] = useState<NotificationSettingsPayload>({
    isEnabled: false,
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
    educationPlanInstallmentReminderRulesJson: JSON.stringify(DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES),
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
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [calendarReminderOffsets, setCalendarReminderOffsets] = useState<number[]>([60, 30]);
  const [installmentReminderRules, setInstallmentReminderRules] = useState<EducationPlanInstallmentReminderRule[]>(
    DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES
  );

  useEffect(() => {
    void getNotificationSettings()
      .then((data) => {
        setHasApiKey(data.hasApiKey);
        setCredit(data.credit ?? null);
        setForm({
          isEnabled: data.isEnabled,
          lineNumber: data.lineNumber,
          registrationOtpEnabled: data.registrationOtpEnabled,
          registrationVerifyTemplateId: data.registrationVerifyTemplateId,
          phoneChangeOtpEnabled: data.phoneChangeOtpEnabled,
          phoneChangeVerifyTemplateId: data.phoneChangeVerifyTemplateId,
          educationPlanSmsEnabled: data.educationPlanSmsEnabled,
          educationPlanVerifyTemplateId: data.educationPlanVerifyTemplateId ?? 0,
          educationPlanMessageTemplate: data.educationPlanMessageTemplate ?? '',
          educationPlanRemovedVerifyTemplateId: data.educationPlanRemovedVerifyTemplateId ?? 0,
          educationPlanRemovedMessageTemplate: data.educationPlanRemovedMessageTemplate ?? '',
          educationPlanInstallmentDueVerifyTemplateId: data.educationPlanInstallmentDueVerifyTemplateId ?? 0,
          educationPlanInstallmentDueMessageTemplate: data.educationPlanInstallmentDueMessageTemplate ?? '',
          educationPlanInstallmentReminderRulesJson:
            data.educationPlanInstallmentReminderRulesJson ??
            JSON.stringify(DEFAULT_EDUCATION_PLAN_INSTALLMENT_REMINDER_RULES),
          supportChatSmsEnabled: data.supportChatSmsEnabled ?? false,
          supportChatVerifyTemplateId: data.supportChatVerifyTemplateId ?? 0,
          supportChatMessageTemplate: data.supportChatMessageTemplate ?? '',
          supportChatStudentUnreadVerifyTemplateId: data.supportChatStudentUnreadVerifyTemplateId ?? 0,
          supportChatStudentUnreadMessageTemplate: data.supportChatStudentUnreadMessageTemplate ?? '',
          supportChatUnreadSmsDelayMinutes: data.supportChatUnreadSmsDelayMinutes ?? 20,
          supportChatNotificationSoundKey: data.supportChatNotificationSoundKey ?? 'chime',
          studentSharedFileSmsEnabled: data.studentSharedFileSmsEnabled ?? false,
          studentSharedFileVerifyTemplateId: data.studentSharedFileVerifyTemplateId ?? 0,
          studentSharedFileMessageTemplate: data.studentSharedFileMessageTemplate ?? '',
          teacherSharedFileDownloadedEnabled: data.teacherSharedFileDownloadedEnabled ?? false,
          teacherSharedFileDownloadedVerifyTemplateId: data.teacherSharedFileDownloadedVerifyTemplateId ?? 0,
          teacherSharedFileDownloadedMessageTemplate:
            data.teacherSharedFileDownloadedMessageTemplate ??
            'دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد.',
          calendarEventSmsEnabled: data.calendarEventSmsEnabled ?? false,
          calendarEventVerifyTemplateId: data.calendarEventVerifyTemplateId ?? 0,
          calendarEventMessageTemplate: data.calendarEventMessageTemplate ?? '',
          calendarEventReminderMinutesJson: data.calendarEventReminderMinutesJson ?? '[60,30]',
          otpExpiryMinutes: data.otpExpiryMinutes,
          otpResendCooldownSeconds: data.otpResendCooldownSeconds,
        });
        setCalendarReminderOffsets(parseReminderOffsets(data.calendarEventReminderMinutesJson));
        setInstallmentReminderRules(parseInstallmentReminderRules(data.educationPlanInstallmentReminderRulesJson));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await upsertNotificationSettings({
        ...form,
        calendarEventReminderMinutesJson: JSON.stringify(
          [...calendarReminderOffsets]
            .filter((m) => m > 0)
            .sort((a, b) => b - a)
        ),
        educationPlanInstallmentReminderRulesJson: JSON.stringify(
          installmentReminderRules
            .filter((rule) => rule.sendStudentSms || rule.sendStudentEmail || rule.sendTeacherEmail)
            .sort((a, b) => a.offsetDays - b.offsetDays)
        ),
        apiKey: apiKeyInput.trim() || undefined,
      });
      toast({ title: t('toast_settings_saved_title'), description: t('notification_settings_saved') });
      setApiKeyInput('');
      const refreshed = await getNotificationSettings();
      setHasApiKey(refreshed.hasApiKey);
      setCredit(refreshed.credit ?? null);
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('notification_settings_save_failed') });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('nav_settings_notifications')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('notification_settings_description')}</p>
          </div>
        </div>
        {credit != null && (
          <Badge variant="secondary" className="self-start px-3 py-1.5 text-sm">
            {t('notification_settings_credit')}: {credit}
          </Badge>
        )}
      </div>

      <Tabs dir={direction} defaultValue="connection" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
          <TabsTrigger value="connection" className="gap-2">
            <Smartphone className="h-4 w-4" />
            {t('notification_settings_tab_connection')}
          </TabsTrigger>
          <TabsTrigger value="auth" className="gap-2">
            <Shield className="h-4 w-4" />
            {t('notification_settings_tab_auth')}
          </TabsTrigger>
          <TabsTrigger value="education" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            {t('notification_settings_tab_education')}
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('notification_settings_tab_support')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t('notification_settings_tab_calendar')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <SettingsSection icon={Settings2} title={t('notification_settings_sms_ir_title')} description={t('notification_settings_sms_ir_desc')}>
            <div  className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_enabled')}</Label>
              <Switch
                  dir='ltr'
                  checked={form.isEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">{t('notification_settings_api_key')}</Label>
              <Input
                id="apiKey"
                type="password"
                dir={direction}
                placeholder={hasApiKey ? t('notification_settings_api_key_saved') : t('notification_settings_api_key_placeholder')}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lineNumber">{t('notification_settings_line_number')}</Label>
              <Input
                id="lineNumber"
                dir={direction}
                value={form.lineNumber || ''}
                onChange={(e) => setForm((f) => ({ ...f, lineNumber: Number(e.target.value) || 0 }))}
              />
            </div>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <SettingsSection icon={Shield} title={t('notification_settings_registration_title')}>
            <div  className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_registration_enabled')}</Label>
              <Switch
                  dir='ltr'
                  checked={form.registrationOtpEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, registrationOtpEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_registration_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.registrationVerifyTemplateId || ''}
                onChange={(e) => setForm((f) => ({ ...f, registrationVerifyTemplateId: Number(e.target.value) || 0 }))}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={Phone} title={t('notification_settings_phone_change_title')}>
            <div  className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_phone_change_enabled')}</Label>
              <Switch
                  dir='ltr'
                  checked={form.phoneChangeOtpEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, phoneChangeOtpEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_phone_change_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.phoneChangeVerifyTemplateId || ''}
                onChange={(e) => setForm((f) => ({ ...f, phoneChangeVerifyTemplateId: Number(e.target.value) || 0 }))}
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={Settings2} title={t('notification_settings_otp_timing_title')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('notification_settings_otp_expiry_minutes')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  dir="ltr"
                  value={form.otpExpiryMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, otpExpiryMinutes: Number(e.target.value) || 10 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('notification_settings_otp_resend_seconds')}</Label>
                <Input
                  type="number"
                  min={30}
                  max={600}
                  dir="ltr"
                  value={form.otpResendCooldownSeconds}
                  onChange={(e) => setForm((f) => ({ ...f, otpResendCooldownSeconds: Number(e.target.value) || 120 }))}
                />
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <SettingsSection icon={GraduationCap} title={t('notification_settings_education_plan_title')} description={t('notification_settings_education_plan_desc')}>
            <div  className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_education_plan_enabled')}</Label>
              <Switch
                  dir='ltr'
                  checked={form.educationPlanSmsEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, educationPlanSmsEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_education_plan_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.educationPlanVerifyTemplateId || ''}
                onChange={(e) => setForm((f) => ({ ...f, educationPlanVerifyTemplateId: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_education_plan_template_params')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_education_plan_message_template')}</Label>
              <Textarea
                dir="ltr"
                rows={4}
                value={form.educationPlanMessageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, educationPlanMessageTemplate: e.target.value }))}
                placeholder="{StudentName}، پلن «{PlanTitle}» توسط استاد {TeacherName} برای شما فعال شد."
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_education_plan_message_params')}</p>
            </div>
          </SettingsSection>

          <SettingsSection icon={BookOpen} title={t('notification_settings_education_plan_removed_title')} description={t('notification_settings_education_plan_removed_desc')}>
            <div className="space-y-2">
              <Label>{t('notification_settings_education_plan_removed_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.educationPlanRemovedVerifyTemplateId || ''}
                onChange={(e) => setForm((f) => ({ ...f, educationPlanRemovedVerifyTemplateId: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_education_plan_removed_template_params')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_education_plan_removed_message_template')}</Label>
              <Textarea
                dir="ltr"
                rows={4}
                value={form.educationPlanRemovedMessageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, educationPlanRemovedMessageTemplate: e.target.value }))}
                placeholder="{StudentName}، پلن «{PlanTitle}» توسط استاد {TeacherName} حذف شد."
              />
            </div>
          </SettingsSection>

          <SettingsSection icon={GraduationCap} title={t('notification_settings_education_plan_installment_due_title')} description={t('notification_settings_education_plan_installment_due_desc')}>
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label className="text-sm font-medium">زمان‌بندی یادآوری اقساط</Label>
                  <p className="text-xs text-muted-foreground">
                    عدد منفی = قبل از سررسید، ۰ = روز سررسید، مثبت = بعد از سررسید. برای استاد فقط ایمیل ارسال می‌شود.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={installmentReminderRules.length >= 12}
                  onClick={() =>
                    setInstallmentReminderRules((prev) => [
                      ...prev,
                      { offsetDays: -1, sendStudentSms: true, sendStudentEmail: true, sendTeacherEmail: true },
                    ])
                  }
                >
                  افزودن زمان
                </Button>
              </div>
              {installmentReminderRules.length === 0 ? (
                <p className="text-xs text-muted-foreground">هنوز قانونی تعریف نشده است.</p>
              ) : null}
              <div className="space-y-3">
                {installmentReminderRules.map((rule, index) => (
                  <div key={`${rule.offsetDays}-${index}`} className="space-y-3 rounded-md border bg-muted/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary">{describeOffsetDays(rule.offsetDays)}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setInstallmentReminderRules((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        حذف
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>فاصله از سررسید (روز)</Label>
                        <Input
                          dir="ltr"
                          type="number"
                          value={rule.offsetDays}
                          onChange={(e) => {
                            const offsetDays = Number(e.target.value);
                            setInstallmentReminderRules((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, offsetDays: Number.isFinite(offsetDays) ? offsetDays : 0 }
                                  : item
                              )
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2 pt-6">
                        <ToggleRow
                          label="پیامک به دانشجو"
                          checked={rule.sendStudentSms}
                          onCheckedChange={(v) =>
                            setInstallmentReminderRules((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, sendStudentSms: v } : item))
                            )
                          }
                        />
                        <ToggleRow
                          label="ایمیل به دانشجو"
                          checked={rule.sendStudentEmail}
                          onCheckedChange={(v) =>
                            setInstallmentReminderRules((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, sendStudentEmail: v } : item))
                            )
                          }
                        />
                        <ToggleRow
                          label="ایمیل به استاد"
                          checked={rule.sendTeacherEmail}
                          onCheckedChange={(v) =>
                            setInstallmentReminderRules((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, sendTeacherEmail: v } : item))
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                قالب ایمیل دانشجو/استاد از بخش «قالب‌های ایمیل» با کلیدهای education_plan_installment_due_student و
                education_plan_installment_due_teacher قابل ویرایش است.
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_education_plan_installment_due_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.educationPlanInstallmentDueVerifyTemplateId || ''}
                onChange={(e) => setForm((f) => ({ ...f, educationPlanInstallmentDueVerifyTemplateId: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                پارامترهای پیشنهادی: FULLNAME, TITLE, INSTALLMENT, AMOUNT, DUEDATE, DAYS
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_education_plan_installment_due_message_template')}</Label>
              <Textarea
                dir="rtl"
                rows={4}
                value={form.educationPlanInstallmentDueMessageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, educationPlanInstallmentDueMessageTemplate: e.target.value }))}
                placeholder="دانشجوی گرامی #FULLNAME#، تاریخ پرداخت قسط #INSTALLMENT# پلن «#TITLE#» ..."
              />
              <p className="text-xs text-muted-foreground">
                متغیرها: #FULLNAME# #TITLE# #INSTALLMENT# #AMOUNT# #DUEDATE# #DAYSTEXT# #DAYS#
              </p>
            </div>
          </SettingsSection>

          <SettingsSection icon={FolderDown} title={t('notification_settings_student_shared_file_title')} description={t('notification_settings_student_shared_file_desc')}>
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_student_shared_file_enabled')}</Label>
              <Switch
                dir="ltr"
                checked={form.studentSharedFileSmsEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, studentSharedFileSmsEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_student_shared_file_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.studentSharedFileVerifyTemplateId || ''}
                onChange={(e) => setForm((f) => ({ ...f, studentSharedFileVerifyTemplateId: Number(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_student_shared_file_template_params')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_student_shared_file_message_template')}</Label>
              <Textarea
                dir="rtl"
                rows={5}
                value={form.studentSharedFileMessageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, studentSharedFileMessageTemplate: e.target.value }))}
                placeholder={'فایل جلسه با عنوان #TITLE# برای شما بارگذاری شد. 📥\nبرای دانلود، به بخش "داشبورد" و سپس "فایل‌های اشتراکی" مراجعه نمایید.\n تیم پشتیبانی آرکا نرم‌افزار'}
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_student_shared_file_message_params')}</p>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={FolderDown}
            title={t('notification_settings_teacher_shared_file_downloaded_title')}
            description={t('notification_settings_teacher_shared_file_downloaded_desc')}
          >
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_teacher_shared_file_downloaded_enabled')}</Label>
              <Switch
                dir="ltr"
                checked={form.teacherSharedFileDownloadedEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, teacherSharedFileDownloadedEnabled: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_teacher_shared_file_downloaded_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.teacherSharedFileDownloadedVerifyTemplateId || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    teacherSharedFileDownloadedVerifyTemplateId: Number(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {t('notification_settings_teacher_shared_file_downloaded_template_params')}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('notification_settings_teacher_shared_file_downloaded_message_template')}</Label>
              <Textarea
                dir="rtl"
                rows={3}
                value={form.teacherSharedFileDownloadedMessageTemplate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, teacherSharedFileDownloadedMessageTemplate: e.target.value }))
                }
                placeholder="دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد."
              />
              <p className="text-xs text-muted-foreground">
                {t('notification_settings_teacher_shared_file_downloaded_message_params')}
              </p>
            </div>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <SettingsSection icon={MessageSquare} title={t('notification_settings_support_chat_title')} description={t('notification_settings_support_chat_desc')}>
            <div  className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_support_chat_enabled')}</Label>
              <Switch
                  dir='ltr'
                  checked={form.supportChatSmsEnabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, supportChatSmsEnabled: v }))}
              />
            </div>

            <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
              <div>
                <p className="font-medium">{t('notification_settings_support_chat_teacher_title')}</p>
                <p className="text-xs text-muted-foreground">{t('notification_settings_support_chat_teacher_desc')}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t('notification_settings_support_chat_template_id')}</Label>
                <Input
                  dir="ltr"
                  value={form.supportChatVerifyTemplateId || ''}
                  onChange={(e) => setForm((f) => ({ ...f, supportChatVerifyTemplateId: Number(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">{t('notification_settings_support_chat_teacher_template_params')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('notification_settings_support_chat_message_template')}</Label>
                <Textarea
                  dir="ltr"
                  rows={3}
                  value={form.supportChatMessageTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, supportChatMessageTemplate: e.target.value }))}
                  placeholder="دانشجوی #FULLNAME# یک سوال با عنوان #TITLE# در پشتیبانی طرح کرده و منتظر پاسخ است..."
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
              <div>
                <p className="font-medium">{t('notification_settings_support_chat_student_title')}</p>
                <p className="text-xs text-muted-foreground">{t('notification_settings_support_chat_student_desc')}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t('notification_settings_support_chat_student_template_id')}</Label>
                <Input
                  dir="ltr"
                  value={form.supportChatStudentUnreadVerifyTemplateId || ''}
                  onChange={(e) => setForm((f) => ({ ...f, supportChatStudentUnreadVerifyTemplateId: Number(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">{t('notification_settings_support_chat_student_template_params')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('notification_settings_support_chat_student_message_template')}</Label>
                <Textarea
                  dir="ltr"
                  rows={3}
                  value={form.supportChatStudentUnreadMessageTemplate}
                  onChange={(e) => setForm((f) => ({ ...f, supportChatStudentUnreadMessageTemplate: e.target.value }))}
                  placeholder="استاد #FULLNAME# به سوال #TITLE# پاسخ داده است..."
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('notification_settings_support_chat_sms_delay')}</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  dir="ltr"
                  value={form.supportChatUnreadSmsDelayMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, supportChatUnreadSmsDelayMinutes: Number(e.target.value) || 20 }))}
                />
                <p className="text-xs text-muted-foreground">{t('notification_settings_support_chat_sms_delay_desc')}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('notification_settings_support_chat_sound')}</Label>
                <div className="flex gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.supportChatNotificationSoundKey}
                    onChange={(e) => setForm((f) => ({ ...f, supportChatNotificationSoundKey: e.target.value }))}
                  >
                    <option value="chime">{t('notification_settings_sound_chime')}</option>
                    <option value="bell">{t('notification_settings_sound_bell')}</option>
                    <option value="pop">{t('notification_settings_sound_pop')}</option>
                    <option value="ping">{t('notification_settings_sound_ping')}</option>
                    <option value="soft">{t('notification_settings_sound_soft')}</option>
                  </select>
                  <Button type="button" variant="outline" onClick={() => playNotificationSound()}>
                    {t('notification_settings_sound_preview')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('notification_settings_support_chat_sound_desc')}</p>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <SettingsSection
            icon={Calendar}
            title={t('notification_settings_calendar_title')}
            description={t('notification_settings_calendar_desc')}
          >
            <div className="flex items-center justify-between rounded-md border p-2">
              <Label className="text-x">{t('notification_settings_calendar_enabled')}</Label>
              <Switch
                dir="ltr"
                checked={form.calendarEventSmsEnabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, calendarEventSmsEnabled: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('notification_settings_calendar_template_id')}</Label>
              <Input
                dir="ltr"
                value={form.calendarEventVerifyTemplateId || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calendarEventVerifyTemplateId: Number(e.target.value) || 0 }))
                }
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_calendar_template_params')}</p>
            </div>

            <div className="space-y-2">
              <Label>{t('notification_settings_calendar_message_template')}</Label>
              <Textarea
                dir="rtl"
                rows={4}
                value={form.calendarEventMessageTemplate}
                onChange={(e) => setForm((f) => ({ ...f, calendarEventMessageTemplate: e.target.value }))}
                placeholder="یادآور آرکا نرم افزار: رویداد شما با عنوان #TITLE# در تاریخ #DATE#، ساعت #TIME# برگزار خواهد شد. تیم پشتیبانی آرکا نرم‌افزار"
              />
              <p className="text-xs text-muted-foreground">{t('notification_settings_calendar_message_params')}</p>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{t('notification_settings_calendar_reminders_title')}</p>
                  <p className="text-xs text-muted-foreground">{t('notification_settings_calendar_reminders_desc')}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={calendarReminderOffsets.length >= 10}
                  onClick={() => setCalendarReminderOffsets((prev) => [...prev, 30])}
                >
                  {t('notification_settings_calendar_add_reminder')}
                </Button>
              </div>

              {calendarReminderOffsets.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('notification_settings_calendar_no_reminders')}</p>
              )}

              <div className="space-y-2">
                {calendarReminderOffsets.map((minutes, index) => (
                  <div key={`${index}-${minutes}`} className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={10080}
                      dir="ltr"
                      className="max-w-[140px]"
                      value={minutes}
                      onChange={(e) => {
                        const next = Number(e.target.value) || 0;
                        setCalendarReminderOffsets((prev) =>
                          prev.map((m, i) => (i === index ? next : m))
                        );
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {t('notification_settings_calendar_minutes_before')}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCalendarReminderOffsets((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      {t('actions_delete')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-10 -mx-3 mt-8 border-t bg-background/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-5xl justify-end">
          <Button type="button" size="lg" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ms-2">{t('save_changes')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
