import { API_BASE_URL } from './config';
import {apiRequest, buildQuery} from './client';
import type {
  CourseQri,
  CourseQriRaw,
  FavoriteCourseQri,
  GetAllPopularCourseQri,
  PagedData,
  PagedResponseRaw,
  SearchCourseQri,
} from './types';
import {normalizeCourseDetailResponse, normalizePagedResponse} from './types';
import type { MyCourse } from '@/types';
import { unwrapApiList } from '@/lib/api/normalize-list';

const BASE = 'Course';

function normalizeArray<T>(raw: T[] | { $values?: T[] } | null | undefined): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && '$values' in raw && Array.isArray((raw as { $values?: T[] }).$values))
    return (raw as { $values: T[] }).$values;
  return [];
}

export async function getCourseBySlug(slug: string): Promise<CourseQri | null> {
  try {
    const path = `${BASE}/GetBySlug${buildQuery({ slug })}`;
    const raw = await apiRequest<CourseQriRaw>(path);
    return normalizeCourseDetailResponse(raw);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 404 || status === 204) return null;
    }
    throw e;
  }
}

export async function getCourseById(courseId: number): Promise<CourseQri | null> {
  try {
    const path = `${BASE}/GetById${buildQuery({ courseId })}`;
    const raw = await apiRequest<CourseQriRaw>(path);
    return normalizeCourseDetailResponse(raw);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 404 || status === 204) return null;
    }
    throw e;
  }
}

/** جزئیات دوره برای استاد مالک (شامل پیش‌نویس و در انتظار تأیید) */
export async function getMyCourseById(courseId: number): Promise<CourseQri | null> {
  try {
    const path = `${BASE}/GetMyCourseById${buildQuery({ courseId })}`;
    const raw = await apiRequest<CourseQriRaw>(path);
    return normalizeCourseDetailResponse(raw);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 404 || status === 204 || status === 401 || status === 403) return null;
    }
    throw e;
  }
}

export async function searchCourses(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
}): Promise<PagedData<SearchCourseQri>> {
  const { inputValue = '', pageNumber = 1, pageSize = 12, needTotalCount = true } = params;
  const path = `${BASE}/Search${buildQuery({
    inputValue,
    pageNumber,
    pageSize,
    needTotalCount,
  })}`;
  const raw = await apiRequest<PagedResponseRaw<SearchCourseQri>>(path);
  return normalizePagedResponse(raw);
}

export async function getAllPopularCourses(params?: {
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
}): Promise<PagedData<GetAllPopularCourseQri>> {
  const { pageNumber = 1, pageSize = 12, needTotalCount = true } = params ?? {};
  const path = `${BASE}/GetAllPopular${buildQuery({
    pageNumber,
    pageSize,
    needTotalCount,
  })}`;
  const raw = await apiRequest<PagedResponseRaw<GetAllPopularCourseQri>>(path);
  return normalizePagedResponse(raw);
}

function mapMyCourseRow(row: Record<string, unknown>): MyCourse {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    imageUrl: String(row.imageUrl ?? row.ImageUrl ?? ''),
    desktopLicenseKey:
      row.desktopLicenseKey != null
        ? String(row.desktopLicenseKey)
        : row.DesktopLicenseKey != null
          ? String(row.DesktopLicenseKey)
          : undefined,
    onlineClassUrl: (() => {
      const rawUrl = String(row.onlineClassUrl ?? row.OnlineClassUrl ?? '').trim();
      if (!rawUrl || rawUrl === 'Not URL') return undefined;
      if (!/^https?:\/\//i.test(rawUrl)) return undefined;
      return rawUrl;
    })(),
    progress: Number(row.progress ?? row.Progress ?? 0),
    status: String(row.status ?? row.Status ?? 'Active'),
    enrollmentDateTime: String(row.enrollmentDateTime ?? row.EnrollmentDateTime ?? ''),
    isFree: Boolean(row.isFree ?? row.IsFree ?? false),
    price: row.price != null ? Number(row.price) : row.Price != null ? Number(row.Price) : undefined,
    deliveryMode: (() => {
      const rawMode = String(row.deliveryMode ?? row.DeliveryMode ?? 'directDownload').toLowerCase();
      if (rawMode === 'desktoplicense' || rawMode === 'desktop' || rawMode === '2') return 'desktopLicense';
      if (rawMode === 'spotplayerlicense' || rawMode === 'spotplayer' || rawMode === '1') return 'desktopLicense';
      return 'directDownload';
    })(),
    isActive: Boolean(row.isActive ?? row.IsActive ?? true),
    isPendingApproval: Boolean(row.isPendingApproval ?? row.IsPendingApproval ?? false),
    isLicenseRequestPending: Boolean(
      row.isLicenseRequestPending ?? row.IsLicenseRequestPending ?? false,
    ),
    lifecyclePhase: String(row.effectiveLifecyclePhase ?? row.EffectiveLifecyclePhase ?? row.lifecyclePhase ?? row.LifecyclePhase ?? 'notStarted') === 'inProgress'
      ? 'inProgress'
      : String(row.effectiveLifecyclePhase ?? row.EffectiveLifecyclePhase ?? row.lifecyclePhase ?? row.LifecyclePhase ?? 'notStarted') === 'ended'
        ? 'ended'
        : 'notStarted',
    effectiveLifecyclePhase: String(row.effectiveLifecyclePhase ?? row.EffectiveLifecyclePhase ?? row.lifecyclePhase ?? row.LifecyclePhase ?? 'notStarted') === 'inProgress'
      ? 'inProgress'
      : String(row.effectiveLifecyclePhase ?? row.EffectiveLifecyclePhase ?? row.lifecyclePhase ?? row.LifecyclePhase ?? 'notStarted') === 'ended'
        ? 'ended'
        : 'notStarted',
  };
}

