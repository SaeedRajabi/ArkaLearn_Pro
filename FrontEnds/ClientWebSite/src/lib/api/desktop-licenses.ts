import { apiRequest } from './client';
import { unwrapApiList } from './normalize-list';
import { asLongId } from '@/lib/id';

const BASE = 'DesktopDrm';

/** 0 TopLeft, 1 TopRight, 2 BottomLeft, 3 BottomRight, 4 Center */
export type WatermarkPosition = 0 | 1 | 2 | 3 | 4;
/** 0 None, 1 Diagonal */
export type WatermarkMovement = 0 | 1;
/** Windows=1, Mac=2, Linux=4 (bit flags) */
export type DesktopOsFlags = number;
/** 0 Full, 1 Partial */
export type ContentAccessMode = 0 | 1;

export const WATERMARK_TOKENS = [
  'FullName',
  'Email',
  'Phone',
  'UserName',
  'CourseTitle',
] as const;

export type WatermarkToken = (typeof WATERMARK_TOKENS)[number];

export type CourseWatermarkPolicy = {
  courseId: number;
  textTemplate: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  position: WatermarkPosition;
  rotationDeg: number;
  movement: WatermarkMovement;
  paddingPx: number;
  platformLogoLocked: boolean;
  updatedAtUtc?: string | null;
};

export type CourseLicenseEnrollment = {
  enrollmentId: number;
  studentId: number;
  userId: number;
  studentName: string;
  desktopLicenseKey?: string | null;
  isDesktopLicenseActive: boolean;
  desktopLicenseExpiresAtUtc?: string | null;
  isCurrentlyValid: boolean;
  maxDevices: number;
  allowedOs: DesktopOsFlags;
  contentAccessMode: ContentAccessMode;
  allowedLessonIds: number[];
  activeDeviceCount: number;
};

export type LicenseDeviceBinding = {
  id: number;
  enrollmentId: number;
  deviceId: string;
  osFamily: DesktopOsFlags;
  machineName?: string | null;
  activatedAtUtc: string;
  revokedAtUtc?: string | null;
  revokeReason?: string | null;
  isActive: boolean;
};

export type CourseDesktopAnalytics = {
  courseId: number;
  lessons: {
    lessonId: number;
    lessonTitle: string;
    totalWatchedSeconds: number;
    uniqueViewerCount: number;
    eventCount: number;
  }[];
  students: {
    userId: number;
    enrollmentId?: number | null;
    studentName?: string | null;
    totalWatchedSeconds: number;
    lessonsTouched: number;
    lastActivityUtc?: string | null;
  }[];
};

export type TeacherStudentSatisfaction = {
  id: number;
  courseId: number;
  enrollmentId: number;
  teacherUserId: number;
  studentUserId: number;
  studentName?: string | null;
  score: number;
  note?: string | null;
  updatedAtUtc: string;
};

function num(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && v !== '') return Number(v);
  }
  return 0;
}

function str(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && String(v).trim()) return String(v);
  }
  return '';
}

function bool(raw: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = raw[key];
    if (v != null) return Boolean(v);
  }
  return false;
}

function numArray(raw: Record<string, unknown>, ...keys: string[]): number[] {
  for (const key of keys) {
    const v = raw[key];
    if (Array.isArray(v)) {
      return v.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
    }
    if (v && typeof v === 'object') {
      const list = unwrapApiList<unknown>(v);
      if (list.length > 0) {
        return list.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
      }
    }
  }
  return [];
}

function unwrapDetail(raw: unknown): Record<string, unknown> | null {
  let cur: unknown = raw;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null;
    const obj = cur as Record<string, unknown>;
    const next = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj.result ?? obj.Result;
    if (!next || next === cur) return obj;
    cur = next;
  }
  return null;
}

function normalizeWatermark(raw: Record<string, unknown>): CourseWatermarkPolicy {
  return {
    courseId: num(raw, 'courseId', 'CourseId'),
    textTemplate: str(raw, 'textTemplate', 'TextTemplate') || '{FullName} | {Email}',
    fontSize: num(raw, 'fontSize', 'FontSize') || 16,
    fontColor: str(raw, 'fontColor', 'FontColor') || '#FFFFFF',
    opacity: Number(raw.opacity ?? raw.Opacity ?? 0.55),
    position: Math.min(4, Math.max(0, num(raw, 'position', 'Position'))) as WatermarkPosition,
    rotationDeg: Number(raw.rotationDeg ?? raw.RotationDeg ?? 0),
    movement: Math.min(1, Math.max(0, num(raw, 'movement', 'Movement'))) as WatermarkMovement,
    paddingPx: num(raw, 'paddingPx', 'PaddingPx') || 16,
    platformLogoLocked: bool(raw, 'platformLogoLocked', 'PlatformLogoLocked') || true,
    updatedAtUtc: (raw.updatedAtUtc ?? raw.UpdatedAtUtc ?? null) as string | null,
  };
}

