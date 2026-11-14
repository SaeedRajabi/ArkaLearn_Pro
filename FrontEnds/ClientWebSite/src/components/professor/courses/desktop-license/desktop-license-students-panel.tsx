'use client';

import * as React from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  RefreshCw,
  Save,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';
import type { CourseLessonQri, CourseSessionQri } from '@/lib/api/types';
import {
  getCourseLicenses,
  getLicenseDevices,
  getTeacherStudentSatisfaction,
  osFlagsHas,
  regenerateStudentDesktopLicense,
  renewStudentDesktopLicense,
  resetLicenseDevices,
  revokeLicenseDevice,
  revokeStudentDesktopLicense,
  toggleOsFlag,
  updateLicenseLessonAccess,
  updateLicenseLimits,
  upsertTeacherStudentSatisfaction,
  type CourseLicenseEnrollment,
  type LicenseDeviceBinding,
  type TeacherStudentSatisfaction,
} from '@/lib/api/desktop-licenses';
import { useToast } from '@/hooks/use-toast';

type CurriculumLesson = { lessonId: number; title: string; sectionTitle: string };

type Props = {
  courseId: number;
  isRtl: boolean;
  sections: CourseSessionQri[];
};

function buildCurriculum(sections: CourseSessionQri[]): CurriculumLesson[] {
  const items: CurriculumLesson[] = [];
  let fallbackId = 1;
  for (const section of sections) {
    for (const lesson of section.courseLessons ?? []) {
      const raw = lesson as CourseLessonQri & Record<string, unknown>;
      const lessonId = Number(raw.lessonId ?? raw.LessonId ?? 0) || fallbackId++;
      items.push({
        lessonId,
        title: String(raw.lessonTitle ?? raw.LessonTitle ?? raw.videoTitle ?? `Lesson ${lessonId}`),
        sectionTitle: section.sessionTitle,
      });
    }
  }
  return items;
}

function osLabel(bit: 1 | 2 | 4, isRtl: boolean): string {
  if (bit === 1) return isRtl ? 'ویندوز' : 'Windows';
  if (bit === 2) return isRtl ? 'مک' : 'Mac';
  return isRtl ? 'لینوکس' : 'Linux';
}

