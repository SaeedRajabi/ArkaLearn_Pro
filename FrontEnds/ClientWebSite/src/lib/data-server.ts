/**
 * لایه داده برای سرور: فقط از بک‌اند می‌خواند.
 * خروجی لیست‌ها هم‌نام با پراپرتی‌های API بک‌اند است (CourseListItem, ArticleListItem, SeminarListItem).
 */
import { cache } from 'react';
import { ApiError } from '@/lib/api/client';
import * as apiCourses from '@/lib/api/courses';
import * as apiArticles from '@/lib/api/articles';
import * as apiProjects from '@/lib/api/projects';
import * as apiSeminars from '@/lib/api/seminars';
import {
  courseQriToCourse,
  articleQriToArticle,
  projectQriToProject,
  seminarQriToSeminar,
} from '@/lib/api/adapters';
import {
  getArticleImageUrl,
  getCourseImageUrl,
  getCourseVideoUrl,
  getProjectImageUrl,
  getSeminarImageUrl,
} from '@/lib/utils/image-url';
import { buildCourseSlug } from '@/lib/course-slug';
import { normalizeCategoryPath } from '@/components/shared/course-category-breadcrumb';
import type {
  CourseListItem,
  ArticleListItem,
  ProjectListItem,
  SeminarListItem,
  Course,
  Article,
  Project,
  Seminar,
} from '@/types';
import {
  CourseQri,
  GetAllPopularCourseQri,
  PagedData,
  SearchCourseQri,
  SearchProjectQri,
  SeminarQri,
} from '@/lib/api';

async function requireApi<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function popularToListItem(p: {
  courseId: number;
  title: string;
  slug?: string;
  coursePrice?: number;
  originalPrice?: number;
  createAt?: string;
  courseLevel?: string;
  shortDescription?: string;
  logoImage?: string;
  categoryName: string;
  categoryId?: number;
  categoryPath?: string[] | { $values?: string[] };
}): CourseListItem {
  return {
    id: p.courseId,
    title: p.title,
    slug: p.slug?.trim() || buildCourseSlug(p.title, p.courseId),
    price: p.coursePrice ?? 0,
    originalPrice: p.originalPrice,
    createAt: p.createAt,
    courseLevel: p.courseLevel,
    shortDescription: p.shortDescription,
    titleImage: getCourseImageUrl(p.logoImage),
    categoryName: p.categoryName,
    categoryId: p.categoryId,
    categoryPath: normalizeCategoryPath(p.categoryPath, p.categoryName),
    status: 'Published',
    studentCount: 0,
  };
}

function searchToListItem(course: SearchCourseQri): CourseListItem {
  return normalizeCourseListItem({
    id: course.id,
    title: course.title,
    slug: course.slug?.trim() || buildCourseSlug(course.title, course.id),
    price: course.price,
    originalPrice: course.originalPrice,
    createAt: course.createAt,
    coursePlan: course.coursePlan,
    courseLevel: course.courseLevel,
    shortDescription: course.shortDescription,
    titleImage: course.titleImage,
    categoryName: course.categoryName,
    categoryId: course.categoryId,
    categoryPath: normalizeCategoryPath(course.categoryPath, course.categoryName),
    status: course.status,
    videoUrl: course.videoUrl,
    studentCount: course.studentCount ?? 0,
    commentCount: course.commentCount,
    likeCount: course.likeCount,
    rating: course.rating,
    teacherName: course.teacherName?.trim() || undefined,
    durationMinutes: course.durationMinutes && course.durationMinutes > 0 ? course.durationMinutes : undefined,
    deliveryMode: course.deliveryMode,
  });
}

function normalizeCourseListItem(course: CourseListItem): CourseListItem {
  return {
    ...course,
    slug: course.slug?.trim() || buildCourseSlug(course.title, course.id),
    titleImage: getCourseImageUrl(course.titleImage),
    videoUrl: course.videoUrl ? getCourseVideoUrl(course.videoUrl) : course.videoUrl,
  };
}