function normalizeCourseLicense(raw: Record<string, unknown>): CourseLicenseEnrollment {
  return {
    enrollmentId: num(raw, 'enrollmentId', 'EnrollmentId'),
    studentId: num(raw, 'studentId', 'StudentId'),
    userId: num(raw, 'userId', 'UserId'),
    studentName: str(raw, 'studentName', 'StudentName'),
    desktopLicenseKey: (raw.desktopLicenseKey ?? raw.DesktopLicenseKey ?? null) as string | null,
    isDesktopLicenseActive: bool(raw, 'isDesktopLicenseActive', 'IsDesktopLicenseActive'),
    desktopLicenseExpiresAtUtc: (raw.desktopLicenseExpiresAtUtc ?? raw.DesktopLicenseExpiresAtUtc ?? null) as string | null,
    isCurrentlyValid: bool(raw, 'isCurrentlyValid', 'IsCurrentlyValid'),
    maxDevices: num(raw, 'maxDevices', 'MaxDevices') || 1,
    allowedOs: num(raw, 'allowedOs', 'AllowedOs') || 1,
    contentAccessMode: Math.min(1, Math.max(0, num(raw, 'contentAccessMode', 'ContentAccessMode'))) as ContentAccessMode,
    allowedLessonIds: numArray(raw, 'allowedLessonIds', 'AllowedLessonIds'),
    activeDeviceCount: num(raw, 'activeDeviceCount', 'ActiveDeviceCount'),
  };
}

function normalizeDevice(raw: Record<string, unknown>): LicenseDeviceBinding {
  return {
    id: num(raw, 'id', 'Id'),
    enrollmentId: num(raw, 'enrollmentId', 'EnrollmentId'),
    deviceId: str(raw, 'deviceId', 'DeviceId'),
    osFamily: num(raw, 'osFamily', 'OsFamily'),
    machineName: (raw.machineName ?? raw.MachineName ?? null) as string | null,
    activatedAtUtc: str(raw, 'activatedAtUtc', 'ActivatedAtUtc'),
    revokedAtUtc: (raw.revokedAtUtc ?? raw.RevokedAtUtc ?? null) as string | null,
    revokeReason: (raw.revokeReason ?? raw.RevokeReason ?? null) as string | null,
    isActive: bool(raw, 'isActive', 'IsActive'),
  };
}

function normalizeAnalytics(raw: Record<string, unknown>): CourseDesktopAnalytics {
  const lessons = unwrapApiList<Record<string, unknown>>(raw.lessons ?? raw.Lessons).map((row) => ({
    lessonId: num(row, 'lessonId', 'LessonId'),
    lessonTitle: str(row, 'lessonTitle', 'LessonTitle'),
    totalWatchedSeconds: num(row, 'totalWatchedSeconds', 'TotalWatchedSeconds'),
    uniqueViewerCount: num(row, 'uniqueViewerCount', 'UniqueViewerCount'),
    eventCount: num(row, 'eventCount', 'EventCount'),
  }));
  const students = unwrapApiList<Record<string, unknown>>(raw.students ?? raw.Students).map((row) => ({
    userId: num(row, 'userId', 'UserId'),
    enrollmentId: num(row, 'enrollmentId', 'EnrollmentId') || null,
    studentName: (row.studentName ?? row.StudentName ?? null) as string | null,
    totalWatchedSeconds: num(row, 'totalWatchedSeconds', 'TotalWatchedSeconds'),
    lessonsTouched: num(row, 'lessonsTouched', 'LessonsTouched'),
    lastActivityUtc: (row.lastActivityUtc ?? row.LastActivityUtc ?? null) as string | null,
  }));
  return {
    courseId: num(raw, 'courseId', 'CourseId'),
    lessons,
    students,
  };
}

