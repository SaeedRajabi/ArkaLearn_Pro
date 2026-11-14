import { apiRequest, buildQuery } from './client';
import { asLongId, isValidLongId } from '@/lib/id';

const BASE = 'Teacher';

export type TeacherAdvertisement = {
  id: number;
  teacherId: number;
  title: string;
  privateTeachingCost?: number | null;
  hourlyTeachingCost?: number | null;
  workExperience?: string | null;
  descriptionHtml: string;
  websiteUrl?: string | null;
  websiteTitle?: string | null;
  contactPhone?: string | null;
  baleLink?: string | null;
  telegramLink?: string | null;
  whatsAppLink?: string | null;
  gitHubLink?: string | null;
  linkedInLink?: string | null;
  infoAccuracyConfirmed: boolean;
  termsAccepted: boolean;
  isPublic: boolean;
  teacherDisplayName?: string;
  teacherUserName?: string;
  teacherAvatarUrl?: string;
  tags?: string[];
  canShowContact?: boolean;
  hasContactDetails?: boolean;
  listingStarLevel?: number;
  planStatus?: string;
  experiencePoints?: number;
  xpNextThreshold?: number;
  hasPaidFeatures?: boolean;
  approvalStatus?: string;
  rejectionNote?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  isFollowing?: boolean;
};

export type TeacherAdvertisementListItem = {
  id: number;
  teacherId: number;
  userId: number;
  title: string;
  privateTeachingCost?: number | null;
  hourlyTeachingCost?: number | null;
  workExperience?: string | null;
  descriptionHtml: string;
  shortSummary?: string;
  subjectNames?: string;
  teacherDisplayName?: string;
  teacherUserName?: string;
  teacherAvatarUrl?: string;
  teachingCategoryName?: string;
  points: number;
  reviewCount: number;
  likeCount: number;
  memberSinceUtc?: string;
  listingStarLevel?: number;
  tags?: string[];
};

function unwrapAdvertisementRecord(raw: unknown): Record<string, unknown> | null {
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root.queryResult ?? root.QueryResult ?? root;
  if (layer && typeof layer === 'object' && !Array.isArray(layer)) {
    const record = layer as Record<string, unknown>;
    if ('title' in record || 'Title' in record || 'id' in record || 'Id' in record) {
      return record;
    }
    const nested = record.data ?? record.Data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
    return record;
  }
  return root;
}

function normalizeAdvertisement(raw: Record<string, unknown>): TeacherAdvertisement {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    privateTeachingCost: raw.privateTeachingCost != null || raw.PrivateTeachingCost != null
      ? Number(raw.privateTeachingCost ?? raw.PrivateTeachingCost)
      : null,
    hourlyTeachingCost: raw.hourlyTeachingCost != null || raw.HourlyTeachingCost != null
      ? Number(raw.hourlyTeachingCost ?? raw.HourlyTeachingCost)
      : null,
    workExperience: String(raw.workExperience ?? raw.WorkExperience ?? '') || undefined,
    descriptionHtml: String(raw.descriptionHtml ?? raw.DescriptionHtml ?? ''),
    websiteUrl: String(raw.websiteUrl ?? raw.WebsiteUrl ?? '') || undefined,
    websiteTitle: String(raw.websiteTitle ?? raw.WebsiteTitle ?? '') || undefined,
    contactPhone: String(raw.contactPhone ?? raw.ContactPhone ?? '') || undefined,
    baleLink: String(raw.baleLink ?? raw.BaleLink ?? '') || undefined,
    telegramLink: String(raw.telegramLink ?? raw.TelegramLink ?? '') || undefined,
    whatsAppLink: String(raw.whatsAppLink ?? raw.WhatsAppLink ?? '') || undefined,
    gitHubLink: String(raw.gitHubLink ?? raw.GitHubLink ?? '') || undefined,
    linkedInLink: String(raw.linkedInLink ?? raw.LinkedInLink ?? '') || undefined,
    infoAccuracyConfirmed: Boolean(raw.infoAccuracyConfirmed ?? raw.InfoAccuracyConfirmed),
    termsAccepted: Boolean(raw.termsAccepted ?? raw.TermsAccepted),
    isPublic: Boolean(raw.isPublic ?? raw.IsPublic),
    teacherDisplayName: String(raw.teacherDisplayName ?? raw.TeacherDisplayName ?? '') || undefined,
    teacherUserName: String(raw.teacherUserName ?? raw.TeacherUserName ?? '') || undefined,
    teacherAvatarUrl: String(raw.teacherAvatarUrl ?? raw.TeacherAvatarUrl ?? '') || undefined,
    tags: Array.isArray(raw.tags ?? raw.Tags)
      ? (raw.tags ?? raw.Tags as string[]).map(String)
      : undefined,
    canShowContact: raw.canShowContact != null || raw.CanShowContact != null
      ? Boolean(raw.canShowContact ?? raw.CanShowContact)
      : undefined,
    hasContactDetails: raw.hasContactDetails != null || raw.HasContactDetails != null
      ? Boolean(raw.hasContactDetails ?? raw.HasContactDetails)
      : undefined,
    listingStarLevel: Number(raw.listingStarLevel ?? raw.ListingStarLevel ?? 0) || undefined,
    planStatus: String(raw.planStatus ?? raw.PlanStatus ?? '') || undefined,
    experiencePoints: Number(raw.experiencePoints ?? raw.ExperiencePoints ?? 0) || undefined,
    xpNextThreshold: Number(raw.xpNextThreshold ?? raw.XpNextThreshold ?? 0) || undefined,
    hasPaidFeatures: raw.hasPaidFeatures != null || raw.HasPaidFeatures != null
      ? Boolean(raw.hasPaidFeatures ?? raw.HasPaidFeatures)
      : undefined,
    approvalStatus: String(raw.approvalStatus ?? raw.ApprovalStatus ?? 'draft') || undefined,
    rejectionNote: String(raw.rejectionNote ?? raw.RejectionNote ?? '') || undefined,
    seoTitle: (raw.seoTitle ?? raw.SeoTitle) as string | null | undefined,
    metaDescription: (raw.metaDescription ?? raw.MetaDescription) as string | null | undefined,
    ogImageUrl: (raw.ogImageUrl ?? raw.OgImageUrl) as string | null | undefined,
    isFollowing: Boolean(raw.isFollowing ?? raw.IsFollowing ?? false),
  };
}

