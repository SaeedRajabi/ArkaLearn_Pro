'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Ban,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Monitor,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FlatpickrDateTimePicker } from '@/components/shared/flatpickr-datetime-picker';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getApiErrorMessage } from '@/lib/api/client';
import { getMyCourseById } from '@/lib/api/courses';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import type { CourseLessonQri, CourseSessionQri } from '@/lib/api/types';
import {
  createStudentDesktopLicense,
  deleteStudentDesktopLicense,
  getLicenseDevices,
  getStudentDesktopLicenses,
  osFlagsHas,
  regenerateStudentDesktopLicense,
  renewStudentDesktopLicense,
  revokeLicenseDevice,
  resetLicenseDevices,
  revokeStudentDesktopLicense,
  toggleOsFlag,
  updateLicenseLessonAccess,
  updateLicenseLimits,
  type LicenseDeviceBinding,
  type StudentDesktopLicense,
} from '@/lib/api/desktop-licenses';
import { formatLocaleDate } from '@/lib/utils/locale-format';
import { apiIsoToLocalDate, dateToUtcEndIso } from '@/lib/utils/localized-dates';
import { cn } from '@/lib/utils';

type Props = {
  userId: string;
  studentName?: string;
};

type CurriculumLesson = { lessonId: number; title: string; sectionTitle: string };
type DesktopCourseOption = { id: string; title: string };

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

function groupBySection(curriculum: CurriculumLesson[]) {
  const map = new Map<string, CurriculumLesson[]>();
  for (const item of curriculum) {
    const list = map.get(item.sectionTitle) ?? [];
    list.push(item);
    map.set(item.sectionTitle, list);
  }
  return map;
}

function osLabel(bit: 1 | 2 | 4, isRtl: boolean): string {
  if (bit === 1) return isRtl ? 'ویندوز' : 'Windows';
  if (bit === 2) return isRtl ? 'مک' : 'Mac';
  return isRtl ? 'لینوکس' : 'Linux';
}

function expiryToIso(date: Date | undefined): string | null {
  return date ? dateToUtcEndIso(date) : null;
}