function normalizeSatisfaction(raw: Record<string, unknown>): TeacherStudentSatisfaction {
  return {
    id: num(raw, 'id', 'Id'),
    courseId: num(raw, 'courseId', 'CourseId'),
    enrollmentId: num(raw, 'enrollmentId', 'EnrollmentId'),
    teacherUserId: num(raw, 'teacherUserId', 'TeacherUserId'),
    studentUserId: num(raw, 'studentUserId', 'StudentUserId'),
    studentName: (raw.studentName ?? raw.StudentName ?? null) as string | null,
    score: num(raw, 'score', 'Score'),
    note: (raw.note ?? raw.Note ?? null) as string | null,
    updatedAtUtc: str(raw, 'updatedAtUtc', 'UpdatedAtUtc'),
  };
}

export function osFlagsHas(flags: DesktopOsFlags, bit: 1 | 2 | 4): boolean {
  return (flags & bit) === bit;
}

export function toggleOsFlag(flags: DesktopOsFlags, bit: 1 | 2 | 4, enabled: boolean): DesktopOsFlags {
  if (enabled) return flags | bit;
  return flags & ~bit;
}

export function defaultWatermarkPolicy(courseId: number): CourseWatermarkPolicy {
  return {
    courseId,
    textTemplate: '{FullName} | {Email}',
    fontSize: 16,
    fontColor: '#FFFFFF',
    opacity: 0.55,
    position: 3,
    rotationDeg: 0,
    movement: 0,
    paddingPx: 16,
    platformLogoLocked: true,
  };
}

export async function getCourseWatermarkPolicy(courseId: number): Promise<CourseWatermarkPolicy | null> {
  const raw = await apiRequest<unknown>(`${BASE}/WatermarkPolicy?courseId=${courseId}`);
  const layer = unwrapDetail(raw);
  if (!layer) return null;
  if (layer.courseId == null && layer.CourseId == null && !layer.textTemplate && !layer.TextTemplate) {
    return null;
  }
  return normalizeWatermark(layer);
}

export async function updateCourseWatermarkPolicy(body: {
  courseId: number;
  textTemplate: string;
  fontSize: number;
  fontColor: string;
  opacity: number;
  position: WatermarkPosition;
  rotationDeg: number;
  movement: WatermarkMovement;
  paddingPx: number;
}): Promise<CourseWatermarkPolicy> {
  const raw = await apiRequest<unknown>(`${BASE}/WatermarkPolicy`, {
    method: 'POST',
    body,
  });
  const layer = unwrapDetail(raw) ?? (raw as Record<string, unknown>);
  return normalizeWatermark(layer);
}

export async function getCourseLicenses(courseId: number): Promise<CourseLicenseEnrollment[]> {
  const raw = await apiRequest<unknown>(`${BASE}/CourseLicenses?courseId=${courseId}`);
  return unwrapApiList<Record<string, unknown>>(raw).map(normalizeCourseLicense);
}

export async function updateLicenseLimits(body: {
  enrollmentId: string | number;
  maxDevices: number;
  allowedOs: DesktopOsFlags;
}): Promise<void> {
  await apiRequest<unknown>(`${BASE}/LicenseLimits`, {
    method: 'POST',
    body: {
      enrollmentId: String(body.enrollmentId),
      maxDevices: body.maxDevices,
      allowedOs: body.allowedOs,
    },
  });
}

export async function updateLicenseLessonAccess(body: {
  enrollmentId: string | number;
  lessonIds: number[];
}): Promise<number[]> {
  const raw = await apiRequest<unknown>(`${BASE}/LicenseLessonAccess`, {
    method: 'POST',
    body: { enrollmentId: String(body.enrollmentId), lessonIds: body.lessonIds },
  });
  const layer = unwrapDetail(raw) ?? (raw as Record<string, unknown>);
  return numArray(layer, 'allowedLessonIds', 'AllowedLessonIds');
}

export async function getLicenseDevices(enrollmentId: string | number): Promise<LicenseDeviceBinding[]> {
  const raw = await apiRequest<unknown>(
    `${BASE}/LicenseDevices?enrollmentId=${encodeURIComponent(String(enrollmentId))}`
  );
  return unwrapApiList<Record<string, unknown>>(raw).map(normalizeDevice);
}

export async function revokeLicenseDevice(body: {
  enrollmentId: string | number;
  deviceId: string;
  reason?: string;
}): Promise<void> {
  await apiRequest<unknown>(`${BASE}/RevokeLicenseDevice`, {
    method: 'POST',
    body: {
      enrollmentId: String(body.enrollmentId),
      deviceId: body.deviceId,
      reason: body.reason,
    },
  });
}

