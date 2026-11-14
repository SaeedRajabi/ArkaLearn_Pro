import { apiRequest } from './client';
import type { AboutUsQri } from './types';

const BASE = 'AboutUs';

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

function normalizeTeamMember(raw: Record<string, unknown>) {
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

function normalizeAboutUs(raw: Record<string, unknown>): AboutUsQri {
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

export async function getAboutUsPage(): Promise<AboutUsQri | null> {
  try {
    const result = await apiRequest<Record<string, unknown>>(`${BASE}/Get`, {
      method: 'GET',
      timeoutMs: 8000,
    });
    if (!result || typeof result !== 'object') return null;
    return normalizeAboutUs(result);
  } catch {
    return null;
  }
}
