import apiClient from '@/lib/apiClient';

const BASE = 'DesktopDrm';

export type StudentDesktopLicense = {
  enrollmentId: number;
  userId: number;
  studentId: number;
  studentName?: string | null;
  courseId: number;
  courseTitle: string;
  teacherId?: number | null;
  teacherName?: string | null;
  desktopLicenseKey?: string | null;
  isEnrollmentActive: boolean;
  isDesktopLicenseActive: boolean;
  desktopLicenseExpiresAtUtc?: string | null;
  isCurrentlyValid: boolean;
  enrollmentDateTime: string;
  maxDevices: number;
  allowedOs: number;
  activeDeviceCount: number;
};

export type DesktopLicenseActionResult = {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  desktopLicenseKey?: string | null;
  isDesktopLicenseActive: boolean;
  desktopLicenseExpiresAtUtc?: string | null;
  isCurrentlyValid: boolean;
};

function unwrap<T>(raw: unknown): T {
  const root = raw as Record<string, unknown> | null | undefined;
  if (!root) return {} as T;
  const nested = root.data ?? root.Data ?? root.result ?? root.Result;
  return (nested ?? root) as T;
}

function normalizeLicense(raw: Record<string, unknown>): StudentDesktopLicense {
  return {
    enrollmentId: Number(raw.enrollmentId ?? raw.EnrollmentId ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    studentId: Number(raw.studentId ?? raw.StudentId ?? 0),
    studentName: (raw.studentName ?? raw.StudentName ?? null) as string | null,
    courseId: Number(raw.courseId ?? raw.CourseId ?? 0),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    teacherId: raw.teacherId != null || raw.TeacherId != null ? Number(raw.teacherId ?? raw.TeacherId) : null,
    teacherName: (raw.teacherName ?? raw.TeacherName ?? null) as string | null,
    desktopLicenseKey: (raw.desktopLicenseKey ?? raw.DesktopLicenseKey ?? null) as string | null,
    isEnrollmentActive: Boolean(raw.isEnrollmentActive ?? raw.IsEnrollmentActive ?? raw.isActive ?? raw.IsActive),
    isDesktopLicenseActive: Boolean(raw.isDesktopLicenseActive ?? raw.IsDesktopLicenseActive ?? true),
    desktopLicenseExpiresAtUtc: (raw.desktopLicenseExpiresAtUtc ?? raw.DesktopLicenseExpiresAtUtc ?? null) as string | null,
    isCurrentlyValid: Boolean(raw.isCurrentlyValid ?? raw.IsCurrentlyValid ?? false),
    enrollmentDateTime: String(raw.enrollmentDateTime ?? raw.EnrollmentDateTime ?? ''),
    maxDevices: Math.max(1, Number(raw.maxDevices ?? raw.MaxDevices ?? 1) || 1),
    allowedOs: Number(raw.allowedOs ?? raw.AllowedOs ?? 1) || 1,
    activeDeviceCount: Math.max(0, Number(raw.activeDeviceCount ?? raw.ActiveDeviceCount ?? 0) || 0),
  };
}

function normalizeResult(raw: Record<string, unknown>): DesktopLicenseActionResult {
  return {
    enrollmentId: Number(raw.enrollmentId ?? raw.EnrollmentId ?? 0),
    courseId: Number(raw.courseId ?? raw.CourseId ?? 0),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    desktopLicenseKey: (raw.desktopLicenseKey ?? raw.DesktopLicenseKey ?? null) as string | null,
    isDesktopLicenseActive: Boolean(raw.isDesktopLicenseActive ?? raw.IsDesktopLicenseActive ?? true),
    desktopLicenseExpiresAtUtc: (raw.desktopLicenseExpiresAtUtc ?? raw.DesktopLicenseExpiresAtUtc ?? null) as string | null,
    isCurrentlyValid: Boolean(raw.isCurrentlyValid ?? raw.IsCurrentlyValid ?? false),
  };
}

export async function getStudentDesktopLicenses(params: {
  userId?: string | number;
  studentId?: string | number;
}): Promise<StudentDesktopLicense[]> {
  const { data } = await apiClient.get(`${BASE}/StudentDesktopLicenses`, {
    params: {
      userId: params.userId ?? 0,
      studentId: params.studentId ?? 0,
    },
    withCredentials: true,
  });
  const payload = unwrap<unknown>(data);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { queryResult?: unknown })?.queryResult)
      ? ((payload as { queryResult: unknown[] }).queryResult)
      : [];
  return list.map((row) => normalizeLicense(row as Record<string, unknown>));
}