/** Clears all bound machines + playback grants so the student can activate on a fresh PC. */
export async function resetLicenseDevices(body: {
  enrollmentId: string | number;
  reason?: string;
}): Promise<{ enrollmentId: number; revokedDeviceCount: number; cleared: boolean }> {
  const raw = await apiRequest<unknown>(`${BASE}/ResetLicenseDevices`, {
    method: 'POST',
    body: {
      enrollmentId: String(body.enrollmentId),
      reason: body.reason,
    },
  });
  const layer = unwrapDetail(raw) ?? (raw as Record<string, unknown>);
  return {
    enrollmentId: num(layer, 'enrollmentId', 'EnrollmentId'),
    revokedDeviceCount: num(layer, 'revokedDeviceCount', 'RevokedDeviceCount'),
    cleared: Boolean(layer.cleared ?? layer.Cleared ?? true),
  };
}

export async function getCourseDesktopAnalytics(courseId: number): Promise<CourseDesktopAnalytics> {
  const raw = await apiRequest<unknown>(`${BASE}/CourseAnalytics?courseId=${courseId}`);
  const layer = unwrapDetail(raw) ?? (raw as Record<string, unknown>);
  return normalizeAnalytics(layer);
}

export async function getTeacherStudentSatisfaction(params: {
  courseId?: number;
  enrollmentId?: number;
}): Promise<TeacherStudentSatisfaction[]> {
  const qs = new URLSearchParams();
  if (params.courseId) qs.set('courseId', String(params.courseId));
  if (params.enrollmentId) qs.set('enrollmentId', String(params.enrollmentId));
  const raw = await apiRequest<unknown>(`${BASE}/TeacherStudentSatisfaction?${qs.toString()}`);
  return unwrapApiList<Record<string, unknown>>(raw).map(normalizeSatisfaction);
}

export async function upsertTeacherStudentSatisfaction(body: {
  enrollmentId: number;
  score: number;
  note?: string;
}): Promise<TeacherStudentSatisfaction> {
  const raw = await apiRequest<unknown>(`${BASE}/TeacherStudentSatisfaction`, {
    method: 'POST',
    body,
  });
  const layer = unwrapDetail(raw) ?? (raw as Record<string, unknown>);
  return normalizeSatisfaction(layer);
}

export function previewWatermarkText(
  template: string,
  sample: { fullName: string; email: string; phone: string; userName: string; courseTitle: string }
): string {
  return template
    .replace(/\{FullName\}/gi, sample.fullName)
    .replace(/\{Email\}/gi, sample.email)
    .replace(/\{Phone\}/gi, sample.phone)
    .replace(/\{UserName\}/gi, sample.userName)
    .replace(/\{CourseTitle\}/gi, sample.courseTitle);
}

export type WatermarkPositionStyle = {
  position: 'absolute';
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  transform?: string;
};

