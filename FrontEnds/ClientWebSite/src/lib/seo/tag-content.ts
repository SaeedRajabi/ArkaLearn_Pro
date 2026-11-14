import * as apiArticles from '@/lib/api/articles';
import * as apiCourses from '@/lib/api/courses';
import * as apiProjects from '@/lib/api/projects';
import * as apiSeminars from '@/lib/api/seminars';
import { articleQriToArticle, seminarQriToSeminar } from '@/lib/api/adapters';
import { itemHasTag, mergeUniqueTags, normalizeTag, tagToSlug } from '@/lib/seo/tag-utils';
import { buildCourseSlug } from '@/lib/course-slug';
import type {
  ArticleListItem,
  CourseListItem,
  ProjectListItem,
  SeminarListItem,
} from '@/types';

export type TagCatalogEntry = {
  tag: string;
  slug: string;
  count: number;
};

export type TagContentResult = {
  tag: string;
  articles: ArticleListItem[];
  courses: CourseListItem[];
  seminars: SeminarListItem[];
  projects: ProjectListItem[];
};

function normalizeProjectTags(raw: string[] | { $values?: string[] } | undefined): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.$values ?? [];
  return list.map((t) => String(t).trim()).filter(Boolean);
}

function normalizeCourseListItem(course: {
  id: number;
  title: string;
  slug?: string;
  price?: number;
  createAt?: string;
  coursePlan?: string | null;
  courseLevel?: string;
  shortDescription?: string;
  titleImage?: string;
  categoryName: string;
  status: string;
  videoUrl?: string;
  studentCount: number;
}): CourseListItem {
  return {
    id: course.id,
    title: course.title,
    slug: course.slug?.trim() || buildCourseSlug(course.title, course.id),
    price: course.price,
    createAt: course.createAt,
    coursePlan: course.coursePlan,
    courseLevel: course.courseLevel,
    shortDescription: course.shortDescription,
    titleImage: course.titleImage,
    categoryName: course.categoryName,
    status: course.status,
    videoUrl: course.videoUrl,
    studentCount: course.studentCount,
  };
}

function normalizeArticleListItem(article: {
  id: number;
  title: string;
  summary: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string | null;
  categoryName?: string;
  createdAt: string;
}): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    slug: article.slug,
    thumbnailUrl: article.thumbnailUrl,
    isPublished: article.isPublished,
    publishedAt: article.publishedAt,
    categoryName: article.categoryName,
    createdAt: article.createdAt,
  };
}

function normalizeSeminarListItem(seminar: {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  price: number;
  isFree: boolean;
  status: number;
  isPublic?: boolean;
  thumbnailUrl?: string;
  roomId?: number;
  roomTitle?: string;
}): SeminarListItem {
  return {
    id: seminar.id,
    title: seminar.title,
    description: seminar.description,
    startTime: seminar.startTime,
    endTime: seminar.endTime,
    capacity: seminar.capacity,
    registeredCount: seminar.registeredCount,
    price: seminar.price,
    isFree: seminar.isFree,
    status: seminar.status,
    isPublic: seminar.isPublic,
    thumbnailUrl: seminar.thumbnailUrl,
    roomId: seminar.roomId,
    roomTitle: seminar.roomTitle,
  };
}

function normalizeProjectListItem(project: {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  tags?: string[] | { $values?: string[] };
  technologies?: string[] | { $values?: string[] };
}): ProjectListItem {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    thumbnailUrl: project.thumbnailUrl,
    isPublished: project.isPublished,
    publishedAt: project.publishedAt,
    createdAt: project.createdAt,
    tags: normalizeProjectTags(project.tags),
    technologies: normalizeProjectTags(project.technologies as string[] | { $values?: string[] }),
  };
}

async function collectArticleTags(limit = 80): Promise<string[]> {
  const data = await apiArticles.searchArticles({ pageSize: limit, publishedOnly: true, needTotalCount: false });
  const tags: string[] = [];
  const batchSize = 10;
  const items = data.queryResult.slice(0, limit);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map(async (item) => {
        try {
          const raw = await apiArticles.getArticleBySlug(item.slug);
          return raw ? articleQriToArticle(raw) : null;
        } catch {
          return null;
        }
      })
    );
    for (const article of details) {
      if (!article) continue;
      const articleTags = Array.isArray(article.tags) ? article.tags : article.tags?.$values ?? [];
      tags.push(...articleTags);
    }
  }
  return tags;
}

async function collectCourseTags(limit = 60): Promise<string[]> {
  const data = await apiCourses.searchCourses({ pageSize: limit, needTotalCount: false });
  const tags: string[] = [];
  const batchSize = 10;

  for (let i = 0; i < data.queryResult.length; i += batchSize) {
    const batch = data.queryResult.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map(async (item) => {
        try {
          const raw = await apiCourses.getCourseById(item.id);
          return raw?.tags ?? raw?.courseTags ?? [];
        } catch {
          return [];
        }
      })
    );
    for (const courseTags of details) {
      tags.push(...courseTags);
    }
  }
  return tags;
}