function normalizeArticleListItem(article: ArticleListItem | Record<string, unknown>): ArticleListItem {
  const row = article as Record<string, unknown>;
  return {
    id: Number(row.id ?? 0),
    title: String(row.title ?? ''),
    summary: String(row.summary ?? ''),
    slug: String(row.slug ?? ''),
    thumbnailUrl: getArticleImageUrl(
      (row.thumbnailUrl ?? row.ThumbnailUrl) as string | undefined
    ),
    isPublished: Boolean(row.isPublished ?? row.IsPublished),
    publishedAt: (row.publishedAt ?? row.PublishedAt ?? null) as string | null,
    categoryName: (row.categoryName ?? row.CategoryName) as string | undefined,
    categoryId: row.categoryId != null || row.CategoryId != null
      ? Number(row.categoryId ?? row.CategoryId)
      : undefined,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0) || 0,
    commentCount: Number(row.commentCount ?? row.CommentCount ?? 0) || 0,
    averageRating: Number(row.averageRating ?? row.AverageRating ?? 0) || 0,
    authorName: String(row.authorName ?? row.AuthorName ?? '') || undefined,
    tags: Array.isArray(row.tags)
      ? (row.tags as string[])
      : Array.isArray(row.Tags)
        ? (row.Tags as string[])
        : undefined,
  };
}

function normalizeStringList(raw: string[] | { $values?: string[] } | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((item) => String(item ?? '').trim()).filter(Boolean);
  if (typeof raw === 'object' && '$values' in raw && Array.isArray((raw as { $values?: string[] }).$values)) {
    return (raw as { $values: string[] }).$values.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  return [];
}

function normalizeProjectListItem(project: SearchProjectQri): ProjectListItem {
  return {
    id: Number(project.id),
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    thumbnailUrl: getProjectImageUrl(project.thumbnailUrl),
    isPublished: project.isPublished,
    publishedAt: project.publishedAt ?? null,
    createdAt: project.createdAt,
    tags: normalizeStringList(project.tags),
    technologies: normalizeStringList(project.technologies),
  };
}

function mapSearchSeminarRow(row: Record<string, unknown>): SeminarListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    description: (row.description ?? row.Description) as string | undefined,
    startTime: String(row.startTime ?? row.StartTime ?? ''),
    endTime: String(row.endTime ?? row.EndTime ?? ''),
    capacity: Number(row.capacity ?? row.Capacity ?? 0),
    registeredCount: Number(row.registeredCount ?? row.RegisteredCount ?? 0),
    price: Number(row.price ?? row.Price ?? 0),
    isFree: Boolean(row.isFree ?? row.IsFree ?? false),
    status: Number(row.status ?? row.Status ?? 0),
    isPublic: row.isPublic !== undefined || row.IsPublic !== undefined
      ? Boolean(row.isPublic ?? row.IsPublic)
      : undefined,
    thumbnailUrl: (row.thumbnailUrl ?? row.ThumbnailUrl) as string | undefined,
    roomId: (row.roomId ?? row.RoomId) as number | undefined,
    roomTitle: (row.roomTitle ?? row.RoomTitle) as string | undefined,
  };
}

/** سمینارهایی که در سایت عمومی نمایش داده می‌شوند (پیش‌نویس/لغوشده و مخفی را حذف می‌کند). */
function isClientCatalogSeminar(seminar: SeminarListItem): boolean {
  if (seminar.status === 0 || seminar.status === 4) return false;
  if (seminar.isPublic === false) return false;
  return true;
}