/** Enrolled courses for the current user (uses session cookie). */
export async function getMyCourses(): Promise<MyCourse[]> {
  const path = `${BASE}/GetMyCourses`;
  const raw = await apiRequest<unknown>(path);
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapMyCourseRow)
    .filter((c) => c.id > 0);
}

export async function addCourseToFavorites(courseId: number): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/AddToFavorites`, {
    method: 'POST',
    body: { courseId },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function removeCourseFromFavorites(courseId: number): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/RemoveFromFavorites`, {
    method: 'POST',
    body: { courseId },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function getMyFavoriteCourseIds(): Promise<number[]> {
  const raw = await apiRequest<number[] | { $values?: number[] }>(`${BASE}/GetMyFavoriteCourseIds`);
  return normalizeArray(raw).map((x) => Number(x)).filter((x) => !Number.isNaN(x));
}

export async function getMyFavoriteCourses(): Promise<FavoriteCourseQri[]> {
  const raw = await apiRequest<FavoriteCourseQri[] | { $values?: FavoriteCourseQri[] }>(`${BASE}/GetMyFavoriteCourses`);
  return normalizeArray(raw);
}

export async function registerFreeCourse(courseId: number): Promise<string> {
  const result = await apiRequest<string | { result?: string }>(`${BASE}/RegisterFree`, {
    method: 'POST',
    body: { courseId },
  });
  if (typeof result === 'string') return result;
  return result?.result ?? 'OK';
}

export function getLessonVideoStreamUrl(lessonId: string | number): string {
  return `${API_BASE_URL}/Course/StreamLessonVideo?lessonId=${encodeURIComponent(String(lessonId))}`;
}

export function getLessonVideoDownloadUrl(lessonId: string | number): string {
  return `${API_BASE_URL}/Course/DownloadLessonVideo?lessonId=${encodeURIComponent(String(lessonId))}`;
}

export function getAllLessonVideosZipUrl(courseId: string | number): string {
  return `${API_BASE_URL}/Course/DownloadAllLessonVideosZip?courseId=${encodeURIComponent(String(courseId))}`;
}

export type StudentCourseMaterial = {
  id: number | string;
  courseSectionId: number | string;
  courseLessonId?: number | string | null;
  mediaAssetId: number | string;
  displayName: string;
  originalFileName?: string;
  fileSizeBytes?: number;
  downloadUrl?: string;
};

function normalizeStudentCourseMaterial(raw: Record<string, unknown>): StudentCourseMaterial {
  const courseLessonId = raw.courseLessonId ?? raw.CourseLessonId;
  const fileSize = raw.fileSizeBytes ?? raw.FileSizeBytes;
  return {
    id: (raw.id ?? raw.Id ?? 0) as number | string,
    courseSectionId: (raw.courseSectionId ?? raw.CourseSectionId ?? 0) as number | string,
    courseLessonId: courseLessonId == null ? null : (courseLessonId as number | string),
    mediaAssetId: (raw.mediaAssetId ?? raw.MediaAssetId ?? 0) as number | string,
    displayName: String(raw.displayName ?? raw.DisplayName ?? raw.originalFileName ?? raw.OriginalFileName ?? ''),
    originalFileName: String(raw.originalFileName ?? raw.OriginalFileName ?? '') || undefined,
    fileSizeBytes: fileSize == null ? undefined : Number(fileSize),
    downloadUrl: String(raw.downloadUrl ?? raw.DownloadUrl ?? '') || undefined,
  };
}

/** Curriculum files available to the currently enrolled student. */
export async function listCourseMaterialsForStudent(
  courseId: string | number
): Promise<StudentCourseMaterial[]> {
  const raw = await apiRequest<unknown>(
    `CourseMaterial/ListForStudent${buildQuery({ CourseId: String(courseId) })}`
  );
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(normalizeStudentCourseMaterial)
    .filter((material) => String(material.id) !== '0' && String(material.courseSectionId) !== '0');
}

export function getCourseMaterialDownloadUrl(material: StudentCourseMaterial): string {
  const raw = material.downloadUrl?.trim();
  if (!raw) {
    return `${API_BASE_URL}/CourseMaterial/Download?materialId=${encodeURIComponent(String(material.id))}`;
  }
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/?api\/service(?:\/|$)/i.test(raw)) return raw.startsWith('/') ? raw : `/${raw}`;
  return `${API_BASE_URL.replace(/\/$/, '')}/${raw.replace(/^\/+/, '')}`;
}