export async function createStudentDesktopLicense(body: {
  userId: string | number;
  courseId: number;
  expiresAtUtc?: string | null;
}): Promise<DesktopLicenseActionResult> {
  const { data } = await apiClient.post(
    `${BASE}/CreateStudentDesktopLicense`,
    {
      userId: String(body.userId),
      courseId: body.courseId,
      expiresAtUtc: body.expiresAtUtc ?? null,
    },
    { withCredentials: true }
  );
  return normalizeResult(unwrap<Record<string, unknown>>(data));
}

export async function revokeStudentDesktopLicense(enrollmentId: number): Promise<DesktopLicenseActionResult> {
  const { data } = await apiClient.post(`${BASE}/RevokeStudentDesktopLicense`, { enrollmentId }, { withCredentials: true });
  return normalizeResult(unwrap<Record<string, unknown>>(data));
}

export async function deleteStudentDesktopLicense(enrollmentId: number): Promise<DesktopLicenseActionResult> {
  const { data } = await apiClient.post(
    `${BASE}/DeleteStudentDesktopLicense`,
    { enrollmentId },
    { withCredentials: true }
  );
  return normalizeResult(unwrap<Record<string, unknown>>(data));
}

export async function renewStudentDesktopLicense(body: {
  enrollmentId: number;
  expiresAtUtc?: string | null;
}): Promise<DesktopLicenseActionResult> {
  const { data } = await apiClient.post(`${BASE}/RenewStudentDesktopLicense`, body, { withCredentials: true });
  return normalizeResult(unwrap<Record<string, unknown>>(data));
}

export async function regenerateStudentDesktopLicense(body: {
  enrollmentId: number;
  expiresAtUtc?: string | null;
}): Promise<DesktopLicenseActionResult> {
  const { data } = await apiClient.post(`${BASE}/RegenerateStudentDesktopLicense`, body, { withCredentials: true });
  return normalizeResult(unwrap<Record<string, unknown>>(data));
}

export type LicenseDeviceBinding = {
  deviceId: string;
  machineName?: string | null;
  osFamily?: number;
  activatedAtUtc?: string | null;
  revokedAtUtc?: string | null;
  isActive: boolean;
};

function normalizeDevice(raw: Record<string, unknown>): LicenseDeviceBinding {
  return {
    deviceId: String(raw.deviceId ?? raw.DeviceId ?? ''),
    machineName: (raw.machineName ?? raw.MachineName ?? null) as string | null,
    osFamily: raw.osFamily != null || raw.OsFamily != null ? Number(raw.osFamily ?? raw.OsFamily) : undefined,
    activatedAtUtc: (raw.activatedAtUtc ?? raw.ActivatedAtUtc ?? null) as string | null,
    revokedAtUtc: (raw.revokedAtUtc ?? raw.RevokedAtUtc ?? null) as string | null,
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? !(raw.revokedAtUtc ?? raw.RevokedAtUtc)),
  };
}

export async function getLicenseDevices(enrollmentId: number): Promise<LicenseDeviceBinding[]> {
  const { data } = await apiClient.get(`${BASE}/LicenseDevices`, {
    params: { enrollmentId },
    withCredentials: true,
  });
  const payload = unwrap<unknown>(data);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { queryResult?: unknown })?.queryResult)
      ? ((payload as { queryResult: unknown[] }).queryResult)
      : [];
  return list.map((row) => normalizeDevice(row as Record<string, unknown>));
}

export async function revokeLicenseDevice(body: {
  enrollmentId: number;
  deviceId: string;
  reason?: string;
}): Promise<void> {
  await apiClient.post(
    `${BASE}/RevokeLicenseDevice`,
    {
      enrollmentId: body.enrollmentId,
      deviceId: body.deviceId,
      reason: body.reason ?? null,
    },
    { withCredentials: true }
  );
}

export async function resetLicenseDevices(body: {
  enrollmentId: number;
  reason?: string;
}): Promise<{ enrollmentId: number; revokedDeviceCount: number; cleared: boolean }> {
  const { data } = await apiClient.post(
    `${BASE}/ResetLicenseDevices`,
    {
      enrollmentId: body.enrollmentId,
      reason: body.reason ?? null,
    },
    { withCredentials: true }
  );
  const layer = unwrap<Record<string, unknown>>(data);
  return {
    enrollmentId: Number(layer.enrollmentId ?? layer.EnrollmentId ?? body.enrollmentId),
    revokedDeviceCount: Number(layer.revokedDeviceCount ?? layer.RevokedDeviceCount ?? 0),
    cleared: Boolean(layer.cleared ?? layer.Cleared ?? true),
  };
}

export async function updateLicenseLimits(body: {
  enrollmentId: number;
  maxDevices: number;
  allowedOs: number;
}): Promise<void> {
  await apiClient.post(
    `${BASE}/LicenseLimits`,
    {
      enrollmentId: body.enrollmentId,
      maxDevices: body.maxDevices,
      allowedOs: body.allowedOs,
    },
    { withCredentials: true }
  );
}