async function fetchClientSeminarList(params: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
  needTotalCount?: boolean;
}): Promise<{ items: SeminarListItem[]; totalCount: number }> {
  const searchParams = {
    inputValue: params.inputValue ?? '',
    pageNumber: params.pageNumber ?? 1,
    pageSize: params.pageSize ?? 24,
    needTotalCount: params.needTotalCount ?? true,
  };

  // جستجوی بدون OnlyClientVisible با API فعلی production هم کار می‌کند (فیلتر انقضا در onlyClientVisible قدیمی).
  let data = await apiSeminars.searchSeminars({ ...searchParams, onlyClientVisible: false });
  let items = mapSearchSeminarsResponse(data).filter(isClientCatalogSeminar);

  if (items.length === 0) {
    data = await apiSeminars.searchSeminars({ ...searchParams, onlyClientVisible: true });
    items = mapSearchSeminarsResponse(data);
  }

  return {
    items,
    totalCount: items.length > 0 ? data.totalCount : 0,
  };
}

function normalizeSeminarListItem(seminar: SeminarListItem): SeminarListItem {
  return {
    ...seminar,
    thumbnailUrl: getSeminarImageUrl(seminar.thumbnailUrl),
  };
}

function mapSearchSeminarsResponse(
  raw: Awaited<ReturnType<typeof apiSeminars.searchSeminars>>
): SeminarListItem[] {
  return raw.queryResult
    .map((item) => mapSearchSeminarRow(item as unknown as Record<string, unknown>))
    .filter((s) => s.id > 0);
}

/** لیست دوره‌ها (خروجی هم‌نام با API جستجو) */
export async function getCoursesList(params?: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
}): Promise<{ courses: CourseListItem[]; totalCount: number }> {
  const result = await requireApi(
    async () => {
      const data = await apiCourses.searchCourses({
        inputValue: params?.inputValue ?? '',
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 24,
        needTotalCount: true,
      });
      return { courses: data.queryResult.map(searchToListItem), totalCount: data.totalCount };
    },
    { courses: [] as CourseListItem[], totalCount: 0 }
  );
  return result;
}

/** دوره‌های جدید برای صفحه اصلی (استفاده از searchCourses برای گرفتن همه) */
export async function getLatestCourses(limit = 12): Promise<CourseListItem[]> {
  const result: CourseListItem[] = await requireApi(
    async (): Promise<CourseListItem[]> => {
      const data: PagedData<SearchCourseQri> = await apiCourses.searchCourses({
        pageNumber: 1,
        pageSize: limit,
        needTotalCount: false,
        inputValue: '', 
      });
      return data.queryResult.map(searchToListItem);
    },
    []
  );
  return result;
}

/** دوره‌های پرطرفدار برای صفحه اصلی (هم‌نام با API) */
export async function getPopularCourses(limit = 8): Promise<CourseListItem[]> {
  const result: CourseListItem[] = await requireApi(
    async (): Promise<CourseListItem[]> => {
      const data: PagedData<GetAllPopularCourseQri> = await apiCourses.getAllPopularCourses({
        pageNumber: 1,
        pageSize: limit,
        needTotalCount: false,
      });
      return data.queryResult.map(popularToListItem);
    },
    []
  );
  return result;
}

/** جزئیات یک دوره (برای صفحه جزئیات؛ نوع Course با آداپتر) */
export const getCourseBySlug = cache(async (slug: string): Promise<Course | null> => {
  const decoded = decodeURIComponent(slug.trim());
  if (!decoded) return null;
  try {
    const api: CourseQri | null = await apiCourses.getCourseBySlug(decoded);
    if (!api) return null;
    return courseQriToCourse(api);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404 || error.status === 204) return null;
      if (error.status === 0) return null;
    }
    console.error('[getCourseBySlug] failed:', decoded, error);
    return null;
  }
});

/** @deprecated Use getCourseBySlug for public URLs */
export const getCourseById = cache(async (id: number | string): Promise<Course | null> => {
  const numId: number = typeof id === 'string' ? parseInt(id, 10) : id;
  if (Number.isNaN(numId)) return null;
  try {
    const api: CourseQri | null = await apiCourses.getCourseById(numId);
    if (!api) return null;
    return courseQriToCourse(api);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404 || error.status === 204) return null;
      if (error.status === 0) return null;
    }
    console.error('[getCourseById] failed:', numId, error);
    return null;
  }
});