export type LessonWatchProgress = {
  lessonId: number;
  watchedSeconds: number;
  durationSeconds: number;
  watchedPercent: number;
  isCompleted: boolean;
};

function normalizeLessonProgress(raw: Record<string, unknown>): LessonWatchProgress {
  return {
    lessonId: Number(raw.lessonId ?? raw.LessonId ?? 0),
    watchedSeconds: Number(raw.watchedSeconds ?? raw.WatchedSeconds ?? 0),
    durationSeconds: Number(raw.durationSeconds ?? raw.DurationSeconds ?? 0),
    watchedPercent: Number(raw.watchedPercent ?? raw.WatchedPercent ?? 0),
    isCompleted: Boolean(raw.isCompleted ?? raw.IsCompleted),
  };
}

export async function getMyCourseLessonProgress(courseId: number): Promise<LessonWatchProgress[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyCourseLessonProgress${buildQuery({ courseId })}`);
  const list = unwrapApiList<Record<string, unknown>>(raw);
  return list.map(normalizeLessonProgress).filter((item) => item.lessonId > 0);
}

export async function reportLessonWatchProgress(payload: {
  lessonId: number;
  watchedSeconds: number;
  durationSeconds: number;
}): Promise<LessonWatchProgress> {
  const raw = await apiRequest<unknown>(`${BASE}/ReportLessonWatchProgress`, {
    method: 'POST',
    body: payload,
  });
  const record = (raw && typeof raw === 'object'
    ? ((raw as Record<string, unknown>).data ??
        (raw as Record<string, unknown>).Data ??
        (raw as Record<string, unknown>).queryResult ??
        (raw as Record<string, unknown>).QueryResult ??
        raw)
    : {}) as Record<string, unknown>;
  return normalizeLessonProgress(record);
}

export type CourseCommentAuthor = {
  id: number;
  fullName?: string;
  userName?: string;
  avatarUrl?: string;
};

export type CourseCommentQri = {
  id: number;
  courseId?: number;
  courseTitle?: string;
  rating: number;
  text: string;
  likes: number;
  isApproved: boolean;
  timeStamp: string;
  parentId?: number | null;
  author?: CourseCommentAuthor | null;
  replies?: CourseCommentQri[];
};

function normalizeCourseComment(comment: CourseCommentQri): CourseCommentQri {
  const record = comment as CourseCommentQri & {
    Id?: number;
    CourseId?: number;
    CourseTitle?: string;
    Rating?: number;
    Text?: string;
    Likes?: number;
    IsApproved?: boolean;
    TimeStamp?: string;
    ParentId?: number | null;
    Author?: CourseCommentAuthor;
    Replies?: CourseCommentQri[];
  };
  const replies = record.replies ?? record.Replies;

  return {
    id: Number(record.id ?? record.Id ?? 0),
    courseId: record.courseId ?? record.CourseId,
    courseTitle: record.courseTitle ?? record.CourseTitle,
    rating: Number(record.rating ?? record.Rating ?? 0),
    text: String(record.text ?? record.Text ?? ''),
    likes: Number(record.likes ?? record.Likes ?? 0),
    isApproved: Boolean(record.isApproved ?? record.IsApproved),
    timeStamp: String(record.timeStamp ?? record.TimeStamp ?? ''),
    parentId: record.parentId ?? record.ParentId ?? null,
    author: record.author ?? record.Author ?? null,
    replies: normalizeArray(replies).map(normalizeCourseComment),
  };
}

export async function getCourseComments(courseId: number, onlyApproved = true): Promise<CourseCommentQri[]> {
  const raw = await apiRequest<PagedResponseRaw<CourseCommentQri>>(
    `${BASE}/get-comments${buildQuery({
      courseId,
      onlyApproved,
      pageNumber: 1,
      pageSize: 100,
      needTotalCount: true,
    })}`
  );
  const data = normalizePagedResponse(raw);
  return data.queryResult.map(normalizeCourseComment);
}

export async function addCourseComment(params: {
  courseId: number;
  content: string;
  rating?: number;
  like?: number;
  parentId?: number | null;
}): Promise<string> {
  const result = await apiRequest<{ result?: string } | string>(`${BASE}/add-comment`, {
    method: 'POST',
    body: {
      courseId: params.courseId,
      content: params.content,
      rating: params.rating ?? 0,
      like: params.like ?? 0,
      parentId: params.parentId ?? 0,
    },
  });
  return typeof result === 'string' ? result : result?.result ?? 'OK';
}

export async function approveCourseComment(params: {
  courseId: number;
  commentId: number;
  isApproved: boolean;
}): Promise<string> {
  const result = await apiRequest<{ result?: string } | string>(`${BASE}/approve-comment`, {
    method: 'PUT',
    body: params,
  });
  return typeof result === 'string' ? result : result?.result ?? 'OK';
}

export async function deleteCourseComment(params: {
  courseId: number;
  commentId: number;
}): Promise<string> {
  const result = await apiRequest<{ result?: string } | string>(`${BASE}/delete-comment`, {
    method: 'DELETE',
    body: params,
  });
  return typeof result === 'string' ? result : result?.result ?? 'OK';
}