export function watermarkPositionStyle(
  position: WatermarkPosition,
  paddingPx: number
): WatermarkPositionStyle {
  const base: WatermarkPositionStyle = { position: 'absolute' };
  switch (position) {
    case 0:
      return { ...base, top: paddingPx, left: paddingPx };
    case 1:
      return { ...base, top: paddingPx, right: paddingPx };
    case 2:
      return { ...base, bottom: paddingPx, left: paddingPx };
    case 3:
      return { ...base, bottom: paddingPx, right: paddingPx };
    case 4:
    default:
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
}

export type StudentDesktopLicense = {
  enrollmentId: string;
  userId: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  desktopLicenseKey?: string | null;
  isDesktopLicenseActive: boolean;
  desktopLicenseExpiresAtUtc?: string | null;
  isCurrentlyValid: boolean;
  enrollmentDateTime: string;
  maxDevices: number;
  allowedOs: DesktopOsFlags;
  contentAccessMode: ContentAccessMode;
  allowedLessonIds: number[];
  activeDeviceCount: number;
};

function normalize(raw: Record<string, unknown>): StudentDesktopLicense {
  return {
    enrollmentId: asLongId(raw.enrollmentId ?? raw.EnrollmentId),
    userId: asLongId(raw.userId ?? raw.UserId),
    studentId: asLongId(raw.studentId ?? raw.StudentId),
    courseId: asLongId(raw.courseId ?? raw.CourseId),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    desktopLicenseKey: (raw.desktopLicenseKey ?? raw.DesktopLicenseKey ?? null) as string | null,
    isDesktopLicenseActive: Boolean(raw.isDesktopLicenseActive ?? raw.IsDesktopLicenseActive ?? true),
    desktopLicenseExpiresAtUtc: (raw.desktopLicenseExpiresAtUtc ?? raw.DesktopLicenseExpiresAtUtc ?? null) as string | null,
    isCurrentlyValid: Boolean(raw.isCurrentlyValid ?? raw.IsCurrentlyValid ?? false),
    enrollmentDateTime: String(raw.enrollmentDateTime ?? raw.EnrollmentDateTime ?? ''),
    maxDevices: Number(raw.maxDevices ?? raw.MaxDevices ?? 1) || 1,
    allowedOs: Number(raw.allowedOs ?? raw.AllowedOs ?? 1) || 1,
    contentAccessMode: Math.min(
      1,
      Math.max(0, Number(raw.contentAccessMode ?? raw.ContentAccessMode ?? 0))
    ) as ContentAccessMode,
    allowedLessonIds: numArray(raw, 'allowedLessonIds', 'AllowedLessonIds'),
    activeDeviceCount: Number(raw.activeDeviceCount ?? raw.ActiveDeviceCount ?? 0) || 0,
  };
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const obj = raw as Record<string, unknown>;
  const nested = obj?.data ?? obj?.Data ?? obj?.queryResult ?? obj?.QueryResult;
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (nested && typeof nested === 'object' && Array.isArray((nested as { $values?: unknown[] }).$values)) {
    return (nested as { $values: Record<string, unknown>[] }).$values;
  }
  return [];
}

export async function getStudentDesktopLicenses(userId: string | number): Promise<StudentDesktopLicense[]> {
  const raw = await apiRequest<unknown>(`${BASE}/StudentDesktopLicenses?userId=${encodeURIComponent(String(userId))}`);
  return unwrapList(raw).map(normalize);
}

export async function createStudentDesktopLicense(body: {
  userId: string | number;
  courseId: number | string;
  expiresAtUtc?: string | null;
  replaceExisting?: boolean;
}): Promise<{ enrollmentId: string; courseId: number; desktopLicenseKey?: string | null }> {
  const raw = await apiRequest<unknown>(`${BASE}/CreateStudentDesktopLicense`, {
    method: 'POST',
    body: {
      userId: String(body.userId),
      courseId: String(body.courseId),
      expiresAtUtc: body.expiresAtUtc ?? null,
      replaceExisting: body.replaceExisting === true,
    },
  });
  const layer = unwrapDetail(raw) ?? (raw as Record<string, unknown>);
  return {
    enrollmentId: asLongId(layer.enrollmentId ?? layer.EnrollmentId),
    courseId: num(layer, 'courseId', 'CourseId'),
    desktopLicenseKey: (layer.desktopLicenseKey ?? layer.DesktopLicenseKey ?? null) as string | null,
  };
}

/** Student requests a desktop license after purchasing a course (notifies instructor). */
export async function requestDesktopLicense(courseId: number | string): Promise<string> {
  const raw = await apiRequest<{ result?: string; Result?: string; data?: string; Data?: string }>(
    `${BASE}/RequestDesktopLicense`,
    {
      method: 'POST',
      body: { courseId: Number(courseId) },
    },
  );
  return String(raw?.result ?? raw?.Result ?? raw?.data ?? raw?.Data ?? 'ok');
}

export async function revokeStudentDesktopLicense(enrollmentId: string | number) {
  return apiRequest<Record<string, unknown>>(`${BASE}/RevokeStudentDesktopLicense`, {
    method: 'POST',
    body: { enrollmentId: String(enrollmentId) },
  });
}

export async function renewStudentDesktopLicense(
  enrollmentId: string | number,
  expiresAtUtc?: string | null
) {
  return apiRequest<Record<string, unknown>>(`${BASE}/RenewStudentDesktopLicense`, {
    method: 'POST',
    body: { enrollmentId: String(enrollmentId), expiresAtUtc: expiresAtUtc ?? null },
  });
}

export async function regenerateStudentDesktopLicense(
  enrollmentId: string | number,
  expiresAtUtc?: string | null
) {
  return apiRequest<Record<string, unknown>>(`${BASE}/RegenerateStudentDesktopLicense`, {
    method: 'POST',
    body: { enrollmentId: String(enrollmentId), expiresAtUtc: expiresAtUtc ?? null },
  });
}

export async function deleteStudentDesktopLicense(enrollmentId: string | number) {
  return apiRequest<Record<string, unknown>>(`${BASE}/DeleteStudentDesktopLicense`, {
    method: 'POST',
    body: { enrollmentId: String(enrollmentId) },
  });
}
