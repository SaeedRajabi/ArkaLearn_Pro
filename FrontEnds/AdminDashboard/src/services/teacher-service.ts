import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

export type TeacherEducationItem = {
  universityName: string;
  degreeType: string;
  degreeImage?: string | null;
};

export type TeacherSkillItem = {
  name: string;
  rate: number;
};

export type TeacherProfileDto = {
  teacherId: number;
  userId: number;
  displayName: string;
  userName: string;
  avatarUrl: string;
  headline: string;
  longDescription: string;
  shortDescription?: string;
  headerImageUrl?: string;
  teachingCategoryId?: number;
  profileApprovalStatus?: string;
  advertisingPlan?: string;
  publishedCourseCount: number;
  publishedArticleCount: number;
  points: number;
  educations: Array<{
    id: number;
    universityName: string;
    degreeType: string;
    degreeImage: string;
  }>;
  skills: Array<{
    id: number;
    name: string;
    rate: number;
  }>;
};

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

function normalizeProfile(raw: Record<string, unknown>): TeacherProfileDto {
  return {
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    userName: String(raw.userName ?? raw.UserName ?? ''),
    avatarUrl: String(raw.avatarUrl ?? raw.AvatarUrl ?? ''),
    headline: String(raw.headline ?? raw.Headline ?? ''),
    longDescription: String(raw.longDescription ?? raw.LongDescription ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    headerImageUrl: String(raw.headerImageUrl ?? raw.HeaderImageUrl ?? ''),
    teachingCategoryId: Number(raw.teachingCategoryId ?? raw.TeachingCategoryId ?? 0) || undefined,
    profileApprovalStatus: String(raw.profileApprovalStatus ?? raw.ProfileApprovalStatus ?? 'draft'),
    advertisingPlan: String(raw.advertisingPlan ?? raw.AdvertisingPlan ?? 'free'),
    publishedCourseCount: Number(raw.publishedCourseCount ?? raw.PublishedCourseCount ?? 0),
    publishedArticleCount: Number(raw.publishedArticleCount ?? raw.PublishedArticleCount ?? 0),
    points: Number(raw.points ?? raw.Points ?? 0),
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
  };
}

export async function getTeacherProfile(params: {
  teacherId?: number;
  userName?: string;
  forEdit?: boolean;
}): Promise<TeacherProfileDto | null> {
  const response = await apiClient.get<Record<string, unknown>>('/Teacher/GetProfile', {
    params: {
      teacherId: params.teacherId,
      userName: params.userName,
      forEdit: params.forEdit ?? false,
    },
  });
  const raw = response.data;
  if (!raw || typeof raw !== 'object') return null;
  const profile = normalizeProfile(raw);
  return profile.teacherId > 0 ? profile : null;
}

export async function updateTeacherProfile(payload: {
  userId: number;
  shortDescription?: string | null;
  longDescription?: string | null;
  headerImageUrl?: string | null;
  teachingCategoryId?: number | null;
  educations?: TeacherEducationItem[];
  skills?: TeacherSkillItem[];
  promotionalVideos?: Array<{ title: string; videoUrl: string; thumbnailUrl?: string; sortOrder?: number }>;
  books?: Array<{ title: string; description: string; coverImageUrl?: string; sortOrder?: number }>;
  portfolioArticles?: Array<{ title: string; summary: string; content: string; sortOrder?: number }>;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/UpdateProfile', {
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
    PromotionalVideos: (payload.promotionalVideos ?? []).map((v) => ({
      Title: v.title,
      VideoUrl: v.videoUrl,
      ThumbnailUrl: v.thumbnailUrl ?? '',
      SortOrder: v.sortOrder ?? 0,
    })),
    Books: (payload.books ?? []).map((b) => ({
      Title: b.title,
      Description: b.description,
      CoverImageUrl: b.coverImageUrl ?? '',
      SortOrder: b.sortOrder ?? 0,
    })),
    PortfolioArticles: (payload.portfolioArticles ?? []).map((a) => ({
      Title: a.title,
      Summary: a.summary,
      Content: a.content,
      SortOrder: a.sortOrder ?? 0,
    })),
  });
}

export type PendingTeacherProfileDto = {
  teacherId: number;
  userId: number;
  displayName: string;
  userName: string;
  teachingCategoryName: string;
  submittedAtUtc?: string;
  profileApprovalStatus: string;
};

export async function submitTeacherProfile(userId: number): Promise<void> {
  await apiWriteUpdate('/Teacher/SubmitForReview', { UserId: userId });
}

export async function getPendingTeacherProfiles(): Promise<PendingTeacherProfileDto[]> {
  const response = await apiClient.get<unknown[]>('/Teacher/GetPendingProfiles');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      teacherId: Number(item.teacherId ?? item.TeacherId ?? 0),
      userId: Number(item.userId ?? item.UserId ?? 0),
      displayName: String(item.displayName ?? item.DisplayName ?? ''),
      userName: String(item.userName ?? item.UserName ?? ''),
      teachingCategoryName: String(item.teachingCategoryName ?? item.TeachingCategoryName ?? ''),
      submittedAtUtc: String(item.submittedAtUtc ?? item.SubmittedAtUtc ?? ''),
      profileApprovalStatus: String(item.profileApprovalStatus ?? item.ProfileApprovalStatus ?? 'pending'),
    };
  });
}

