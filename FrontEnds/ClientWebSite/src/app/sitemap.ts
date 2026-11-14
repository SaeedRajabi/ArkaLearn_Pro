import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
import { searchCourses } from '@/lib/api/courses';
import { searchSeminars } from '@/lib/api/seminars';
import { searchArticles } from '@/lib/api/articles';
import { searchProjects } from '@/lib/api/projects';
import { searchBooks } from '@/lib/api/books';
import { searchSoftware } from '@/lib/api/software';
import { searchTeachers } from '@/lib/api/teachers';
import { searchTeacherAdvertisements } from '@/lib/api/teacher-advertisements';
import type {
  SearchArticleQri,
  SearchCourseQri,
  SearchProjectQri,
  SearchSeminarQri,
} from '@/lib/api/types';
import { getTagCatalog } from '@/lib/seo/tag-content';
import { buildCourseSlug } from '@/lib/course-slug';

// On production/IIS builds the backend may be slow or temporarily unreachable.
// Generate this route at request time and keep it resilient to timeouts.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function safeSitemapFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await withTimeout(promise, 12_000, fallback);
  } catch {
    return fallback;
  }
}

function toUrlSegment(value: unknown): string | null {
  if (value == null) return null;

  const segment = String(value).trim();
  if (!segment || segment === '0' || segment.toLowerCase() === 'undefined' || segment.toLowerCase() === 'null') {
    return null;
  }

  return encodeURIComponent(segment);
}

function toValidDate(value: unknown): Date {
  const fallback = new Date();

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value;
  }

  if (typeof value !== 'string' || !value.trim()) return fallback;

  // Normalize Persian digits that can appear in API dates.
  const normalized = value
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return fallback;

  // Guard against Jalali-like years (e.g. 1405) being misparsed as Gregorian AD.
  const year = date.getUTCFullYear();
  if (year < 1900 || year > 2100) return fallback;

  return date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/teachers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${siteUrl}/courses`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/seminars`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/articles`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/books`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.88 },
    { url: `${siteUrl}/software`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.87 },
    { url: `${siteUrl}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/advertisements`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/order-project`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.75 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.55 },
    { url: `${siteUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.55 },
    { url: `${siteUrl}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/qa`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  const [courses, seminars, articles, projects, books, softwareList, teachers, advertisements] = await Promise.all([
    safeSitemapFetch(
      searchCourses({ pageSize: 500, needTotalCount: false }),
      { queryResult: [] as SearchCourseQri[], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
    safeSitemapFetch(
      searchSeminars({ pageSize: 500, needTotalCount: false }),
      { queryResult: [] as SearchSeminarQri[], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
    safeSitemapFetch(
      searchArticles({ pageSize: 500, needTotalCount: false, publishedOnly: true }),
      { queryResult: [] as SearchArticleQri[], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
    safeSitemapFetch(
      searchProjects({ pageSize: 500, needTotalCount: false, publishedOnly: true }),
      { queryResult: [] as SearchProjectQri[], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
    safeSitemapFetch(
      searchBooks({ pageSize: 500 }),
      { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
    safeSitemapFetch(
      searchSoftware({ pageSize: 500 }),
      { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
    safeSitemapFetch(
      searchTeachers({ pageSize: 500 }),
      { teachers: [], totalCount: 0 }
    ),
    safeSitemapFetch(
      searchTeacherAdvertisements({ pageSize: 500 }),
      { items: [], totalCount: 0, pageNumber: 1, pageSize: 500 }
    ),
  ]);

  const courseUrls: MetadataRoute.Sitemap = courses.queryResult.flatMap((course) => {
    const slug = toUrlSegment(course.slug) || toUrlSegment(buildCourseSlug(course.title, course.id));
    if (!slug) return [];

    return [{
      url: `${siteUrl}/courses/${encodeURIComponent(slug)}`,
      lastModified: toValidDate(course.createAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }];
  });

  const seminarUrls: MetadataRoute.Sitemap = seminars.queryResult.flatMap((seminar) => {
    const id = toUrlSegment(seminar.id);
    if (!id) return [];

    return [{
      url: `${siteUrl}/seminars/${id}`,
      lastModified: toValidDate(seminar.startTime),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }];
  });

  const articleUrls: MetadataRoute.Sitemap = articles.queryResult.flatMap((article) => {
    const slug = toUrlSegment(article.slug);
    if (!slug || article.isPublished === false) return [];

    return [{
      url: `${siteUrl}/articles/${slug}`,
      lastModified: toValidDate(article.publishedAt || article.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }];
  });

  const projectUrls: MetadataRoute.Sitemap = projects.queryResult.flatMap((project) => {
    const slug = toUrlSegment(project.slug);
    if (!slug || project.isPublished === false) return [];

    return [{
      url: `${siteUrl}/projects/${slug}`,
      lastModified: toValidDate(project.publishedAt || project.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }];
  });

  const bookUrls: MetadataRoute.Sitemap = books.queryResult.flatMap((book) => {
    const slug = toUrlSegment(book.slug);
    if (!slug) return [];

    return [{
      url: `${siteUrl}/books/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.68,
    }];
  });

  const softwareUrls: MetadataRoute.Sitemap = softwareList.queryResult.flatMap((item) => {
    const slug = toUrlSegment(item.slug);
    if (!slug) return [];

    return [{
      url: `${siteUrl}/software/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.67,
    }];
  });

  const teacherUrls: MetadataRoute.Sitemap = teachers.teachers.flatMap((teacher) => {
    const userName = toUrlSegment(teacher.userName);
    if (!userName) return [];

    return [{
      url: `${siteUrl}/teachers/${userName}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.72,
    }];
  });

  const advertisementUrls: MetadataRoute.Sitemap = advertisements.items.flatMap((ad) => {
    const userName = toUrlSegment(ad.teacherUserName);
    if (!userName) return [];

    return [{
      url: `${siteUrl}/advertisements/${userName}`,
      lastModified: toValidDate(ad.memberSinceUtc),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }];
  });

  const urls = [
    ...base,
    ...courseUrls,
    ...seminarUrls,
    ...articleUrls,
    ...projectUrls,
    ...bookUrls,
    ...softwareUrls,
    ...teacherUrls,
    ...advertisementUrls,
  ];

  const tagCatalog = await safeSitemapFetch(getTagCatalog(), []);
  const tagUrls: MetadataRoute.Sitemap = tagCatalog.slice(0, 200).map((entry) => ({
    url: `${siteUrl}/tags/${entry.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  const allUrls = [...urls, ...tagUrls];
  const uniqueUrls = new Map(allUrls.map((item) => [item.url, item]));

  return Array.from(uniqueUrls.values());
}