export async function getTeacherAdvertisement(params: {
  userId?: string;
  teacherId?: number;
  userName?: string;
  forEdit?: boolean;
}): Promise<TeacherAdvertisement | null> {
  try {
    const userId =
      params.userId && isValidLongId(asLongId(params.userId)) ? asLongId(params.userId) : undefined;
    const path = `${BASE}/GetAdvertisement${buildQuery({
      userId,
      teacherId: params.teacherId != null && params.teacherId > 0 ? params.teacherId : undefined,
      userName: params.userName,
      forEdit: params.forEdit ? true : undefined,
    })}`;
    const raw = await apiRequest<Record<string, unknown>>(path);
    if (raw == null || raw === '') return null;
    const record = unwrapAdvertisementRecord(raw);
    if (!record) return null;
    const ad = normalizeAdvertisement(record);
    if (!ad.id && !ad.title) return null;
    return ad;
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) {
      const status = (e as { status: number }).status;
      if (status === 404 || status === 204) return null;
    }
    throw e;
  }
}

export type SaveTeacherAdvertisementPayload = {
  userId: string;
  title: string;
  privateTeachingCost?: number | null;
  hourlyTeachingCost?: number | null;
  workExperience?: string;
  descriptionHtml: string;
  websiteUrl?: string;
  websiteTitle?: string;
  contactPhone?: string;
  baleLink?: string;
  telegramLink?: string;
  whatsAppLink?: string;
  gitHubLink?: string;
  linkedInLink?: string;
  infoAccuracyConfirmed: boolean;
  termsAccepted: boolean;
  tags?: string[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export async function saveTeacherAdvertisement(payload: SaveTeacherAdvertisementPayload): Promise<void> {
  await apiRequest(`${BASE}/SaveAdvertisement`, {
    method: 'POST',
    body: {
      userId: asLongId(payload.userId),
      title: payload.title,
      privateTeachingCost: payload.privateTeachingCost ?? null,
      hourlyTeachingCost: payload.hourlyTeachingCost ?? null,
      workExperience: payload.workExperience ?? '',
      descriptionHtml: payload.descriptionHtml,
      websiteUrl: payload.websiteUrl ?? '',
      websiteTitle: payload.websiteTitle ?? '',
      contactPhone: payload.contactPhone ?? '',
      baleLink: payload.baleLink ?? '',
      telegramLink: payload.telegramLink ?? '',
      whatsAppLink: payload.whatsAppLink ?? '',
      gitHubLink: payload.gitHubLink ?? '',
      linkedInLink: payload.linkedInLink ?? '',
      infoAccuracyConfirmed: payload.infoAccuracyConfirmed,
      termsAccepted: payload.termsAccepted,
      isPublic: false,
      tags: payload.tags ?? [],
      seoTitle: payload.seoTitle,
      metaDescription: payload.metaDescription,
      ogImageUrl: payload.ogImageUrl,
    },
  });
}

function extractPagedItems(raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  const list = obj.queryResult ?? obj.QueryResult ?? obj.items ?? obj.Items;
  if (Array.isArray(list)) {
    return list.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }
  if (list && typeof list === 'object' && '$values' in list && Array.isArray((list as { $values: unknown[] }).$values)) {
    return (list as { $values: unknown[] }).$values.filter(
      (item): item is Record<string, unknown> => typeof item === 'object' && item !== null
    );
  }
  return [];
}

function unwrapPagedResponse(raw: unknown): {
  items: Record<string, unknown>[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
} {
  if (!raw || typeof raw !== 'object') {
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 };
  }
  const root = raw as Record<string, unknown>;
  const layer = (root.data ?? root.Data ?? root) as Record<string, unknown>;
  return {
    items: extractPagedItems(layer),
    totalCount: Number(layer.totalCount ?? layer.TotalCount ?? 0),
    pageNumber: Number(layer.pageNumber ?? layer.PageNumber ?? 1),
    pageSize: Number(layer.pageSize ?? layer.PageSize ?? 20),
  };
}

function normalizeListItem(item: Record<string, unknown>): TeacherAdvertisementListItem {
  return {
    id: Number(item.id ?? item.Id ?? 0),
    teacherId: Number(item.teacherId ?? item.TeacherId ?? 0),
    userId: Number(item.userId ?? item.UserId ?? 0),
    title: String(item.title ?? item.Title ?? ''),
    privateTeachingCost: item.privateTeachingCost != null || item.PrivateTeachingCost != null
      ? Number(item.privateTeachingCost ?? item.PrivateTeachingCost)
      : null,
    hourlyTeachingCost: item.hourlyTeachingCost != null || item.HourlyTeachingCost != null
      ? Number(item.hourlyTeachingCost ?? item.HourlyTeachingCost)
      : null,
    workExperience: String(item.workExperience ?? item.WorkExperience ?? '') || undefined,
    descriptionHtml: String(item.descriptionHtml ?? item.DescriptionHtml ?? ''),
    shortSummary: String(item.shortSummary ?? item.ShortSummary ?? '') || undefined,
    subjectNames: String(item.subjectNames ?? item.SubjectNames ?? '') || undefined,
    teacherDisplayName: String(item.teacherDisplayName ?? item.TeacherDisplayName ?? '') || undefined,
    teacherUserName: String(item.teacherUserName ?? item.TeacherUserName ?? '') || undefined,
    teacherAvatarUrl: String(item.teacherAvatarUrl ?? item.TeacherAvatarUrl ?? '') || undefined,
    teachingCategoryName: String(item.teachingCategoryName ?? item.TeachingCategoryName ?? '') || undefined,
    points: Number(item.points ?? item.Points ?? 0),
    reviewCount: Number(item.reviewCount ?? item.ReviewCount ?? 0),
    likeCount: Number(item.likeCount ?? item.LikeCount ?? 0),
    memberSinceUtc: String(item.memberSinceUtc ?? item.MemberSinceUtc ?? '') || undefined,
    listingStarLevel: Number(item.listingStarLevel ?? item.ListingStarLevel ?? 0) || undefined,
    tags: Array.isArray(item.tags ?? item.Tags)
      ? (item.tags ?? item.Tags as string[]).map((t) => String(t))
      : undefined,
  };
}

export async function searchTeacherAdvertisements(params: {
  search?: string;
  tag?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: TeacherAdvertisementListItem[]; totalCount: number; pageNumber: number; pageSize: number }> {
  const path = `${BASE}/SearchAdvertisements${buildQuery({
    search: params.search,
    tag: params.tag,
    pageNumber: params.pageNumber ?? 1,
    pageSize: params.pageSize ?? 20,
  })}`;
  const raw = await apiRequest<Record<string, unknown>>(path);
  const paged = unwrapPagedResponse(raw);
  return {
    ...paged,
    items: paged.items.map(normalizeListItem),
  };
}