export async function reviewTeacherProfile(payload: {
  teacherId: number;
  approve: boolean;
  rejectionNote?: string;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/ReviewProfile', {
    TeacherId: payload.teacherId,
    Approve: payload.approve,
    RejectionNote: payload.rejectionNote ?? '',
  });
}

export type TeacherReviewFieldChangeDto = {
  fieldKey: string;
  fieldLabel: string;
  previousText?: string | null;
  currentText?: string | null;
  changeKind: string;
};

export type TeacherReviewChangesDto = {
  reviewType: string;
  teacherId: number;
  contentId: number;
  hasApprovedBaseline: boolean;
  changes: TeacherReviewFieldChangeDto[];
};

export async function getTeacherReviewChanges(params: {
  reviewType: string;
  teacherId?: number;
  contentId?: number;
}): Promise<TeacherReviewChangesDto | null> {
  const response = await apiClient.get<Record<string, unknown>>('/Teacher/GetReviewChanges', {
    params: {
      reviewType: params.reviewType,
      teacherId: params.teacherId ?? 0,
      contentId: params.contentId ?? 0,
    },
  });
  const raw = response.data;
  if (!raw || typeof raw !== 'object') return null;
  const list = raw.changes ?? raw.Changes;
  const changes = Array.isArray(list)
    ? list.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          fieldKey: String(row.fieldKey ?? row.FieldKey ?? ''),
          fieldLabel: String(row.fieldLabel ?? row.FieldLabel ?? ''),
          previousText: (row.previousText ?? row.PreviousText ?? null) as string | null,
          currentText: (row.currentText ?? row.CurrentText ?? null) as string | null,
          changeKind: String(row.changeKind ?? row.ChangeKind ?? 'modified'),
        };
      })
    : [];
  return {
    reviewType: String(raw.reviewType ?? raw.ReviewType ?? params.reviewType),
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? params.teacherId ?? 0),
    contentId: Number(raw.contentId ?? raw.ContentId ?? params.contentId ?? 0),
    hasApprovedBaseline: Boolean(raw.hasApprovedBaseline ?? raw.HasApprovedBaseline),
    changes,
  };
}

export type PendingTeacherContentDto = {
  contentType: string;
  contentId: number;
  teacherId: number;
  userId?: number;
  teacherDisplayName: string;
  teacherUserName: string;
  title: string;
  summary?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  submittedAtUtc?: string;
};

export async function getPendingTeacherContent(): Promise<PendingTeacherContentDto[]> {
  const response = await apiClient.get<unknown[]>('/Teacher/GetPendingContent');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      contentType: String(item.contentType ?? item.ContentType ?? ''),
      contentId: Number(item.contentId ?? item.ContentId ?? 0),
      teacherId: Number(item.teacherId ?? item.TeacherId ?? 0),
      userId: Number(item.userId ?? item.UserId ?? 0) || undefined,
      teacherDisplayName: String(item.teacherDisplayName ?? item.TeacherDisplayName ?? ''),
      teacherUserName: String(item.teacherUserName ?? item.TeacherUserName ?? ''),
      title: String(item.title ?? item.Title ?? ''),
      summary: String(item.summary ?? item.Summary ?? '') || undefined,
      previewUrl: String(item.previewUrl ?? item.PreviewUrl ?? '') || undefined,
      thumbnailUrl: String(item.thumbnailUrl ?? item.ThumbnailUrl ?? '') || undefined,
      coverImageUrl: String(item.coverImageUrl ?? item.CoverImageUrl ?? '') || undefined,
      submittedAtUtc: String(item.submittedAtUtc ?? item.SubmittedAtUtc ?? '') || undefined,
    };
  });
}

export async function reviewTeacherContent(payload: {
  contentType: string;
  contentId: number;
  approve: boolean;
  rejectionNote?: string;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/ReviewContent', {
    ContentType: payload.contentType,
    ContentId: payload.contentId,
    Approve: payload.approve,
    RejectionNote: payload.rejectionNote ?? '',
  });
}

export async function setTeacherAccountStatus(payload: {
  teacherId: number;
  status: 'active' | 'blocked' | 'terminated';
  note?: string;
}): Promise<void> {
  await apiWriteUpdate('/Teacher/SetAccountStatus', {
    TeacherId: payload.teacherId,
    Status: payload.status,
    Note: payload.note ?? '',
  });
}

export async function getTeachingCategories(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const response = await apiClient.get<unknown[]>('/Teacher/GetTeachingCategories');
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: Number(item.id ?? item.Id ?? 0),
      name: String(item.name ?? item.Name ?? ''),
      slug: String(item.slug ?? item.Slug ?? ''),
    };
  });
}
