'use client';

import * as React from 'react';
import {
  Loader2,
  Copy,
  RefreshCw,
  Ban,
  CalendarPlus,
  Plus,
  MonitorSmartphone,
  KeyRound,
  ShieldCheck,
  Clock3,
  ChevronDown,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import {
  createStudentDesktopLicense,
  deleteStudentDesktopLicense,
  getLicenseDevices,
  getStudentDesktopLicenses,
  regenerateStudentDesktopLicense,
  renewStudentDesktopLicense,
  resetLicenseDevices,
  revokeLicenseDevice,
  revokeStudentDesktopLicense,
  updateLicenseLimits,
  type LicenseDeviceBinding,
  type StudentDesktopLicense,
} from '@/services/desktop-license-api.service';

type Props = {
  userId: string | number;
  studentId?: string | number;
  allowCreate?: boolean;
};

function formatExpiry(value?: string | null, locale?: string) {
  if (!value) return locale === 'fa' ? 'بدون انقضا' : 'No expiry';
  try {
    return new Date(value).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US');
  } catch {
    return value;
  }
}

export function DesktopLicenseManager({ userId, studentId, allowCreate = true }: Props) {
  const { t, locale, direction } = useLanguage();
  const isFa = locale === 'fa';
  const { toast } = useToast();
  const [items, setItems] = React.useState<StudentDesktopLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [newCourseId, setNewCourseId] = React.useState('');
  const [newExpiresAt, setNewExpiresAt] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [devicesByEnrollment, setDevicesByEnrollment] = React.useState<
    Record<number, LicenseDeviceBinding[]>
  >({});
  const [maxDevicesDraft, setMaxDevicesDraft] = React.useState<Record<number, number>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await getStudentDesktopLicenses({ userId, studentId });
      setItems(list);
      setMaxDevicesDraft((prev) => {
        const next = { ...prev };
        for (const row of list) {
          next[row.enrollmentId] = row.maxDevices || 1;
        }
        return next;
      });
    } catch {
      setItems([]);
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: t('desktop_license_load_failed') ?? 'Could not load desktop licenses.',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, studentId, t, toast]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const loadDevices = async (enrollmentId: number) => {
    try {
      const devices = await getLicenseDevices(enrollmentId);
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: devices }));
    } catch {
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: [] }));
    }
  };

  const toggleExpand = async (enrollmentId: number) => {
    if (expandedId === enrollmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(enrollmentId);
    if (!devicesByEnrollment[enrollmentId]) {
      await loadDevices(enrollmentId);
    }
  };

  const copyKey = async (key?: string | null) => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    toast({ title: t('desktop_license_copied') ?? 'License copied.' });
  };

  const handleCreate = async () => {
    const courseId = Number(newCourseId);
    if (!courseId) return;
    setBusyId(-1);
    try {
      await createStudentDesktopLicense({
        userId: String(userId),
        courseId,
        expiresAtUtc: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
      });
      setNewCourseId('');
      setNewExpiresAt('');
      await load();
      toast({ title: t('desktop_license_created') ?? 'Desktop license created.' });
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: t('desktop_license_create_failed') ?? 'Could not create license.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const runAction = async (
    enrollmentId: number,
    action: 'revoke' | 'renew' | 'regenerate',
    expiresAt?: string
  ) => {
    setBusyId(enrollmentId);
    try {
      if (action === 'revoke') await revokeStudentDesktopLicense(enrollmentId);
      else if (action === 'renew') {
        await renewStudentDesktopLicense({
          enrollmentId,
          expiresAtUtc: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
      } else {
        await regenerateStudentDesktopLicense({
          enrollmentId,
          expiresAtUtc: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
      }
      await load();
      if (expandedId === enrollmentId) await loadDevices(enrollmentId);
      toast({ title: t('desktop_license_updated') ?? 'License updated.' });
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: t('desktop_license_action_failed') ?? 'Action failed.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResetDevices = async (enrollmentId: number, courseTitle: string) => {
    const ok = window.confirm(
      isFa
        ? `همه دستگاه‌های فعال، توکن‌های پخش و قفل نشست لایسنس «${courseTitle}» پاک می‌شوند تا دانشجو بتواند دوباره (مثلاً بعد از نصب مجدد ویندوز) فعال‌سازی کند. سیستم کاملاً جدید فقط اگر اسلات آزاد باشد پذیرفته می‌شود. ادامه می‌دهید؟`
        : `Clear all active devices, playback tokens, and session locks for “${courseTitle}” so the student can activate again (e.g. after Windows reinstall). A brand-new PC is only accepted if a device slot is free. Continue?`
    );
    if (!ok) return;

    setBusyId(enrollmentId);
    try {
      await resetLicenseDevices({
        enrollmentId,
        reason: isFa ? 'ریست دستگاه‌ها توسط ادمین' : 'Devices reset by admin',
      });
      await loadDevices(enrollmentId);
      await load();
      toast({
        title: isFa ? 'دستگاه‌ها ریست شدند' : 'Devices reset',
        description: isFa
          ? 'توکن‌های پخش باطل شدند و اسلات دستگاه‌ها آزاد شد. دانشجو می‌تواند با لایسنس قبلی روی همین سیستم (حتی بعد از نصب مجدد ویندوز) دوباره فعال کند. سیستم کاملاً جدید فقط در حد تعداد مجاز دستگاه پذیرفته می‌شود.'
          : 'Playback tokens were invalidated and device slots freed. The student can reactivate the same license on this PC (including after Windows reinstall). A brand-new PC is only allowed within the max-device limit.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: isFa ? 'ریست دستگاه‌ها ناموفق بود.' : 'Could not reset devices.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteLicense = async (enrollmentId: number, courseTitle: string) => {
    const ok = window.confirm(
      isFa
        ? `لایسنس «${courseTitle}» برای همیشه از سیستم حذف می‌شود (کلید، دستگاه‌ها و توکن‌های پخش). این عمل برگشت‌پذیر نیست. ادامه می‌دهید؟`
        : `License for “${courseTitle}” will be permanently deleted (key, devices, and playback tokens). This cannot be undone. Continue?`
    );
    if (!ok) return;

    setBusyId(enrollmentId);
    try {
      await deleteStudentDesktopLicense(enrollmentId);
      if (expandedId === enrollmentId) setExpandedId(null);
      await load();
      toast({
        title: isFa ? 'لایسنس حذف شد' : 'License deleted',
        description: isFa
          ? 'کلید و همه وابستگی‌های لایسنس از سیستم پاک شد.'
          : 'The license key and all related bindings were removed.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: isFa ? 'حذف لایسنس ناموفق بود.' : 'Could not delete license.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeDevice = async (enrollmentId: number, deviceId: string) => {
    setBusyId(enrollmentId);
    try {
      await revokeLicenseDevice({ enrollmentId, deviceId });
      await loadDevices(enrollmentId);
      await load();
      toast({ title: isFa ? 'دستگاه لغو شد' : 'Device revoked' });
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: isFa ? 'لغو دستگاه ناموفق بود.' : 'Could not revoke device.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveMaxDevices = async (enrollmentId: number, allowedOs: number) => {
    const maxDevices = Math.max(1, Math.min(20, Number(maxDevicesDraft[enrollmentId]) || 1));
    setBusyId(enrollmentId);
    try {
      await updateLicenseLimits({ enrollmentId, maxDevices, allowedOs: allowedOs || 1 });
      setItems((prev) =>
        prev.map((row) => (row.enrollmentId === enrollmentId ? { ...row, maxDevices } : row))
      );
      toast({ title: isFa ? 'حداکثر دستگاه ذخیره شد' : 'Max devices saved' });
    } catch {
      toast({
        variant: 'destructive',
        title: t('toast_error_title'),
        description: isFa ? 'ذخیره محدودیت ناموفق بود.' : 'Could not save limits.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = items.filter((row) => row.isCurrentlyValid).length;
  const deviceSlots = items.reduce((sum, row) => sum + (row.maxDevices || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="relative border-b bg-[radial-gradient(120%_80%_at_0%_0%,hsl(var(--primary)/0.12),transparent_55%),linear-gradient(180deg,hsl(var(--muted)/0.55),hsl(var(--background)))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <MonitorSmartphone className="h-3.5 w-3.5" />
              {isFa ? 'مدیریت لایسنس ویندوز' : 'Windows license desk'}
            </div>
            <CardTitle className="text-xl tracking-tight">
              {t('desktop_license_title') ?? 'Desktop licenses'}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              {t('desktop_license_description') ??
                'Create, renew, reset devices, or regenerate desktop licenses for this student.'}
            </CardDescription>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-[240px]">
            <div className="rounded-xl border bg-background/90 px-3 py-2 text-center shadow-sm">
              <p className="text-[11px] text-muted-foreground">{isFa ? 'کل' : 'Total'}</p>
              <p className="text-lg font-semibold tabular-nums">{items.length}</p>
            </div>
            <div className="rounded-xl border bg-background/90 px-3 py-2 text-center shadow-sm">
              <p className="text-[11px] text-muted-foreground">{isFa ? 'فعال' : 'Active'}</p>
              <p className="text-lg font-semibold tabular-nums text-emerald-600">{activeCount}</p>
            </div>
            <div className="rounded-xl border bg-background/90 px-3 py-2 text-center shadow-sm">
              <p className="text-[11px] text-muted-foreground">{isFa ? 'اسلات' : 'Slots'}</p>
              <p className="text-lg font-semibold tabular-nums">{deviceSlots}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5">
        {allowCreate ? (
          <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.03] p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{isFa ? 'صدور لایسنس جدید' : 'Issue a new license'}</p>
                <p className="text-xs text-muted-foreground">
                  {isFa
                    ? 'شناسه دوره و در صورت نیاز تاریخ انقضا را وارد کنید.'
                    : 'Enter the course id and an optional expiry date.'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label>{t('desktop_license_course_id') ?? 'Course ID'}</Label>
                <Input
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  placeholder="123"
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('desktop_license_expires_at') ?? 'Expires at (optional)'}</Label>
                <Input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full md:w-auto"
                  onClick={() => void handleCreate()}
                  disabled={busyId === -1 || !newCourseId.trim()}
                >
                  {busyId === -1 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 me-2" />
                  )}
                  {t('desktop_license_create') ?? 'Create license'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <HardDrive className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
            <p className="text-sm font-medium">
              {t('desktop_license_empty') ?? 'No desktop licenses yet.'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isFa
                ? 'با فرم بالا می‌توانید اولین لایسنس را برای این دانشجو صادر کنید.'
                : 'Use the form above to issue the first license for this student.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((row) => {
              const devices = devicesByEnrollment[row.enrollmentId] ?? [];
              const expanded = expandedId === row.enrollmentId;
              const used = row.activeDeviceCount;
              const max = Math.max(1, row.maxDevices || 1);
              const usagePct = Math.min(100, Math.round((used / max) * 100));
              const busy = busyId === row.enrollmentId;

              return (
                <div
                  key={row.enrollmentId}
                  className={cn(
                    'overflow-hidden rounded-2xl border bg-card transition-shadow',
                    expanded && 'shadow-md ring-1 ring-primary/15'
                  )}
                >
                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">{row.courseTitle}</h3>
                        <Badge
                          variant={row.isCurrentlyValid ? 'default' : 'secondary'}
                          className={cn(
                            row.isCurrentlyValid &&
                              'bg-emerald-600 hover:bg-emerald-600 text-white border-transparent'
                          )}
                        >
                          {row.isCurrentlyValid
                            ? (t('status_active') ?? 'Active')
                            : (t('desktop_license_inactive') ?? 'Inactive / expired')}
                        </Badge>
                        {row.teacherName ? (
                          <Badge variant="outline" className="font-normal">
                            {row.teacherName}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatExpiry(row.desktopLicenseExpiresAtUtc, locale)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MonitorSmartphone className="h-3.5 w-3.5" />
                          {isFa ? `${used} از ${max} دستگاه` : `${used}/${max} devices`}
                        </span>
                        <span className="tabular-nums">#{row.courseId}</span>
                      </div>

                      <div className="flex max-w-xl items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5">
                        <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                          {row.desktopLicenseKey ?? '—'}
                        </code>
                        {row.desktopLicenseKey ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => void copyKey(row.desktopLicenseKey)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="max-w-xs space-y-1">
                        <Progress value={usagePct} className="h-1.5" />
                      </div>
                    </div>

                    <div className={cn('flex flex-wrap gap-1.5', direction === 'rtl' ? 'lg:justify-start' : 'lg:justify-end')}>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => void toggleExpand(row.enrollmentId)}
                      >
                        <MonitorSmartphone className="h-4 w-4 me-1" />
                        {isFa ? 'دستگاه‌ها' : 'Devices'}
                        <ChevronDown
                          className={cn(
                            'ms-1 h-3.5 w-3.5 transition-transform',
                            expanded && 'rotate-180'
                          )}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void runAction(row.enrollmentId, 'renew')}
                      >
                        <CalendarPlus className="h-4 w-4 me-1" />
                        {t('desktop_license_renew') ?? 'Renew'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void runAction(row.enrollmentId, 'regenerate')}
                      >
                        <RefreshCw className="h-4 w-4 me-1" />
                        {t('desktop_license_regenerate') ?? 'New key'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy || !row.isDesktopLicenseActive}
                        onClick={() => void runAction(row.enrollmentId, 'revoke')}
                      >
                        <Ban className="h-4 w-4 me-1" />
                        {t('desktop_license_revoke') ?? 'Revoke'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleDeleteLicense(row.enrollmentId, row.courseTitle)}
                      >
                        <Trash2 className="h-4 w-4 me-1" />
                        {isFa ? 'حذف کامل' : 'Delete'}
                      </Button>
                    </div>
                  </div>

                  {expanded ? (
                    <div className="border-t bg-muted/25 px-4 py-4">
                      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-background p-3">
                        <div className="space-y-1.5">
                          <Label className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {isFa ? 'حداکثر دستگاه' : 'Max devices'}
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            className="w-28"
                            value={maxDevicesDraft[row.enrollmentId] ?? row.maxDevices ?? 1}
                            onChange={(e) =>
                              setMaxDevicesDraft((prev) => ({
                                ...prev,
                                [row.enrollmentId]: Number(e.target.value) || 1,
                              }))
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void handleSaveMaxDevices(row.enrollmentId, row.allowedOs)}
                        >
                          {isFa ? 'ذخیره محدودیت' : 'Save limit'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void handleResetDevices(row.enrollmentId, row.courseTitle)}
                        >
                          <RefreshCw className="h-4 w-4 me-1" />
                          {isFa ? 'ریست همه دستگاه‌ها' : 'Reset all devices'}
                        </Button>
                      </div>

                      {devices.length === 0 ? (
                        <p className="rounded-xl border border-dashed bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
                          {isFa ? 'دستگاهی ثبت نشده است.' : 'No devices registered.'}
                        </p>
                      ) : (
                        <ul className="grid gap-2 md:grid-cols-2">
                          {devices.map((device) => (
                            <li
                              key={device.deviceId + String(device.activatedAtUtc ?? '')}
                              className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {device.machineName ?? device.deviceId}
                                </p>
                                <p className="truncate font-mono text-[11px] text-muted-foreground">
                                  {device.deviceId}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Badge variant={device.isActive ? 'default' : 'secondary'}>
                                  {device.isActive
                                    ? isFa
                                      ? 'فعال'
                                      : 'Active'
                                    : isFa
                                      ? 'لغو شده'
                                      : 'Revoked'}
                                </Badge>
                                {device.isActive ? (
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8"
                                    disabled={busy}
                                    onClick={() =>
                                      void handleRevokeDevice(row.enrollmentId, device.deviceId)
                                    }
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