export function DesktopLicenseStudentsPanel({ courseId, isRtl, sections }: Props) {
  const { toast } = useToast();
  const curriculum = React.useMemo(() => buildCurriculum(sections), [sections]);
  const curriculumBySection = React.useMemo(() => {
    const map = new Map<string, CurriculumLesson[]>();
    for (const item of curriculum) {
      const list = map.get(item.sectionTitle) ?? [];
      list.push(item);
      map.set(item.sectionTitle, list);
    }
    return map;
  }, [curriculum]);

  const [licenses, setLicenses] = React.useState<CourseLicenseEnrollment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [devicesByEnrollment, setDevicesByEnrollment] = React.useState<
    Record<number, LicenseDeviceBinding[]>
  >({});
  const [devicesLoading, setDevicesLoading] = React.useState<number | null>(null);
  const [satisfactionByEnrollment, setSatisfactionByEnrollment] = React.useState<
    Record<number, TeacherStudentSatisfaction | undefined>
  >({});
  const [draftLimits, setDraftLimits] = React.useState<
    Record<number, { maxDevices: number; allowedOs: number }>
  >({});
  const [draftLessons, setDraftLessons] = React.useState<Record<number, number[]>>({});
  const [draftPartial, setDraftPartial] = React.useState<Record<number, boolean>>({});
  const [draftSatisfaction, setDraftSatisfaction] = React.useState<
    Record<number, { score: number; note: string }>
  >({});
  const [busyEnrollment, setBusyEnrollment] = React.useState<number | null>(null);

  const loadLicenses = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rows, satisfactionRows] = await Promise.all([
        getCourseLicenses(courseId),
        getTeacherStudentSatisfaction({ courseId }),
      ]);
      setLicenses(rows);
      const satMap: Record<number, TeacherStudentSatisfaction> = {};
      for (const row of satisfactionRows) {
        satMap[row.enrollmentId] = row;
      }
      setSatisfactionByEnrollment(satMap);
      const limits: Record<number, { maxDevices: number; allowedOs: number }> = {};
      const lessons: Record<number, number[]> = {};
      const partial: Record<number, boolean> = {};
      const satDraft: Record<number, { score: number; note: string }> = {};
      for (const row of rows) {
        limits[row.enrollmentId] = { maxDevices: row.maxDevices, allowedOs: row.allowedOs };
        lessons[row.enrollmentId] = [...row.allowedLessonIds];
        partial[row.enrollmentId] = row.contentAccessMode === 1;
        satDraft[row.enrollmentId] = {
          score: satMap[row.enrollmentId]?.score ?? 0,
          note: satMap[row.enrollmentId]?.note ?? '',
        };
      }
      setDraftLimits(limits);
      setDraftLessons(lessons);
      setDraftPartial(partial);
      setDraftSatisfaction(satDraft);
    } catch {
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  React.useEffect(() => {
    void loadLicenses();
  }, [loadLicenses]);

  const loadDevices = async (enrollmentId: number) => {
    setDevicesLoading(enrollmentId);
    try {
      const devices = await getLicenseDevices(enrollmentId);
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: devices }));
    } catch {
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: [] }));
    } finally {
      setDevicesLoading(null);
    }
  };

  const toggleExpand = (enrollmentId: number) => {
    if (expandedId === enrollmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(enrollmentId);
    if (!devicesByEnrollment[enrollmentId]) {
      void loadDevices(enrollmentId);
    }
  };

  const saveLimits = async (enrollmentId: number) => {
    const draft = draftLimits[enrollmentId];
    if (!draft) return;
    setBusyEnrollment(enrollmentId);
    try {
      await updateLicenseLimits({
        enrollmentId,
        maxDevices: Math.max(1, draft.maxDevices),
        allowedOs: draft.allowedOs || 1,
      });
      toast({ title: isRtl ? 'محدودیت‌ها ذخیره شد' : 'Limits saved' });
      await loadLicenses();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا در ذخیره' : 'Save failed'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  const saveLessons = async (enrollmentId: number, row: CourseLicenseEnrollment) => {
    const isPartial = draftPartial[enrollmentId] ?? row.contentAccessMode === 1;
    const lessonIds = isPartial ? draftLessons[enrollmentId] ?? [] : [];
    if (isPartial && lessonIds.length === 0) {
      toast({
        variant: 'destructive',
        title: isRtl
          ? 'برای دسترسی جزئی حداقل یک درس را انتخاب کنید'
          : 'Select at least one lesson for partial access',
      });
      return;
    }
    setBusyEnrollment(enrollmentId);
    try {
      await updateLicenseLessonAccess({ enrollmentId, lessonIds });
      toast({ title: isRtl ? 'دسترسی درس‌ها ذخیره شد' : 'Lesson access saved' });
      await loadLicenses();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا در ذخیره' : 'Save failed'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  const saveSatisfaction = async (enrollmentId: number) => {
    const draft = draftSatisfaction[enrollmentId];
    if (!draft || draft.score < 1 || draft.score > 5) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'امتیاز باید بین ۱ تا ۵ باشد' : 'Score must be between 1 and 5',
      });
      return;
    }
    setBusyEnrollment(enrollmentId);
    try {
      const saved = await upsertTeacherStudentSatisfaction({
        enrollmentId,
        score: draft.score,
        note: draft.note.trim() || undefined,
      });
      setSatisfactionByEnrollment((prev) => ({ ...prev, [enrollmentId]: saved }));
      toast({ title: isRtl ? 'رضایت دانشجو ذخیره شد' : 'Satisfaction saved' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا در ذخیره' : 'Save failed'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  const handleRevokeDevice = async (enrollmentId: number, deviceId: string) => {
    const reason = window.prompt(isRtl ? 'دلیل لغو (اختیاری)' : 'Revoke reason (optional)') ?? '';
    setBusyEnrollment(enrollmentId);
    try {
      await revokeLicenseDevice({ enrollmentId, deviceId, reason: reason.trim() || undefined });
      await loadDevices(enrollmentId);
      await loadLicenses();
      toast({ title: isRtl ? 'دستگاه لغو شد' : 'Device revoked' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا' : 'Error'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  const handleResetAllDevices = async (enrollmentId: number, studentName?: string | null) => {
    const ok = window.confirm(
      isRtl
        ? `همه دستگاه‌های فعال لایسنس ${studentName ? `«${studentName}»` : 'این دانشجو'} پاک می‌شوند تا بتواند دوباره فعال‌سازی کند. ادامه می‌دهید؟`
        : `Clear all active devices for ${studentName ? `“${studentName}”` : 'this student'} so they can activate again. Continue?`
    );
    if (!ok) return;

    setBusyEnrollment(enrollmentId);
    try {
      await resetLicenseDevices({
        enrollmentId,
        reason: isRtl ? 'ریست دستگاه‌ها توسط استاد' : 'Devices reset by teacher',
      });
      await loadDevices(enrollmentId);
      await loadLicenses();
      toast({
        title: isRtl ? 'دستگاه‌ها ریست شدند' : 'Devices reset',
        description: isRtl
          ? 'دانشجو می‌تواند دوباره ویدیو را روی سیستم فعلی فعال کند.'
          : 'The student can activate playback on the current PC again.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'ریست دستگاه‌ها ناموفق بود' : 'Could not reset devices'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  const toggleLicenseStatus = async (row: CourseLicenseEnrollment, activate: boolean) => {
    if (!row.desktopLicenseKey) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'ابتدا لایسنس را صادر کنید' : 'Issue a license key first',
      });
      return;
    }
    setBusyEnrollment(row.enrollmentId);
    try {
      if (activate) {
        await renewStudentDesktopLicense(row.enrollmentId, row.desktopLicenseExpiresAtUtc);
      } else {
        await revokeStudentDesktopLicense(row.enrollmentId);
      }
      await loadLicenses();
      toast({
        title: activate
          ? isRtl
            ? 'لایسنس فعال شد'
            : 'License activated'
          : isRtl
            ? 'لایسنس غیرفعال شد'
            : 'License deactivated',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا در تغییر وضعیت' : 'Status update failed'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  const regenerateKey = async (row: CourseLicenseEnrollment) => {
    setBusyEnrollment(row.enrollmentId);
    try {
      await regenerateStudentDesktopLicense(row.enrollmentId, row.desktopLicenseExpiresAtUtc);
      await loadLicenses();
      toast({ title: isRtl ? 'کلید جدید صادر شد' : 'New key generated' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا' : 'Error'),
      });
    } finally {
      setBusyEnrollment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (licenses.length === 0) {
    return (
      <p className={cn('py-8 text-center text-muted-foreground', isRtl && 'text-right')}>
        {isRtl ? 'هنوز لایسنس دسکتاپ برای این دوره صادر نشده است.' : 'No desktop licenses for this course yet.'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>{isRtl ? 'دانشجو' : 'Student'}</TableHead>
              <TableHead>{isRtl ? 'کلید لایسنس' : 'License key'}</TableHead>
              <TableHead>{isRtl ? 'دستگاه‌ها' : 'Devices'}</TableHead>
              <TableHead>{isRtl ? 'دسترسی' : 'Access'}</TableHead>
              <TableHead>{isRtl ? 'وضعیت' : 'Status'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((row) => {
              const expanded = expandedId === row.enrollmentId;
              const limits = draftLimits[row.enrollmentId] ?? {
                maxDevices: row.maxDevices,
                allowedOs: row.allowedOs,
              };
              const selectedLessons = draftLessons[row.enrollmentId] ?? row.allowedLessonIds;
              const satDraft = draftSatisfaction[row.enrollmentId] ?? { score: 0, note: '' };
              const devices = devicesByEnrollment[row.enrollmentId] ?? [];

              return (
                <React.Fragment key={row.enrollmentId}>
                  <TableRow>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleExpand(row.enrollmentId)}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{row.studentName || `#${row.userId}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="max-w-[140px] truncate">{row.desktopLicenseKey ?? '—'}</span>
                        {row.desktopLicenseKey ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => void navigator.clipboard.writeText(row.desktopLicenseKey!)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.activeDeviceCount}/{row.maxDevices}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {row.contentAccessMode === 1
                          ? isRtl
                            ? 'جزئی'
                            : 'Partial'
                          : isRtl
                            ? 'کامل'
                            : 'Full'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-2">
                        <Badge variant={row.isCurrentlyValid ? 'default' : 'secondary'}>
                          {row.isCurrentlyValid
                            ? isRtl
                              ? 'فعال'
                              : 'Active'
                            : isRtl
                              ? 'غیرفعال'
                              : 'Inactive'}
                        </Badge>
                        {row.desktopLicenseKey ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={row.isDesktopLicenseActive}
                              disabled={busyEnrollment === row.enrollmentId}
                              onCheckedChange={(checked) => void toggleLicenseStatus(row, checked)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {row.isDesktopLicenseActive
                                ? isRtl
                                  ? 'روشن'
                                  : 'On'
                                : isRtl
                                  ? 'خاموش'
                                  : 'Off'}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>

                  {expanded ? (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30 p-4">
                        <div className={cn('grid gap-6 lg:grid-cols-2', isRtl && 'text-right')}>
                          <div className="space-y-3 rounded-lg border bg-background p-4 lg:col-span-2">
                            <h4 className="font-semibold">{isRtl ? 'وضعیت و کلید لایسنس' : 'License status & key'}</h4>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyEnrollment === row.enrollmentId || !row.desktopLicenseKey}
                                onClick={() => void toggleLicenseStatus(row, true)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                                {isRtl ? 'فعال‌سازی / تمدید' : 'Activate / renew'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyEnrollment === row.enrollmentId}
                                onClick={() => void regenerateKey(row)}
                              >
                                <RefreshCw className="h-3.5 w-3.5 me-1" />
                                {isRtl ? 'کلید جدید' : 'New key'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={
                                  busyEnrollment === row.enrollmentId ||
                                  !row.desktopLicenseKey ||
                                  !row.isDesktopLicenseActive
                                }
                                onClick={() => void toggleLicenseStatus(row, false)}
                              >
                                <Ban className="h-3.5 w-3.5 me-1" />
                                {isRtl ? 'غیرفعال‌سازی' : 'Deactivate'}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4 rounded-lg border bg-background p-4">
                            <h4 className="font-semibold">{isRtl ? 'محدودیت دستگاه' : 'Device limits'}</h4>
                            <div className="space-y-2">
                              <Label>{isRtl ? 'حداکثر دستگاه' : 'Max devices'}</Label>
                              <Input
                                type="number"
                                min={1}
                                value={limits.maxDevices}
                                onChange={(e) =>
                                  setDraftLimits((prev) => ({
                                    ...prev,
                                    [row.enrollmentId]: {
                                      ...limits,
                                      maxDevices: Number(e.target.value) || 1,
                                    },
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{isRtl ? 'سیستم‌عامل مجاز' : 'Allowed OS'}</Label>
                              <div className="flex flex-wrap gap-4">
                                {([1, 2, 4] as const).map((bit) => (
                                  <label key={bit} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={osFlagsHas(limits.allowedOs, bit)}
                                      onCheckedChange={(checked) =>
                                        setDraftLimits((prev) => ({
                                          ...prev,
                                          [row.enrollmentId]: {
                                            ...limits,
                                            allowedOs: toggleOsFlag(
                                              limits.allowedOs,
                                              bit,
                                              checked === true
                                            ),
                                          },
                                        }))
                                      }
                                    />
                                    {osLabel(bit, isRtl)}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={busyEnrollment === row.enrollmentId}
                              onClick={() => void saveLimits(row.enrollmentId)}
                            >
                              {busyEnrollment === row.enrollmentId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              {isRtl ? 'ذخیره محدودیت‌ها' : 'Save limits'}
                            </Button>
                          </div>

                          <div className="space-y-4 rounded-lg border bg-background p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-semibold">{isRtl ? 'دسترسی درس‌ها' : 'Lesson access'}</h4>
                              <div className="flex items-center gap-2 rounded-full border px-2.5 py-1">
                                <span className="text-xs text-muted-foreground">
                                  {isRtl ? 'جزئی' : 'Partial'}
                                </span>
                                <Switch
                                  checked={draftPartial[row.enrollmentId] ?? row.contentAccessMode === 1}
                                  onCheckedChange={(checked) =>
                                    setDraftPartial((prev) => ({ ...prev, [row.enrollmentId]: checked }))
                                  }
                                />
                              </div>
                            </div>
                            {(draftPartial[row.enrollmentId] ?? row.contentAccessMode === 1) ? (
                              <div className="max-h-56 space-y-3 overflow-y-auto pe-1">
                                {[...curriculumBySection.entries()].map(([sectionTitle, lessons]) => (
                                  <div key={sectionTitle}>
                                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                                      {sectionTitle}
                                    </p>
                                    <ul className="space-y-1">
                                      {lessons.map((lesson) => {
                                        const checked = selectedLessons.includes(lesson.lessonId);
                                        return (
                                          <li key={lesson.lessonId}>
                                            <label className="flex items-center gap-2 text-sm">
                                              <Checkbox
                                                checked={checked}
                                                onCheckedChange={(value) => {
                                                  setDraftLessons((prev) => {
                                                    const current = prev[row.enrollmentId] ?? selectedLessons;
                                                    const next = value
                                                      ? [...new Set([...current, lesson.lessonId])]
                                                      : current.filter((id) => id !== lesson.lessonId);
                                                    return { ...prev, [row.enrollmentId]: next };
                                                  });
                                                }}
                                              />
                                              <span className="truncate">{lesson.title}</span>
                                            </label>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {isRtl
                                  ? 'این لایسنس دسترسی کامل به همه درس‌ها دارد. برای محدود کردن، دسترسی جزئی را روشن کنید.'
                                  : 'This license has full access. Enable partial to restrict lessons.'}
                              </p>
                            )}
                            <Button
                              size="sm"
                              disabled={busyEnrollment === row.enrollmentId}
                              onClick={() => void saveLessons(row.enrollmentId, row)}
                            >
                              {isRtl ? 'ذخیره درس‌ها' : 'Save lessons'}
                            </Button>
                          </div>

                          <div className="space-y-3 rounded-lg border bg-background p-4 lg:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-semibold">{isRtl ? 'دستگاه‌های ثبت‌شده' : 'Registered devices'}</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyEnrollment === row.enrollmentId}
                                onClick={() =>
                                  void handleResetAllDevices(row.enrollmentId, row.studentName)
                                }
                              >
                                {isRtl ? 'ریست همه دستگاه‌ها' : 'Reset all devices'}
                              </Button>
                            </div>
                            {devicesLoading === row.enrollmentId ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : devices.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {isRtl ? 'دستگاهی ثبت نشده است.' : 'No devices registered.'}
                              </p>
                            ) : (
                              <ul className="space-y-2">
                                {devices.map((device) => (
                                  <li
                                    key={device.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                                  >
                                    <div>
                                      <p className="font-medium">{device.machineName ?? device.deviceId}</p>
                                      <p className="text-xs text-muted-foreground font-mono">{device.deviceId}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={device.isActive ? 'default' : 'secondary'}>
                                        {device.isActive
                                          ? isRtl
                                            ? 'فعال'
                                            : 'Active'
                                          : isRtl
                                            ? 'لغو شده'
                                            : 'Revoked'}
                                      </Badge>
                                      {device.isActive ? (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          disabled={busyEnrollment === row.enrollmentId}
                                          onClick={() => void handleRevokeDevice(row.enrollmentId, device.deviceId)}
                                        >
                                          <Ban className="h-3.5 w-3.5" />
                                          {isRtl ? 'لغو' : 'Revoke'}
                                        </Button>
                                      ) : null}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="space-y-3 rounded-lg border bg-background p-4 lg:col-span-2">
                            <h4 className="flex items-center gap-2 font-semibold">
                              <Star className="h-4 w-4 text-amber-500" />
                              {isRtl ? 'رضایت از دانشجو' : 'Student satisfaction'}
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto] sm:items-end">
                              <div className="space-y-1">
                                <Label>{isRtl ? 'امتیاز ۱–۵' : 'Score 1–5'}</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={5}
                                  value={satDraft.score || ''}
                                  onChange={(e) =>
                                    setDraftSatisfaction((prev) => ({
                                      ...prev,
                                      [row.enrollmentId]: {
                                        ...satDraft,
                                        score: Number(e.target.value) || 0,
                                      },
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>{isRtl ? 'یادداشت' : 'Note'}</Label>
                                <Textarea
                                  rows={2}
                                  value={satDraft.note}
                                  onChange={(e) =>
                                    setDraftSatisfaction((prev) => ({
                                      ...prev,
                                      [row.enrollmentId]: { ...satDraft, note: e.target.value },
                                    }))
                                  }
                                />
                              </div>
                              <Button
                                size="sm"
                                disabled={busyEnrollment === row.enrollmentId}
                                onClick={() => void saveSatisfaction(row.enrollmentId)}
                              >
                                {isRtl ? 'ذخیره' : 'Save'}
                              </Button>
                            </div>
                            {satisfactionByEnrollment[row.enrollmentId]?.updatedAtUtc ? (
                              <p className="text-xs text-muted-foreground">
                                {isRtl ? 'آخرین به‌روزرسانی:' : 'Last updated:'}{' '}
                                {new Date(
                                  satisfactionByEnrollment[row.enrollmentId]!.updatedAtUtc
                                ).toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