function LessonAccessPicker({
  isRtl,
  curriculum,
  selectedLessonIds,
  onChange,
}: {
  isRtl: boolean;
  curriculum: CurriculumLesson[];
  selectedLessonIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const bySection = groupBySection(curriculum);
  if (curriculum.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isRtl ? 'در حال بارگذاری سرفصل دوره…' : 'Loading course curriculum…'}
      </p>
    );
  }

  return (
    <ScrollArea className="h-48 rounded-lg border p-3">
      <div className="space-y-3">
        {[...bySection.entries()].map(([sectionTitle, lessons]) => {
          const allChecked = lessons.every((l) => selectedLessonIds.includes(l.lessonId));
          return (
            <div key={sectionTitle}>
              <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(value) => {
                    const ids = lessons.map((l) => l.lessonId);
                    if (value) {
                      onChange([...new Set([...selectedLessonIds, ...ids])]);
                    } else {
                      onChange(selectedLessonIds.filter((id) => !ids.includes(id)));
                    }
                  }}
                />
                {sectionTitle}
              </label>
              <ul className="ms-5 space-y-1">
                {lessons.map((lesson) => {
                  const checked = selectedLessonIds.includes(lesson.lessonId);
                  return (
                    <li key={lesson.lessonId}>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            onChange(
                              value
                                ? [...new Set([...selectedLessonIds, lesson.lessonId])]
                                : selectedLessonIds.filter((id) => id !== lesson.lessonId)
                            );
                          }}
                        />
                        <span className="truncate">{lesson.title}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function ProfessorDesktopLicensePanel({ userId, studentName }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();

  const [items, setItems] = React.useState<StudentDesktopLicense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [desktopCourses, setDesktopCourses] = React.useState<DesktopCourseOption[]>([]);
  const [newCourseId, setNewCourseId] = React.useState('');
  const [newHasExpiry, setNewHasExpiry] = React.useState(false);
  const [newExpires, setNewExpires] = React.useState<Date | undefined>(undefined);
  const [newFullAccess, setNewFullAccess] = React.useState(true);
  const [newLessonIds, setNewLessonIds] = React.useState<number[]>([]);
  const [devicesByEnrollment, setDevicesByEnrollment] = React.useState<
    Record<string, LicenseDeviceBinding[]>
  >({});
  const [curriculumByCourse, setCurriculumByCourse] = React.useState<
    Record<string, CurriculumLesson[]>
  >({});
  const [draftLimits, setDraftLimits] = React.useState<
    Record<string, { maxDevices: number; allowedOs: number }>
  >({});
  const [draftLessons, setDraftLessons] = React.useState<Record<string, number[]>>({});
  const [draftPartial, setDraftPartial] = React.useState<Record<string, boolean>>({});
  const [draftHasExpiry, setDraftHasExpiry] = React.useState<Record<string, boolean>>({});
  const [draftExpires, setDraftExpires] = React.useState<Record<string, Date | undefined>>({});
  const [reissueId, setReissueId] = React.useState<string | null>(null);
  const [reissueHasExpiry, setReissueHasExpiry] = React.useState(false);
  const [reissueExpires, setReissueExpires] = React.useState<Date | undefined>(undefined);
  const [reissueFullAccess, setReissueFullAccess] = React.useState(true);
  const [reissueLessonIds, setReissueLessonIds] = React.useState<number[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getStudentDesktopLicenses(userId);
      // Defense-in-depth: only keep licenses for the opened student.
      const scoped = rows.filter((row) => !row.userId || row.userId === String(userId));
      setItems(scoped);
      const limits: Record<string, { maxDevices: number; allowedOs: number }> = {};
      const lessons: Record<string, number[]> = {};
      const partial: Record<string, boolean> = {};
      const hasExpiry: Record<string, boolean> = {};
      const expires: Record<string, Date | undefined> = {};
      for (const row of scoped) {
        limits[row.enrollmentId] = { maxDevices: row.maxDevices, allowedOs: row.allowedOs };
        lessons[row.enrollmentId] = [...row.allowedLessonIds];
        partial[row.enrollmentId] = row.contentAccessMode === 1;
        hasExpiry[row.enrollmentId] = Boolean(row.desktopLicenseExpiresAtUtc);
        expires[row.enrollmentId] = apiIsoToLocalDate(row.desktopLicenseExpiresAtUtc ?? undefined);
      }
      setDraftLimits(limits);
      setDraftLessons(lessons);
      setDraftPartial(partial);
      setDraftHasExpiry(hasExpiry);
      setDraftExpires(expires);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await searchProfessorCourses({ pageNumber: 1, pageSize: 100 });
        if (cancelled) return;
        setDesktopCourses(
          page.queryResult
            .filter((c) => c.deliveryMode === 'desktopLicense')
            .map((c) => ({ id: String(c.id), title: c.title }))
            .filter((c) => c.id !== '0')
        );
      } catch {
        if (!cancelled) setDesktopCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureCurriculum = async (courseId: string | number) => {
    const key = String(courseId);
    if (curriculumByCourse[key]) return curriculumByCourse[key];
    try {
      const course = await getMyCourseById(Number(courseId));
      const curriculum = buildCurriculum(course?.sections ?? []);
      setCurriculumByCourse((prev) => ({ ...prev, [key]: curriculum }));
      return curriculum;
    } catch {
      setCurriculumByCourse((prev) => ({ ...prev, [key]: [] }));
      return [];
    }
  };

  React.useEffect(() => {
    if (!newCourseId || newFullAccess) return;
    void ensureCurriculum(newCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCourseId, newFullAccess]);

  const ensureDevices = async (enrollmentId: string) => {
    if (devicesByEnrollment[enrollmentId]) return;
    try {
      const devices = await getLicenseDevices(enrollmentId);
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: devices }));
    } catch {
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: [] }));
    }
  };

  const toggleExpand = (row: StudentDesktopLicense) => {
    if (expandedId === row.enrollmentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.enrollmentId);
    void ensureCurriculum(row.courseId);
    void ensureDevices(row.enrollmentId);
  };

  const applyLessonAccess = async (
    enrollmentId: string,
    fullAccess: boolean,
    lessonIds: number[]
  ) => {
    if (!fullAccess && lessonIds.length === 0) {
      throw new Error(isRtl ? 'حداقل یک بخش/درس را انتخاب کنید' : 'Select at least one lesson');
    }
    await updateLicenseLessonAccess({
      enrollmentId,
      lessonIds: fullAccess ? [] : lessonIds,
    });
  };

  const runStatus = async (row: StudentDesktopLicense, activate: boolean) => {
    if (!row.desktopLicenseKey) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'ابتدا لایسنس را صادر کنید' : 'Issue a license key first',
      });
      return;
    }
    setBusyId(row.enrollmentId);
    try {
      if (activate) {
        const hasExpiry = draftHasExpiry[row.enrollmentId] ?? Boolean(row.desktopLicenseExpiresAtUtc);
        await renewStudentDesktopLicense(
          row.enrollmentId,
          hasExpiry
            ? expiryToIso(draftExpires[row.enrollmentId]) ?? row.desktopLicenseExpiresAtUtc
            : null
        );
      } else {
        await revokeStudentDesktopLicense(row.enrollmentId);
      }
      await load();
      toast({
        title: activate
          ? isRtl
            ? 'لایسنس فعال شد'
            : 'License activated'
          : isRtl
            ? 'لایسنس باطل شد'
            : 'License revoked',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا در تغییر وضعیت' : 'Status update failed'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const saveExpiry = async (row: StudentDesktopLicense) => {
    const hasExpiry = draftHasExpiry[row.enrollmentId] ?? false;
    if (hasExpiry && !draftExpires[row.enrollmentId]) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'تاریخ انقضا را وارد کنید' : 'Enter an expiry date',
      });
      return;
    }
    setBusyId(row.enrollmentId);
    try {
      await renewStudentDesktopLicense(
        row.enrollmentId,
        hasExpiry ? expiryToIso(draftExpires[row.enrollmentId]) : null
      );
      await load();
      toast({ title: isRtl ? 'تنظیمات انقضا ذخیره شد' : 'Expiry settings saved' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا' : 'Error'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const saveLimits = async (enrollmentId: string) => {
    const draft = draftLimits[enrollmentId];
    if (!draft) return;
    setBusyId(enrollmentId);
    try {
      await updateLicenseLimits({
        enrollmentId,
        maxDevices: Math.max(1, draft.maxDevices),
        allowedOs: draft.allowedOs || 1,
      });
      await load();
      toast({ title: isRtl ? 'محدودیت‌ها ذخیره شد' : 'Limits saved' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا در ذخیره' : 'Save failed'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const saveLessons = async (row: StudentDesktopLicense) => {
    const isPartial = draftPartial[row.enrollmentId] ?? row.contentAccessMode === 1;
    const lessonIds = isPartial ? draftLessons[row.enrollmentId] ?? [] : [];
    setBusyId(row.enrollmentId);
    try {
      await applyLessonAccess(row.enrollmentId, !isPartial, lessonIds);
      await load();
      toast({ title: isRtl ? 'دسترسی محتوا ذخیره شد' : 'Content access saved' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(
          error,
          error instanceof Error ? error.message : isRtl ? 'خطا در ذخیره' : 'Save failed'
        ),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRevokeDevice = async (enrollmentId: string, deviceId: string) => {
    const reason = window.prompt(isRtl ? 'دلیل لغو (اختیاری)' : 'Revoke reason (optional)') ?? '';
    setBusyId(enrollmentId);
    try {
      await revokeLicenseDevice({ enrollmentId, deviceId, reason: reason.trim() || undefined });
      const devices = await getLicenseDevices(enrollmentId);
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: devices }));
      await load();
      toast({ title: isRtl ? 'دستگاه لغو شد' : 'Device revoked' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'خطا' : 'Error'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleResetAllDevices = async (enrollmentId: string, courseTitle: string) => {
    const ok = window.confirm(
      isRtl
        ? `همه دستگاه‌های فعال لایسنس «${courseTitle}» پاک می‌شوند تا دانشجو بتواند دوباره روی همین یا سیستم جدید فعال‌سازی کند. ادامه می‌دهید؟`
        : `Clear all active devices for “${courseTitle}” so the student can activate again on this or a new PC. Continue?`
    );
    if (!ok) return;

    setBusyId(enrollmentId);
    try {
      await resetLicenseDevices({
        enrollmentId,
        reason: isRtl ? 'ریست دستگاه‌ها توسط استاد' : 'Devices reset by teacher',
      });
      const devices = await getLicenseDevices(enrollmentId);
      setDevicesByEnrollment((prev) => ({ ...prev, [enrollmentId]: devices }));
      await load();
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
      setBusyId(null);
    }
  };

  const deleteLicense = async (row: StudentDesktopLicense) => {
    const ok = window.confirm(
      isRtl
        ? `لایسنس دوره «${row.courseTitle}» به‌طور کامل حذف می‌شود (کلید، دستگاه‌ها و دسترسی محتوا). ادامه می‌دهید؟`
        : `Fully delete the license for “${row.courseTitle}” (key, devices, and content access). Continue?`
    );
    if (!ok) return;

    setBusyId(row.enrollmentId);
    try {
      await deleteStudentDesktopLicense(row.enrollmentId);
      if (expandedId === row.enrollmentId) setExpandedId(null);
      if (reissueId === row.enrollmentId) setReissueId(null);
      await load();
      toast({ title: isRtl ? 'لایسنس حذف شد' : 'License deleted' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'حذف لایسنس ناموفق بود' : 'Could not delete license'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const createLicense = async () => {
    if (!newCourseId) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'دوره را انتخاب کنید' : 'Select a course',
      });
      return;
    }
    if (newHasExpiry && !newExpires) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'تاریخ انقضا را وارد کنید' : 'Enter an expiry date',
      });
      return;
    }
    if (!newFullAccess && newLessonIds.length === 0) {
      toast({
        variant: 'destructive',
        title: isRtl
          ? 'برای دسترسی جزئی حداقل یک بخش را تیک بزنید'
          : 'Select at least one section/lesson for partial access',
      });
      return;
    }

    // One license per student per course — create form only lists courses without a license.
    if (items.some((x) => x.courseId === newCourseId && x.desktopLicenseKey)) {
      toast({
        variant: 'destructive',
        title: isRtl
          ? 'برای این دوره قبلاً لایسنس صادر شده. از «باطل و صدور جدید» روی همان لایسنس استفاده کنید.'
          : 'This course already has a license. Use “Revoke & reissue” on that license card.',
      });
      return;
    }

    setBusyId('create');
    try {
      const created = await createStudentDesktopLicense({
        userId,
        courseId: newCourseId,
        expiresAtUtc: newHasExpiry ? expiryToIso(newExpires) : null,
        replaceExisting: false,
      });
      let enrollmentId = created.enrollmentId;
      if (!enrollmentId || enrollmentId === '0') {
        const refreshed = await getStudentDesktopLicenses(userId);
        enrollmentId =
          refreshed.find((x) => x.courseId === newCourseId)?.enrollmentId ?? '0';
      }
      if (!newFullAccess && enrollmentId && enrollmentId !== '0') {
        try {
          await applyLessonAccess(enrollmentId, false, newLessonIds);
        } catch (accessError) {
          toast({
            variant: 'destructive',
            title: getApiErrorMessage(
              accessError,
              isRtl
                ? 'لایسنس ایجاد شد ولی ذخیره دسترسی جزئی ناموفق بود'
                : 'License created but partial access could not be saved'
            ),
          });
          await load();
          return;
        }
      }
      setNewCourseId('');
      setNewHasExpiry(false);
      setNewExpires(undefined);
      setNewFullAccess(true);
      setNewLessonIds([]);
      await load();
      toast({
        title: isRtl
          ? 'لایسنس اختصاصی این دانشجو برای دوره صادر شد'
          : 'Private license issued for this student and course',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'ایجاد لایسنس ناموفق بود' : 'Could not create license'),
      });
    } finally {
      setBusyId(null);
    }
  };

  const openReissue = async (row: StudentDesktopLicense) => {
    setReissueId(row.enrollmentId);
    setReissueHasExpiry(Boolean(row.desktopLicenseExpiresAtUtc));
    setReissueExpires(apiIsoToLocalDate(row.desktopLicenseExpiresAtUtc ?? undefined));
    setReissueFullAccess(row.contentAccessMode !== 1);
    setReissueLessonIds([...row.allowedLessonIds]);
    setExpandedId(row.enrollmentId);
    await ensureCurriculum(row.courseId);
  };

  const confirmReissue = async (row: StudentDesktopLicense) => {
    if (reissueHasExpiry && !reissueExpires) {
      toast({
        variant: 'destructive',
        title: isRtl ? 'تاریخ انقضا را وارد کنید' : 'Enter an expiry date',
      });
      return;
    }
    if (!reissueFullAccess && reissueLessonIds.length === 0) {
      toast({
        variant: 'destructive',
        title: isRtl
          ? 'برای دسترسی جزئی حداقل یک بخش را تیک بزنید'
          : 'Select at least one section/lesson for partial access',
      });
      return;
    }
    const ok = window.confirm(
      isRtl
        ? 'لایسنس فعلی باطل می‌شود و کلید جدید برای دانشجو صادر می‌گردد. ادامه؟'
        : 'The current license will be invalidated and a new key will be issued. Continue?'
    );
    if (!ok) return;

    setBusyId(row.enrollmentId);
    try {
      await regenerateStudentDesktopLicense(
        row.enrollmentId,
        reissueHasExpiry ? expiryToIso(reissueExpires) : null
      );
      await applyLessonAccess(row.enrollmentId, reissueFullAccess, reissueLessonIds);
      setReissueId(null);
      setDevicesByEnrollment((prev) => {
        const next = { ...prev };
        delete next[row.enrollmentId];
        return next;
      });
      await load();
      toast({
        title: isRtl ? 'لایسنس باطل و کلید جدید صادر شد' : 'License revoked and new key issued',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: getApiErrorMessage(error, isRtl ? 'صدور مجدد ناموفق بود' : 'Reissue failed'),
      });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600/80" />
        <p className="text-sm text-muted-foreground">
          {isRtl ? 'در حال بارگذاری لایسنس‌ها…' : 'Loading licenses…'}
        </p>
      </div>
    );
  }

  const createCurriculum = curriculumByCourse[newCourseId] ?? [];
  const licensedCourseIds = new Set(items.filter((x) => x.desktopLicenseKey).map((x) => x.courseId));
  const availableCourses = desktopCourses.filter((c) => !licensedCourseIds.has(c.id));

  return (
    <div className={cn('space-y-5', isRtl && 'text-right')}>
      <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 px-5 py-5 text-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 20%, rgba(52,211,153,0.35), transparent 42%), radial-gradient(circle at 88% 10%, rgba(148,163,184,0.25), transparent 35%)',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs text-emerald-100">
              <Shield className="h-3.5 w-3.5" />
              {isRtl ? 'لایسنس اختصاصی دانشجو' : 'Student-private license'}
            </div>
            <h3 className="text-lg font-semibold tracking-tight">
              {studentName
                ? isRtl
                  ? `لایسنس‌های ${studentName}`
                  : `Licenses for ${studentName}`
                : isRtl
                  ? 'لایسنس‌های این دانشجو'
                  : 'This student’s licenses'}
            </h3>
            <p className="max-w-2xl text-sm text-slate-300">
              {isRtl
                ? 'هر دوره یک لایسنس جدا دارد (مثلاً ۱۰ دوره = ۱۰ کلید). کلید فقط متعلق به همین دانشجو است. برای هر دوره فقط یک لایسنس؛ دسترسی کامل یا جزئی به درس‌ها روی همان لایسنس تنظیم می‌شود.'
                : 'One separate license per course (e.g. 10 courses = 10 keys). Keys belong only to this student. Only one license per course; full or partial lesson access is configured on that license.'}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm backdrop-blur">
            <KeyRound className="h-4 w-4 text-emerald-300" />
            <span>
              {items.length} {isRtl ? 'دوره دارای لایسنس' : 'licensed course(s)'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border bg-background/80 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-700" />
          <h4 className="font-semibold">
            {isRtl ? 'صدور لایسنس جدید برای یک دوره' : 'Issue a new license for a course'}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRtl
            ? 'فقط دوره‌هایی که هنوز برای این دانشجو لایسنس ندارند اینجا نمایش داده می‌شوند. اگر لایسنس وجود دارد، از کارت همان دوره «باطل و صدور جدید» را بزنید.'
            : 'Only courses without a license for this student appear here. If a license already exists, use “Revoke & reissue” on that course card.'}
        </p>

        {desktopCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isRtl
              ? 'هنوز دوره دسکتاپ فعالی ندارید. ابتدا یک دوره با تحویل لایسنس دسکتاپ بسازید.'
              : 'No desktop courses yet. Create a course with desktop license delivery first.'}
          </p>
        ) : availableCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isRtl
              ? 'برای همه دوره‌های دسکتاپ این دانشجو قبلاً لایسنس صادر شده است.'
              : 'This student already has a license for every desktop course.'}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{isRtl ? 'دوره (یک لایسنس برای همین دانشجو)' : 'Course (one license for this student)'}</Label>
                <Select
                  value={newCourseId || undefined}
                  onValueChange={(value) => {
                    setNewCourseId(value);
                    setNewLessonIds([]);
                    void ensureCurriculum(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRtl ? 'انتخاب دوره…' : 'Select course…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{isRtl ? 'تاریخ انقضا' : 'Expiration'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? 'آیا لایسنس تاریخ انقضا داشته باشد؟' : 'Should this license expire?'}
                    </p>
                  </div>
                  <Switch checked={newHasExpiry} onCheckedChange={setNewHasExpiry} />
                </div>
                {newHasExpiry ? (
                  <FlatpickrDateTimePicker
                    mode="date"
                    value={newExpires}
                    onChange={setNewExpires}
                    locale={locale === 'fa' ? 'fa' : 'en'}
                    isRtl={isRtl}
                    placeholder={isRtl ? 'انتخاب تاریخ انقضا' : 'Select expiry date'}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? 'بدون انقضا — لایسنس تا باطل شدن معتبر است.' : 'No expiry — valid until revoked.'}
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{isRtl ? 'دسترسی به دوره' : 'Course access'}</p>
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? 'دسترسی کامل یا فقط بخش‌های انتخابی' : 'Full access or selected sections only'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{isRtl ? 'کامل' : 'Full'}</span>
                    <Switch
                      checked={newFullAccess}
                      onCheckedChange={(checked) => {
                        setNewFullAccess(checked);
                        if (checked) setNewLessonIds([]);
                        else if (newCourseId) void ensureCurriculum(newCourseId);
                      }}
                    />
                  </div>
                </div>
                {!newFullAccess ? (
                  <LessonAccessPicker
                    isRtl={isRtl}
                    curriculum={createCurriculum}
                    selectedLessonIds={newLessonIds}
                    onChange={setNewLessonIds}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isRtl
                      ? 'دانشجو با این لایسنس به همه بخش‌های دوره دسترسی دارد.'
                      : 'Student gets access to the entire course with this license.'}
                  </p>
                )}
              </div>
            </div>

            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={busyId === 'create' || !newCourseId}
              onClick={() => void createLicense()}
            >
              {busyId === 'create' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="ms-1.5">{isRtl ? 'صدور لایسنس اختصاصی' : 'Issue private license'}</span>
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
          <Monitor className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">
            {isRtl ? 'لایسنس دسکتاپ برای این دانشجو ثبت نشده است' : 'No desktop licenses for this student'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((row) => {
            const expanded = expandedId === row.enrollmentId;
            const limits = draftLimits[row.enrollmentId] ?? {
              maxDevices: row.maxDevices,
              allowedOs: row.allowedOs,
            };
            const isPartial = draftPartial[row.enrollmentId] ?? row.contentAccessMode === 1;
            const selectedLessons = draftLessons[row.enrollmentId] ?? row.allowedLessonIds;
            const curriculum = curriculumByCourse[row.courseId] ?? [];
            const devices = devicesByEnrollment[row.enrollmentId] ?? [];
            const canToggleStatus = Boolean(row.desktopLicenseKey);
            const busy = busyId === row.enrollmentId;
            const hasExpiry = draftHasExpiry[row.enrollmentId] ?? Boolean(row.desktopLicenseExpiresAtUtc);
            const isReissuing = reissueId === row.enrollmentId;

            return (
              <div
                key={row.enrollmentId}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-card transition-shadow',
                  expanded && 'shadow-md ring-1 ring-emerald-700/15'
                )}
              >
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-start"
                    onClick={() => toggleExpand(row)}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 space-y-1">
                      <span className="block truncate font-semibold">{row.courseTitle}</span>
                      <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={row.isCurrentlyValid ? 'default' : 'secondary'} className="h-5">
                          {row.isCurrentlyValid
                            ? isRtl
                              ? 'معتبر'
                              : 'Valid'
                            : isRtl
                              ? 'باطل / نامعتبر'
                              : 'Revoked / invalid'}
                        </Badge>
                        <span>
                          {row.desktopLicenseExpiresAtUtc
                            ? isRtl
                              ? `انقضا: ${formatLocaleDate(row.desktopLicenseExpiresAtUtc, locale, 'short')}`
                              : `Expires: ${formatLocaleDate(row.desktopLicenseExpiresAtUtc, locale, 'short')}`
                            : isRtl
                              ? 'بدون انقضا'
                              : 'No expiry'}
                        </span>
                        <span>
                          {row.contentAccessMode === 1
                            ? isRtl
                              ? 'دسترسی جزئی'
                              : 'Partial'
                            : isRtl
                              ? 'دسترسی کامل'
                              : 'Full'}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        <span className="inline-block max-w-[260px] truncate align-bottom sm:max-w-[360px]">
                          {row.desktopLicenseKey ?? '—'}
                        </span>
                      </span>
                    </span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {row.desktopLicenseKey ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          void navigator.clipboard.writeText(row.desktopLicenseKey!);
                          toast({ title: isRtl ? 'کلید کپی شد' : 'Key copied' });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}

                    {canToggleStatus ? (
                      <div className="flex items-center gap-2 rounded-full border px-2.5 py-1.5">
                        <Switch
                          checked={row.isDesktopLicenseActive}
                          disabled={busy}
                          onCheckedChange={(checked) => void runStatus(row, checked)}
                        />
                        <span className="text-xs font-medium">
                          {row.isDesktopLicenseActive
                            ? isRtl
                              ? 'فعال'
                              : 'Active'
                            : isRtl
                              ? 'باطل'
                              : 'Revoked'}
                        </span>
                      </div>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={busy}
                      onClick={() => void openReissue(row)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {isRtl ? 'باطل و صدور جدید' : 'Revoke & reissue'}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={busy}
                      onClick={() => void deleteLicense(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isRtl ? 'حذف لایسنس' : 'Delete'}
                    </Button>

                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(row)}>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {expanded ? (
                  <div className="border-t bg-muted/25 px-4 py-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/professor/courses/${row.courseId}/desktop`}
                        className="inline-flex items-center gap-1.5 text-sm text-emerald-800 hover:underline dark:text-emerald-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isRtl ? 'تنظیمات دوره و واترمارک' : 'Course & watermark settings'}
                      </Link>
                    </div>

                    {isReissuing ? (
                      <div className="mb-4 space-y-4 rounded-xl border border-amber-500/30 bg-amber-50/60 p-4 dark:bg-amber-950/20">
                        <h5 className="font-semibold">
                          {isRtl ? 'باطل کردن و صدور لایسنس جدید' : 'Revoke and issue a new license'}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {isRtl
                            ? 'کلید فعلی بی‌اعتبار می‌شود و کلید تازه با تنظیمات زیر برای دانشجو ساخته می‌شود.'
                            : 'The current key becomes invalid and a fresh key is created with the settings below.'}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-3 rounded-lg border bg-background p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label>{isRtl ? 'دارای تاریخ انقضا' : 'Has expiry date'}</Label>
                              <Switch checked={reissueHasExpiry} onCheckedChange={setReissueHasExpiry} />
                            </div>
                            {reissueHasExpiry ? (
                              <FlatpickrDateTimePicker
                                mode="date"
                                value={reissueExpires}
                                onChange={setReissueExpires}
                                locale={locale === 'fa' ? 'fa' : 'en'}
                                isRtl={isRtl}
                                placeholder={isRtl ? 'انتخاب تاریخ انقضا' : 'Select expiry date'}
                              />
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                {isRtl ? 'بدون انقضا' : 'No expiry'}
                              </p>
                            )}
                          </div>
                          <div className="space-y-3 rounded-lg border bg-background p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label>{isRtl ? 'دسترسی کامل به دوره' : 'Full course access'}</Label>
                              <Switch
                                checked={reissueFullAccess}
                                onCheckedChange={(checked) => {
                                  setReissueFullAccess(checked);
                                  if (checked) setReissueLessonIds([]);
                                }}
                              />
                            </div>
                            {!reissueFullAccess ? (
                              <LessonAccessPicker
                                isRtl={isRtl}
                                curriculum={curriculum}
                                selectedLessonIds={reissueLessonIds}
                                onChange={setReissueLessonIds}
                              />
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button disabled={busy} onClick={() => void confirmReissue(row)}>
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ms-1.5">
                              {isRtl ? 'تأیید باطل و صدور جدید' : 'Confirm revoke & reissue'}
                            </span>
                          </Button>
                          <Button variant="ghost" disabled={busy} onClick={() => setReissueId(null)}>
                            {isRtl ? 'انصراف' : 'Cancel'}
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-4 rounded-xl border bg-background p-4">
                        <h5 className="flex items-center gap-2 font-semibold">
                          <CalendarPlus className="h-4 w-4 text-emerald-700" />
                          {isRtl ? 'انقضا و وضعیت' : 'Expiry & status'}
                        </h5>
                        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{isRtl ? 'دارای تاریخ انقضا' : 'Has expiry'}</p>
                            <p className="text-xs text-muted-foreground">
                              {hasExpiry
                                ? isRtl
                                  ? 'لایسنس در تاریخ مشخص منقضی می‌شود'
                                  : 'License expires on a set date'
                                : isRtl
                                  ? 'بدون انقضا تا زمان ابطال'
                                  : 'No expiry until revoked'}
                            </p>
                          </div>
                          <Switch
                            checked={hasExpiry}
                            onCheckedChange={(checked) =>
                              setDraftHasExpiry((prev) => ({ ...prev, [row.enrollmentId]: checked }))
                            }
                          />
                        </div>
                        {hasExpiry ? (
                          <div className="space-y-2">
                            <Label>{isRtl ? 'تاریخ انقضا' : 'Expiry date'}</Label>
                            <FlatpickrDateTimePicker
                              mode="date"
                              value={draftExpires[row.enrollmentId]}
                              onChange={(date) =>
                                setDraftExpires((prev) => ({
                                  ...prev,
                                  [row.enrollmentId]: date,
                                }))
                              }
                              locale={locale === 'fa' ? 'fa' : 'en'}
                              isRtl={isRtl}
                              placeholder={isRtl ? 'انتخاب تاریخ انقضا' : 'Select expiry date'}
                            />
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" disabled={busy} onClick={() => void saveExpiry(row)}>
                            <Save className="h-3.5 w-3.5 me-1" />
                            {isRtl ? 'ذخیره انقضا' : 'Save expiry'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !canToggleStatus}
                            onClick={() => void runStatus(row, true)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                            {isRtl ? 'فعال‌سازی' : 'Activate'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy || !canToggleStatus || !row.isDesktopLicenseActive}
                            onClick={() => void runStatus(row, false)}
                          >
                            <Ban className="h-3.5 w-3.5 me-1" />
                            {isRtl ? 'باطل کردن' : 'Revoke'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busy}
                            onClick={() => void deleteLicense(row)}
                          >
                            <Trash2 className="h-3.5 w-3.5 me-1" />
                            {isRtl ? 'حذف کامل' : 'Delete permanently'}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-xl border bg-background p-4">
                        <h5 className="flex items-center gap-2 font-semibold">
                          <Monitor className="h-4 w-4 text-emerald-700" />
                          {isRtl ? 'محدودیت دستگاه' : 'Device limits'}
                        </h5>
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
                                        allowedOs: toggleOsFlag(limits.allowedOs, bit, checked === true),
                                      },
                                    }))
                                  }
                                />
                                {osLabel(bit, isRtl)}
                              </label>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" disabled={busy} onClick={() => void saveLimits(row.enrollmentId)}>
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          <span className="ms-1.5">{isRtl ? 'ذخیره محدودیت‌ها' : 'Save limits'}</span>
                        </Button>
                      </div>

                      <div className="space-y-4 rounded-xl border bg-background p-4 lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-semibold">{isRtl ? 'دسترسی محتوا' : 'Content access'}</h5>
                          <div className="flex items-center gap-2 rounded-full border px-2.5 py-1">
                            <span className="text-xs text-muted-foreground">
                              {isRtl ? 'دسترسی کامل' : 'Full access'}
                            </span>
                            <Switch
                              checked={!isPartial}
                              onCheckedChange={(checked) =>
                                setDraftPartial((prev) => ({ ...prev, [row.enrollmentId]: !checked }))
                              }
                            />
                          </div>
                        </div>
                        {isPartial ? (
                          <LessonAccessPicker
                            isRtl={isRtl}
                            curriculum={curriculum}
                            selectedLessonIds={selectedLessons}
                            onChange={(ids) =>
                              setDraftLessons((prev) => ({ ...prev, [row.enrollmentId]: ids }))
                            }
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {isRtl
                              ? 'این لایسنس دسترسی کامل به همه بخش‌های دوره دارد.'
                              : 'This license has full access to all course sections.'}
                          </p>
                        )}
                        <Button size="sm" disabled={busy} onClick={() => void saveLessons(row)}>
                          <Save className="h-3.5 w-3.5 me-1" />
                          {isRtl ? 'ذخیره دسترسی محتوا' : 'Save content access'}
                        </Button>
                      </div>

                      <div className="space-y-3 rounded-xl border bg-background p-4 lg:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-semibold">{isRtl ? 'دستگاه‌های ثبت‌شده' : 'Registered devices'}</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void handleResetAllDevices(row.enrollmentId, row.courseTitle)}
                          >
                            <RefreshCw className="h-3.5 w-3.5 me-1" />
                            {isRtl ? 'ریست همه دستگاه‌ها' : 'Reset all devices'}
                          </Button>
                        </div>
                        {devices.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {isRtl ? 'دستگاهی ثبت نشده است.' : 'No devices registered.'}
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {devices.map((device) => (
                              <li
                                key={device.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                              >
                                <div>
                                  <p className="font-medium">{device.machineName ?? device.deviceId}</p>
                                  <p className="font-mono text-xs text-muted-foreground">{device.deviceId}</p>
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
                                      variant="outline"
                                      disabled={busy}
                                      onClick={() => void handleRevokeDevice(row.enrollmentId, device.deviceId)}
                                    >
                                      <Ban className="h-3.5 w-3.5 me-1" />
                                      {isRtl ? 'لغو' : 'Revoke'}
                                    </Button>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