/** لیست مقالات (خروجی هم‌نام با API جستجو) */
export async function getArticlesList(params?: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
  categoryId?: number;
}): Promise<{ articles: ArticleListItem[]; totalCount: number }> {
  const result = await requireApi(
    async () => {
      const data = await apiArticles.searchArticles({
        inputValue: params?.inputValue ?? '',
        pageNumber: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 24,
        needTotalCount: true,
        publishedOnly: true,
        categoryId: params?.categoryId,
      });
      return { articles: data.queryResult.map(normalizeArticleListItem), totalCount: data.totalCount };
    },
    { articles: [] as ArticleListItem[], totalCount: 0 }
  );
  return result;
}

export type ArticleCategoryStat = {
  name: string;
  count: number;
};

export async function getArticleDetailSidebarData(currentArticle: Article): Promise<{
  categoryArticles: ArticleListItem[];
  recentArticles: ArticleListItem[];
  categories: ArticleCategoryStat[];
}> {
  const currentId = Number(currentArticle.id);

  const [allResult, categoryResult] = await Promise.all([
    getArticlesList({ pageSize: 48 }),
    currentArticle.categoryId
      ? getArticlesList({ pageSize: 12, categoryId: currentArticle.categoryId })
      : Promise.resolve({ articles: [], totalCount: 0 }),
  ]);

  const exclude = (items: ArticleListItem[]) =>
    items.filter((a) => a.id !== currentId);

  const categoryArticles = exclude(categoryResult.articles).slice(0, 5);
  const recentArticles = exclude(allResult.articles).slice(0, 5);

  const categoryMap = new Map<string, number>();
  for (const item of allResult.articles) {
    const name = item.categoryName?.trim() || '';
    if (!name) continue;
    categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1);
  }

  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { categoryArticles, recentArticles, categories };
}

/** جزئیات مقاله با slug */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const api = await apiArticles.getArticleBySlug(slug);
    return api ? articleQriToArticle(api) : null;
  } catch {
    return null;
  }
}

/** پروژه‌های جدید برای صفحه اصلی */
export async function getLatestProjects(limit = 12): Promise<ProjectListItem[]> {
  const result = await requireApi(async () => {
    const data = await apiProjects.searchProjects({
      pageNumber: 1,
      pageSize: limit,
      needTotalCount: false,
      publishedOnly: true,
    });
    return data.queryResult.map(normalizeProjectListItem);
  }, [] as ProjectListItem[]);
  return result;
}

/** لیست پروژه‌ها (خروجی هم‌نام با API جستجو) */
export async function getProjectsList(params?: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
  tag?: string;
  technology?: string;
}): Promise<{ projects: ProjectListItem[]; totalCount: number }> {
  const result = await requireApi(async () => {
    const data = await apiProjects.searchProjects({
      inputValue: params?.inputValue ?? '',
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 24,
      needTotalCount: true,
      publishedOnly: true,
      tag: params?.tag,
      technology: params?.technology,
    });
    return {
      projects: data.queryResult.map(normalizeProjectListItem),
      totalCount: data.totalCount,
    };
  }, { projects: [] as ProjectListItem[], totalCount: 0 });
  return result;
}

/** جزئیات پروژه با slug */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const api = await apiProjects.getProjectBySlug(slug);
    if (!api || !api.isPublished) return null;
    return projectQriToProject(api);
  } catch (e) {
    const status =
      e && typeof e === 'object' && 'status' in e ? Number((e as { status: number }).status) : 0;
    if (status === 404 || status === 204 || status === 400) return null;
    return null;
  }
}

