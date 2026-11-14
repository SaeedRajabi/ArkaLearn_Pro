import { apiRequest, buildQuery } from './client';
import type { TeacherProfile } from '@/types';

const BASE = 'Teacher';

function extractCollection(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }
  if (
    raw &&
    typeof raw === 'object' &&
    '$values' in raw &&
    Array.isArray((raw as { $values?: unknown[] }).$values)
  ) {
    return (raw as { $values: unknown[] }).$values.filter(
      (item): item is Record<string, unknown> => typeof item === 'object' && item !== null
    );
  }
  return [];
}

function normalizeTeacherProfile(raw: Record<string, unknown>): TeacherProfile {
  return {
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    userName: String(raw.userName ?? raw.UserName ?? ''),
    avatarUrl: String(raw.avatarUrl ?? raw.AvatarUrl ?? ''),
    headline: String(raw.headline ?? raw.Headline ?? ''),
    longDescription: String(raw.longDescription ?? raw.LongDescription ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    headerImageUrl: String(raw.headerImageUrl ?? raw.HeaderImageUrl ?? '') || undefined,
    teachingCategoryId: Number(raw.teachingCategoryId ?? raw.TeachingCategoryId ?? 0) || undefined,
    teachingCategoryName: String(raw.teachingCategoryName ?? raw.TeachingCategoryName ?? '') || undefined,
    profileApprovalStatus: String(raw.profileApprovalStatus ?? raw.ProfileApprovalStatus ?? 'draft'),
    profileRejectionNote: String(raw.profileRejectionNote ?? raw.ProfileRejectionNote ?? '') || undefined,
    accountStatus: String(raw.accountStatus ?? raw.AccountStatus ?? 'active'),
    accountStatusNote: String(raw.accountStatusNote ?? raw.AccountStatusNote ?? '') || undefined,
    publishedCourseCount: Number(raw.publishedCourseCount ?? raw.PublishedCourseCount ?? 0),
    publishedArticleCount: Number(raw.publishedArticleCount ?? raw.PublishedArticleCount ?? 0),
    points: Number(raw.points ?? raw.Points ?? 0),
    studentCount: Number(raw.studentCount ?? raw.StudentCount ?? 0),
    reviewCount: Number(raw.reviewCount ?? raw.ReviewCount ?? 0),
    followerCount: Number(raw.followerCount ?? raw.FollowerCount ?? 0),
    isFollowing: Boolean(raw.isFollowing ?? raw.IsFollowing ?? false),
    educations: extractCollection(raw.educations ?? raw.Educations).map((e) => ({
      id: Number(e.id ?? e.Id ?? 0),
      universityName: String(e.universityName ?? e.UniversityName ?? ''),
      degreeType: String(e.degreeType ?? e.DegreeType ?? 'bachelors'),
      degreeImage: String(e.degreeImage ?? e.DegreeImage ?? ''),
    })),
    skills: extractCollection(raw.skills ?? raw.Skills).map((s) => ({
      id: Number(s.id ?? s.Id ?? 0),
      name: String(s.name ?? s.Name ?? ''),
      rate: Number(s.rate ?? s.Rate ?? 0),
    })),
    courses: extractCollection(raw.courses ?? raw.Courses).map((c) => ({
      courseId: Number(c.courseId ?? c.CourseId ?? 0),
      title: String(c.title ?? c.Title ?? ''),
      thumbnailUrl: String(c.thumbnailUrl ?? c.ThumbnailUrl ?? '') || undefined,
      price: Number(c.price ?? c.Price ?? 0),
      level: String(c.level ?? c.Level ?? ''),
    })),
    resume: normalizeTeacherResume(raw.resume ?? raw.Resume),
  };
}

function normalizeTeacherResume(raw: unknown): TeacherProfile['resume'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  const id = Number(row.id ?? row.Id ?? 0);
  if (!id) return undefined;
  return {
    id,
    title: String(row.title ?? row.Title ?? ''),
    description: String(row.description ?? row.Description ?? ''),
    pdfFileUrl: String(row.pdfFileUrl ?? row.PdfFileUrl ?? ''),
    pdfFileName: String(row.pdfFileName ?? row.PdfFileName ?? '') || undefined,
    approvalStatus: String(row.approvalStatus ?? row.ApprovalStatus ?? 'draft'),
  };
}

export type TeacherListItem = {
  teacherId: number;
  displayName: string;
  userName: string;
  avatarUrl: string;
  headerImageUrl?: string;
  shortDescription: string;
  teachingCategoryName: string;
  teachingCategorySlug: string;
  publishedCourseCount: number;
  publishedArticleCount: number;
  points: number;
  isFollowing?: boolean;
};

export type TeacherTeachingCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string;
};

