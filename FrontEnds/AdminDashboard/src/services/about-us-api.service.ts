import apiClient from '@/lib/apiClient';
import { getCommandMessages, isCommandResponseSuccess } from '@/lib/api-command-result';

const BASE = '/AboutUs';

export type AboutUsSettingsDto = {
  id?: number;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  introTitle: string;
  introContentHtml: string;
  missionTitle: string;
  missionContentHtml: string;
  visionTitle: string;
  visionContentHtml: string;
  valuesTitle: string;
  valuesContentHtml: string;
  teamTitle: string;
  teamContentHtml: string;
  teamImageUrl: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  teamMembers: AboutUsTeamMemberDto[];
  lastModifiedAt?: string;
};

export type AboutUsTeamMemberDto = {
  id?: number;
  fullName: string;
  skillTitle: string;
  imageUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  displayOrder: number;
};

export type UpsertAboutUsTeamMemberPayload = Omit<AboutUsTeamMemberDto, 'id'> & {
  imageFile?: File | null;
};

export type UpsertAboutUsPayload = Omit<AboutUsSettingsDto, 'id' | 'lastModifiedAt' | 'teamMembers'> & {
  heroImageFile?: File | null;
  teamImageFile?: File | null;
  teamMembers: UpsertAboutUsTeamMemberPayload[];
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

function normalizeTeamMember(raw: Record<string, unknown>): AboutUsTeamMemberDto {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    fullName: String(raw.fullName ?? raw.FullName ?? ''),
    skillTitle: String(raw.skillTitle ?? raw.SkillTitle ?? ''),
    imageUrl: String(raw.imageUrl ?? raw.ImageUrl ?? ''),
    githubUrl: String(raw.githubUrl ?? raw.GithubUrl ?? ''),
    linkedinUrl: String(raw.linkedinUrl ?? raw.LinkedinUrl ?? ''),
    twitterUrl: String(raw.twitterUrl ?? raw.TwitterUrl ?? ''),
    instagramUrl: String(raw.instagramUrl ?? raw.InstagramUrl ?? ''),
    websiteUrl: String(raw.websiteUrl ?? raw.WebsiteUrl ?? ''),
    displayOrder: Number(raw.displayOrder ?? raw.DisplayOrder ?? 0),
  };
}

function normalizeAboutUs(raw: Record<string, unknown>): AboutUsSettingsDto {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    heroTitle: String(raw.heroTitle ?? raw.HeroTitle ?? ''),
    heroSubtitle: String(raw.heroSubtitle ?? raw.HeroSubtitle ?? ''),
    heroImageUrl: String(raw.heroImageUrl ?? raw.HeroImageUrl ?? ''),
    introTitle: String(raw.introTitle ?? raw.IntroTitle ?? ''),
    introContentHtml: String(raw.introContentHtml ?? raw.IntroContentHtml ?? ''),
    missionTitle: String(raw.missionTitle ?? raw.MissionTitle ?? ''),
    missionContentHtml: String(raw.missionContentHtml ?? raw.MissionContentHtml ?? ''),
    visionTitle: String(raw.visionTitle ?? raw.VisionTitle ?? ''),
    visionContentHtml: String(raw.visionContentHtml ?? raw.VisionContentHtml ?? ''),
    valuesTitle: String(raw.valuesTitle ?? raw.ValuesTitle ?? ''),
    valuesContentHtml: String(raw.valuesContentHtml ?? raw.ValuesContentHtml ?? ''),
    teamTitle: String(raw.teamTitle ?? raw.TeamTitle ?? ''),
    teamContentHtml: String(raw.teamContentHtml ?? raw.TeamContentHtml ?? ''),
    teamImageUrl: String(raw.teamImageUrl ?? raw.TeamImageUrl ?? ''),
    ctaTitle: String(raw.ctaTitle ?? raw.CtaTitle ?? ''),
    ctaSubtitle: String(raw.ctaSubtitle ?? raw.CtaSubtitle ?? ''),
    ctaButtonText: String(raw.ctaButtonText ?? raw.CtaButtonText ?? ''),
    ctaButtonUrl: String(raw.ctaButtonUrl ?? raw.CtaButtonUrl ?? ''),
    teamMembers: extractCollection(raw.teamMembers ?? raw.TeamMembers).map(normalizeTeamMember),
    lastModifiedAt: String(raw.lastModifiedAt ?? raw.LastModifiedAt ?? ''),
  };
}