/** لیست سمینارها (خروجی هم‌نام با API جستجو) */
export async function getSeminarsList(params?: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
}): Promise<{ seminars: SeminarListItem[]; totalCount: number }> {
  const result = await requireApi(async () => {
    const { items, totalCount } = await fetchClientSeminarList({
      inputValue: params?.inputValue,
      pageNumber: params?.pageNumber,
      pageSize: params?.pageSize,
      needTotalCount: true,
    });
    return {
      seminars: items.map(normalizeSeminarListItem),
      totalCount,
    };
  }, { seminars: [] as SeminarListItem[], totalCount: 0 });
  return result;
}

/** سمینارهای آینده برای صفحه اصلی */
export async function getUpcomingSeminars(limit = 5): Promise<SeminarListItem[]> {
  const result = await requireApi(async () => {
    const { items } = await fetchClientSeminarList({
      pageNumber: 1,
      pageSize: limit,
      needTotalCount: false,
    });
    return items.map(normalizeSeminarListItem);
  }, [] as SeminarListItem[]);
  return result;
}

/** جزئیات یک سمینار */
export async function getSeminarById(id: number | string): Promise<Seminar | null> {
  const numId: number = typeof id === 'string' ? parseInt(id, 10) : id;
  if (Number.isNaN(numId) || numId <= 0) return null;

  try {
    const api: SeminarQri | null = await apiSeminars.getSeminarById(numId);
    if (!api) return null;
    const raw = api as unknown as Record<string, unknown>;
    const resolvedId = Number(raw.id ?? raw.Id ?? 0);
    if (!resolvedId) return null;
    const status = Number(api.status ?? (raw.status ?? raw.Status ?? 0));
    if (status === 0 || status === 4) return null;
    const isPublic = Boolean(raw.isPublic ?? raw.IsPublic ?? true);
    if (!isPublic) return null;
    return seminarQriToSeminar(api);
  } catch (e) {
    const status =
      e && typeof e === 'object' && 'status' in e ? Number((e as { status: number }).status) : 0;
    if (status === 404 || status === 204 || status === 400) return null;
    return null;
  }
}

/** لیست کتاب‌های منتشرشده اساتید */
export async function getPublicCategoryTree() {
  try {
    const { searchCategoryTree } = await import('@/lib/api/categories');
    return await searchCategoryTree({ pageSize: 500 });
  } catch {
    return [];
  }
}

/** لیست کتاب‌های منتشرشده اساتید */
export async function getBooksList(params?: {
  search?: string;
  tag?: string;
  categoryId?: number;
  pageNumber?: number;
  pageSize?: number;
}) {
  try {
    const apiBooks = await import('@/lib/api/books');
    return await apiBooks.searchBooks({
      search: params?.search,
      tag: params?.tag,
      categoryId: params?.categoryId,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 48,
    });
  } catch {
    return { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 48 };
  }
}

/** جزئیات یک کتاب با slug */
export async function getBookDetailBySlug(slug: string) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((item) => `${item.name}=${item.value}`)
      .join('; ');
    const apiBooks = await import('@/lib/api/books');
    return await apiBooks.getBookBySlug(slug, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
  } catch {
    return null;
  }
}

/** لیست نرم‌افزارهای منتشرشده */
export async function getSoftwareList(params?: {
  search?: string;
  tag?: string;
  categoryId?: number;
  pageNumber?: number;
  pageSize?: number;
}) {
  try {
    const apiSoftware = await import('@/lib/api/software');
    return await apiSoftware.searchSoftware({
      search: params?.search,
      tag: params?.tag,
      categoryId: params?.categoryId,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 48,
    });
  } catch {
    return { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 48 };
  }
}

/** جزئیات یک نرم‌افزار با slug */
export async function getSoftwareDetailBySlug(slug: string) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((item) => `${item.name}=${item.value}`)
      .join('; ');
    const apiSoftware = await import('@/lib/api/software');
    return await apiSoftware.getSoftwareBySlug(slug, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
  } catch {
    return null;
  }
}