export async function getTeacherProfile(params: {
  teacherId?: number;
  userName?: string;
  forEdit?: boolean;
}): Promise<TeacherProfile | null> {
  try {
    const path = `${BASE}/GetProfile${buildQuery({
      teacherId: params.teacherId,
      userName: params.userName,
      forEdit: params.forEdit ?? false,
    })}`;
    const raw = await apiRequest<Record<string, unknown>>(path);
    if (!raw || typeof raw !== 'object') return null;
    const profile = normalizeTeacherProfile(raw);
    if (!profile.teacherId) return null;
    return profile;
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 404 || status === 204) return null;
    }
    throw e;
  }
}

export type TeacherEducationInput = {
  universityName: string;
  degreeType: string;
  degreeImage?: string | null;
};

export type TeacherSkillInput = {
  name: string;
  rate: number;
};

export async function updateTeacherProfile(payload: {
  userId: number;
  shortDescription?: string | null;
  longDescription?: string | null;
  headerImageUrl?: string | null;
  teachingCategoryId?: number | null;
  educations?: TeacherEducationInput[];
  skills?: TeacherSkillInput[];
}): Promise<void> {
  await apiRequest(`${BASE}/UpdateProfile`, {
    method: 'POST',
    credentials: 'include',
    body: {
      UserId: payload.userId,
      ShortDescription: payload.shortDescription ?? '',
      LongDescription: payload.longDescription ?? '',
      HeaderImageUrl: payload.headerImageUrl ?? '',
      TeachingCategoryId: payload.teachingCategoryId ?? null,
      Educations: (payload.educations ?? []).map((e) => ({
        UniversityName: e.universityName,
        DegreeType: e.degreeType,
        DegreeImage: e.degreeImage ?? '',
      })),
      Skills: (payload.skills ?? []).map((s) => ({
        Name: s.name,
        Rate: s.rate,
      })),
    },
  });
}

export async function submitTeacherProfile(userId: number): Promise<void> {
  await apiRequest(`${BASE}/SubmitForReview`, {
    method: 'POST',
    credentials: 'include',
    body: { UserId: userId },
  });
}

export async function searchTeachers(params?: {
  inputValue?: string;
  teachingCategoryId?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ teachers: TeacherListItem[]; totalCount: number }> {
  const path = `${BASE}/Search${buildQuery({
    inputValue: params?.inputValue ?? '',
    teachingCategoryId: params?.teachingCategoryId,
    pageNumber: params?.pageNumber ?? 1,
    pageSize: params?.pageSize ?? 24,
    needTotalCount: true,
  })}`;
  const raw = await apiRequest<Record<string, unknown>>(path);
  const qr = raw.queryResult ?? raw.QueryResult;
  const list = extractCollection(qr);
  return {
    teachers: list.map((item) => ({
      teacherId: Number(item.teacherId ?? item.TeacherId ?? 0),
      displayName: String(item.displayName ?? item.DisplayName ?? ''),
      userName: String(item.userName ?? item.UserName ?? ''),
      avatarUrl: String(item.avatarUrl ?? item.AvatarUrl ?? ''),
      headerImageUrl: String(item.headerImageUrl ?? item.HeaderImageUrl ?? '') || undefined,
      shortDescription: String(item.shortDescription ?? item.ShortDescription ?? ''),
      teachingCategoryName: String(item.teachingCategoryName ?? item.TeachingCategoryName ?? ''),
      teachingCategorySlug: String(item.teachingCategorySlug ?? item.TeachingCategorySlug ?? ''),
      publishedCourseCount: Number(item.publishedCourseCount ?? item.PublishedCourseCount ?? 0),
      publishedArticleCount: Number(item.publishedArticleCount ?? item.PublishedArticleCount ?? 0),
      points: Number(item.points ?? item.Points ?? 0),
      isFollowing: Boolean(item.isFollowing ?? item.IsFollowing ?? false),
    })),
    totalCount: Number(raw.totalCount ?? raw.TotalCount ?? list.length),
  };
}

export async function getTeachingCategories(): Promise<TeacherTeachingCategory[]> {
  const raw = await apiRequest<unknown[]>(`${BASE}/GetTeachingCategories`);
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: Number(row.id ?? row.Id ?? 0),
      name: String(row.name ?? row.Name ?? ''),
      slug: String(row.slug ?? row.Slug ?? ''),
      description: String(row.description ?? row.Description ?? '') || undefined,
    };
  });
}