async function collectSeminarTags(limit = 60): Promise<string[]> {
  const data = await apiSeminars.searchSeminars({ pageSize: limit, needTotalCount: false });
  const tags: string[] = [];

  for (const item of data.queryResult.slice(0, limit)) {
    try {
      const raw = await apiSeminars.getSeminarById(item.id);
      if (!raw) continue;
      const seminar = seminarQriToSeminar(raw);
      tags.push(...(seminar.tags ?? []));
    } catch {
      /* skip */
    }
  }
  return tags;
}

async function collectProjectTags(): Promise<string[]> {
  const data = await apiProjects.searchProjects({ pageSize: 500, publishedOnly: true, needTotalCount: false });
  const tags: string[] = [];
  for (const project of data.queryResult) {
    tags.push(...normalizeProjectTags(project.tags));
  }
  return tags;
}

export async function getTagCatalog(): Promise<TagCatalogEntry[]> {
  const [articleTags, courseTags, seminarTags, projectTags] = await Promise.all([
    collectArticleTags(60).catch(() => [] as string[]),
    collectCourseTags(40).catch(() => [] as string[]),
    collectSeminarTags(40).catch(() => [] as string[]),
    collectProjectTags().catch(() => [] as string[]),
  ]);

  const allTags = mergeUniqueTags(articleTags, courseTags, seminarTags, projectTags);
  const counts = new Map<string, { tag: string; count: number }>();

  const bump = (tag: string) => {
    const key = normalizeTag(tag);
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { tag: tag.trim(), count: 1 });
  };

  for (const t of articleTags) bump(t);
  for (const t of courseTags) bump(t);
  for (const t of seminarTags) bump(t);
  for (const t of projectTags) bump(t);

  return Array.from(counts.values())
    .map((entry) => ({
      tag: entry.tag,
      slug: tagToSlug(entry.tag),
      count: entry.count,
    }))
    .filter((entry) => entry.slug)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'fa'));
}

async function filterArticlesByTag(items: ArticleListItem[], tag: string): Promise<ArticleListItem[]> {
  const matched: ArticleListItem[] = [];
  for (const item of items.slice(0, 24)) {
    try {
      const raw = await apiArticles.getArticleBySlug(item.slug);
      if (!raw) continue;
      const article = articleQriToArticle(raw);
      const tags = Array.isArray(article.tags) ? article.tags : article.tags?.$values ?? [];
      if (itemHasTag(tags, tag)) matched.push(item);
    } catch {
      /* skip */
    }
  }
  return matched;
}

async function filterCoursesByTag(items: CourseListItem[], tag: string): Promise<CourseListItem[]> {
  const matched: CourseListItem[] = [];
  for (const item of items.slice(0, 24)) {
    try {
      const raw = await apiCourses.getCourseById(item.id);
      if (!raw) continue;
      const tags = raw.tags ?? raw.courseTags ?? [];
      if (itemHasTag(tags, tag)) matched.push(item);
    } catch {
      /* skip */
    }
  }
  return matched;
}

async function filterSeminarsByTag(items: SeminarListItem[], tag: string): Promise<SeminarListItem[]> {
  const matched: SeminarListItem[] = [];
  for (const item of items.slice(0, 24)) {
    try {
      const raw = await apiSeminars.getSeminarById(item.id);
      if (!raw) continue;
      const seminar = seminarQriToSeminar(raw);
      if (itemHasTag(seminar.tags, tag)) matched.push(item);
    } catch {
      /* skip */
    }
  }
  return matched;
}

export async function getContentByTag(rawTag: string): Promise<TagContentResult> {
  const tag = rawTag.trim();
  const [projectData, articleSearch, courseSearch, seminarSearch] = await Promise.all([
    apiProjects.searchProjects({ tag, pageSize: 36, publishedOnly: true, needTotalCount: true }),
    apiArticles.searchArticles({ inputValue: tag, pageSize: 36, publishedOnly: true, needTotalCount: true }),
    apiCourses.searchCourses({ inputValue: tag, pageSize: 36, needTotalCount: true }),
    apiSeminars.searchSeminars({ inputValue: tag, pageSize: 36, needTotalCount: true }),
  ]);

  const articlesRaw = articleSearch.queryResult.map(normalizeArticleListItem);
  const coursesRaw = courseSearch.queryResult.map(normalizeCourseListItem);
  const seminarsRaw = seminarSearch.queryResult.map(normalizeSeminarListItem);

  const [articles, courses, seminars] = await Promise.all([
    filterArticlesByTag(articlesRaw, tag),
    filterCoursesByTag(coursesRaw, tag),
    filterSeminarsByTag(seminarsRaw, tag),
  ]);

  return {
    tag,
    articles,
    courses,
    seminars,
    projects: projectData.queryResult.map(normalizeProjectListItem),
  };
}