function unwrapAboutUsPayload(payload: unknown): Record<string, unknown> | null {
  let cur: unknown = payload;
  for (let depth = 0; depth < 8; depth++) {
    if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null;
    const obj = cur as Record<string, unknown>;
    if ('heroTitle' in obj || 'HeroTitle' in obj) return obj;
    const next = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj.result ?? obj.Result;
    if (next === cur) break;
    cur = next;
  }
  return null;
}

export async function getAboutUsSettings(): Promise<AboutUsSettingsDto | null> {
  try {
    const { data } = await apiClient.get<unknown>(`${BASE}/Get`);
    const layer = unwrapAboutUsPayload(data);
    if (!layer) return null;
    return normalizeAboutUs(layer);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function upsertAboutUsSettings(payload: UpsertAboutUsPayload): Promise<string> {
  const formData = new FormData();

  formData.append('HeroTitle', payload.heroTitle);
  formData.append('HeroSubtitle', payload.heroSubtitle);
  formData.append('HeroImageUrl', payload.heroImageUrl ?? '');
  if (payload.heroImageFile) formData.append('HeroImageFile', payload.heroImageFile);

  formData.append('IntroTitle', payload.introTitle);
  formData.append('IntroContentHtml', payload.introContentHtml);
  formData.append('MissionTitle', payload.missionTitle);
  formData.append('MissionContentHtml', payload.missionContentHtml);
  formData.append('VisionTitle', payload.visionTitle);
  formData.append('VisionContentHtml', payload.visionContentHtml);
  formData.append('ValuesTitle', payload.valuesTitle);
  formData.append('ValuesContentHtml', payload.valuesContentHtml);

  formData.append('TeamTitle', payload.teamTitle);
  formData.append('TeamContentHtml', payload.teamContentHtml);
  formData.append('TeamImageUrl', payload.teamImageUrl ?? '');
  if (payload.teamImageFile) formData.append('TeamImageFile', payload.teamImageFile);

  formData.append('CtaTitle', payload.ctaTitle);
  formData.append('CtaSubtitle', payload.ctaSubtitle);
  formData.append('CtaButtonText', payload.ctaButtonText);
  formData.append('CtaButtonUrl', payload.ctaButtonUrl);

  const teamMembers = payload.teamMembers.filter(
    (member) => member.fullName.trim().length > 0 || member.skillTitle.trim().length > 0
  );

  teamMembers.forEach((member, index) => {
    formData.append(`TeamMembers[${index}].FullName`, member.fullName.trim());
    formData.append(`TeamMembers[${index}].SkillTitle`, member.skillTitle.trim());
    formData.append(`TeamMembers[${index}].ImageUrl`, member.imageUrl ?? '');
    formData.append(`TeamMembers[${index}].GithubUrl`, member.githubUrl ?? '');
    formData.append(`TeamMembers[${index}].LinkedinUrl`, member.linkedinUrl ?? '');
    formData.append(`TeamMembers[${index}].TwitterUrl`, member.twitterUrl ?? '');
    formData.append(`TeamMembers[${index}].InstagramUrl`, member.instagramUrl ?? '');
    formData.append(`TeamMembers[${index}].WebsiteUrl`, member.websiteUrl ?? '');
    formData.append(`TeamMembers[${index}].DisplayOrder`, String(member.displayOrder ?? index));
    if (member.imageFile) {
      formData.append(`TeamMembers[${index}].ImageFile`, member.imageFile);
    }
  });

  const res = await apiClient.post<unknown>(`${BASE}/Upsert`, formData);
  if (!isCommandResponseSuccess(res.data, res.status)) {
    const msgs = getCommandMessages(res.data);
    throw new Error(msgs[0] || 'Failed to save About Us settings.');
  }
  const data = res.data;
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'data' in (data as object)) {
    const inner = (data as { data?: unknown }).data;
    if (typeof inner === 'string') return inner;
  }
  return 'Saved';
}
