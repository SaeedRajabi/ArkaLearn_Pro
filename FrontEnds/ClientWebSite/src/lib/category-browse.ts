import { buildCourseSlug } from '@/lib/course-slug';
import {
  findCategoryInTree,
  getCategoryAncestry,
  type CategoryTreeItem,
} from '@/lib/api/categories';
import type { SearchArticleQri, SearchCourseQri } from '@/lib/api/types';
import type { TeacherBookListItem } from '@/lib/api/books';
import type { SoftwareListItem } from '@/lib/api/software';
import {
  getArticleImageUrl,
  getCourseImageUrl,
} from '@/lib/utils/image-url';

export type CategoryContentKind = 'course' | 'article' | 'book' | 'software';

export type CategoryFeaturedItem = {
  kind: CategoryContentKind;
  id: number;
  title: string;
  href: string;
  image?: string;
  subtitle?: string;
  score: number;
  badge?: string;
};

export type CategoryBrowseGroup = {
  kind: CategoryContentKind;
  labelKey: string;
  items: CategoryFeaturedItem[];
};

export type CategoryLookup = {
  idByName: Map<string, number[]>;
  nodesById: Map<number, CategoryTreeItem>;
};

function extractStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'object' && Array.isArray((raw as { $values?: unknown[] }).$values)) {
    return (raw as { $values: unknown[] }).$values.map(String).filter(Boolean);
  }
  return [];
}

export function buildCategoryLookup(tree: CategoryTreeItem[]): CategoryLookup {
  const idByName = new Map<string, number[]>();
  const nodesById = new Map<number, CategoryTreeItem>();

  const walk = (nodes: CategoryTreeItem[]) => {
    for (const node of nodes) {
      nodesById.set(node.id, node);
      const key = node.name.trim().toLowerCase();
      const list = idByName.get(key) ?? [];
      list.push(node.id);
      idByName.set(key, list);
      if (node.children.length > 0) walk(node.children);
    }
  };

  walk(tree);
  return { idByName, nodesById };
}

function readCategoryId(raw: Record<string, unknown>): number | null {
  const id = Number(raw.categoryId ?? raw.CategoryId ?? 0);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function readCategoryName(raw: Record<string, unknown>): string {
  return String(raw.categoryName ?? raw.CategoryName ?? '').trim();
}

export function resolveItemCategoryId(
  raw: Record<string, unknown>,
  lookup: CategoryLookup
): number | null {
  const directId = readCategoryId(raw);
  if (directId) return directId;

  const name = readCategoryName(raw).toLowerCase();
  if (!name) return null;

  const ids = lookup.idByName.get(name);
  if (ids?.length) return ids[0];

  return null;
}

function readCategoryPath(raw: Record<string, unknown>): string[] {
  return extractStringList(raw.categoryPath ?? raw.CategoryPath);
}

export function itemMatchesCategoryBranch(
  raw: Record<string, unknown>,
  branchIds: Set<number>,
  lookup: CategoryLookup
): boolean {
  const categoryId = resolveItemCategoryId(raw, lookup);
  if (categoryId && branchIds.has(categoryId)) return true;

  const path = readCategoryPath(raw);
  for (const segment of path) {
    const ids = lookup.idByName.get(segment.trim().toLowerCase());
    if (ids?.some((id) => branchIds.has(id))) return true;
  }

  const name = readCategoryName(raw).toLowerCase();
  if (name) {
    const ids = lookup.idByName.get(name);
    if (ids?.some((id) => branchIds.has(id))) return true;
  }

  return false;
}

export function getCategoryBranchIds(tree: CategoryTreeItem[], categoryId: number): number[] {
  const node = findCategoryInTree(tree, categoryId);
  if (!node) return [categoryId];

  const ids = [node.id];
  const walk = (current: CategoryTreeItem) => {
    for (const child of current.children) {
      ids.push(child.id);
      walk(child);
    }
  };
  walk(node);
  return ids;
}

export function buildCategoryBrowseUrl(categoryId: number): string {
  return `/categories/${categoryId}`;
}

export function collectRootCategoryIds(tree: CategoryTreeItem[]): number[] {
  return tree.map((node) => node.id);
}

/** Parent (root) categories that have at least one course in their subtree. */
export function collectCourseParentCategories(tree: CategoryTreeItem[]): CategoryTreeItem[] {
  const hasCoursesInSubtree = (node: CategoryTreeItem): boolean => {
    if (node.courseCount > 0) return true;
    return node.children.some(hasCoursesInSubtree);
  };
  return tree.filter((node) => node.name.trim().length > 0 && hasCoursesInSubtree(node));
}

export type CategoryTreeNavRow = {
  node: CategoryTreeItem;
  depth: number;
};

export function flattenCategoryNavRows(
  nodes: CategoryTreeItem[],
  depth = 0,
  expandedIds?: Set<number>
): CategoryTreeNavRow[] {
  const rows: CategoryTreeNavRow[] = [];
  for (const node of nodes) {
    rows.push({ node, depth });
    const canShowChildren = !expandedIds || expandedIds.has(node.id);
    if (node.children.length > 0 && canShowChildren) {
      rows.push(...flattenCategoryNavRows(node.children, depth + 1, expandedIds));
    }
  }
  return rows;
}

function normalizeSearchCourse(raw: Record<string, unknown>): SearchCourseQri {
  const id = Number(raw.id ?? raw.Id ?? raw.courseId ?? raw.CourseId ?? 0);
  const title = String(raw.title ?? raw.Title ?? '');
  return {
    id,
    title,
    slug: String(raw.slug ?? raw.Slug ?? '').trim() || undefined,
    price: raw.price != null ? Number(raw.price) : raw.Price != null ? Number(raw.Price) : undefined,
    originalPrice:
      raw.originalPrice != null
        ? Number(raw.originalPrice)
        : raw.OriginalPrice != null
          ? Number(raw.OriginalPrice)
          : undefined,
    createAt: String(raw.createAt ?? raw.CreateAt ?? ''),
    coursePlan: String(raw.coursePlan ?? raw.CoursePlan ?? ''),
    courseLevel: String(raw.courseLevel ?? raw.CourseLevel ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    titleImage: String(raw.titleImage ?? raw.TitleImage ?? raw.logoImage ?? raw.LogoImage ?? ''),
    categoryName: readCategoryName(raw),
    categoryId: readCategoryId(raw) ?? undefined,
    categoryPath: readCategoryPath(raw),
    status: String(raw.status ?? raw.Status ?? ''),
    videoUrl: String(raw.videoUrl ?? raw.VideoUrl ?? ''),
    studentCount: Number(raw.studentCount ?? raw.StudentCount ?? 0),
    commentCount: Number(raw.commentCount ?? raw.CommentCount ?? 0),
    likeCount: Number(raw.likeCount ?? raw.LikeCount ?? 0),
    rating: Number(raw.rating ?? raw.Rating ?? 0),
    teacherName: String(raw.teacherName ?? raw.TeacherName ?? '').trim() || undefined,
    durationMinutes: (() => {
      const n = Number(raw.durationMinutes ?? raw.DurationMinutes ?? 0);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    })(),
  };
}

function normalizeSearchArticle(raw: Record<string, unknown>): SearchArticleQri {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    summary: String(raw.summary ?? raw.Summary ?? ''),
    slug: String(raw.slug ?? raw.Slug ?? ''),
    thumbnailUrl: String(raw.thumbnailUrl ?? raw.ThumbnailUrl ?? '') || undefined,
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished ?? true),
    publishedAt: String(raw.publishedAt ?? raw.PublishedAt ?? '') || undefined,
    categoryId: readCategoryId(raw) ?? undefined,
    categoryName: readCategoryName(raw) || undefined,
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
  };
}

function normalizeBook(raw: Record<string, unknown>): TeacherBookListItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    teacherId: Number(raw.teacherId ?? raw.TeacherId ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    coverImageUrl: String(raw.coverImageUrl ?? raw.CoverImageUrl ?? '') || undefined,
    slug: String(raw.slug ?? raw.Slug ?? ''),
    tags: extractStringList(raw.tags ?? raw.Tags),
    categoryId: readCategoryId(raw) ?? undefined,
    categoryName: readCategoryName(raw) || undefined,
    categoryPath: readCategoryPath(raw),
  };
}

function normalizeSoftware(raw: Record<string, unknown>): SoftwareListItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    shortDescription: String(raw.shortDescription ?? raw.ShortDescription ?? ''),
    coverImageUrl: String(raw.coverImageUrl ?? raw.CoverImageUrl ?? '') || undefined,
    categoryId: readCategoryId(raw) ?? undefined,
    categoryName: readCategoryName(raw) || undefined,
    categoryPath: readCategoryPath(raw),
    slug: String(raw.slug ?? raw.Slug ?? ''),
    tags: extractStringList(raw.tags ?? raw.Tags),
    downloadCount: Number(raw.downloadCount ?? raw.DownloadCount ?? 0),
    likeCount: Number(raw.likeCount ?? raw.LikeCount ?? 0),
    isLikedByViewer: false,
    isPlatformOwned: Boolean(raw.isPlatformOwned ?? raw.IsPlatformOwned ?? false),
  };
}

export type CategoryContentPools = {
  courses: SearchCourseQri[];
  articles: SearchArticleQri[];
  books: TeacherBookListItem[];
  software: SoftwareListItem[];
};

export async function loadCategoryContentPools(): Promise<CategoryContentPools> {
  const [coursesRes, articlesRes, booksRes, softwareRes] = await Promise.all([
    import('@/lib/api/courses')
      .then((m) => m.searchCourses({ pageSize: 500, needTotalCount: false }))
      .catch(() => ({ queryResult: [] as Record<string, unknown>[] })),
    import('@/lib/api/articles')
      .then((m) =>
        m.searchArticles({ pageSize: 500, needTotalCount: false, publishedOnly: true })
      )
      .catch(() => ({ queryResult: [] as Record<string, unknown>[] })),
    import('@/lib/api/books')
      .then((m) => m.searchBooks({ pageSize: 500 }))
      .catch(() => ({ queryResult: [] as Record<string, unknown>[] })),
    import('@/lib/api/software')
      .then((m) => m.searchSoftware({ pageSize: 500 }))
      .catch(() => ({ queryResult: [] as Record<string, unknown>[] })),
  ]);

  const coursesRaw = (coursesRes.queryResult ?? []) as Record<string, unknown>[];
  const articlesRaw = (articlesRes.queryResult ?? []) as Record<string, unknown>[];

  return {
    courses: coursesRaw.map(normalizeSearchCourse).filter((c) => c.id > 0),
    articles: articlesRaw.map(normalizeSearchArticle).filter((a) => a.id > 0),
    books: ((booksRes.queryResult ?? []) as Record<string, unknown>[])
      .map(normalizeBook)
      .filter((b) => b.id > 0),
    software: ((softwareRes.queryResult ?? []) as Record<string, unknown>[])
      .map(normalizeSoftware)
      .filter((s) => s.id > 0),
  };
}

function courseScore(course: SearchCourseQri): number {
  return (
    (course.rating ?? 0) * 12 +
    (course.commentCount ?? 0) * 4 +
    (course.likeCount ?? 0) * 2 +
    (course.studentCount ?? 0) * 0.25
  );
}

function articleScore(article: SearchArticleQri): number {
  const published = article.publishedAt || article.createdAt;
  const ts = published ? new Date(published).getTime() : 0;
  return ts / 1_000_000_000;
}

function bookScore(book: TeacherBookListItem): number {
  return (book.publicationYear ?? 0) * 0.5 + (book.title?.length ?? 0) * 0.01;
}

function softwareScore(item: SoftwareListItem): number {
  return item.likeCount * 2 + item.downloadCount * 0.5;
}

function toCourseItem(course: SearchCourseQri): CategoryFeaturedItem {
  const slug = course.slug?.trim() || buildCourseSlug(course.title, course.id);
  const rating = course.rating ?? 0;
  return {
    kind: 'course',
    id: course.id,
    title: course.title,
    href: `/courses/${encodeURIComponent(slug)}`,
    image: getCourseImageUrl(course.titleImage),
    subtitle: course.categoryName,
    score: courseScore(course),
    badge: rating > 0 ? `${rating.toFixed(1)} ★` : undefined,
  };
}

function toArticleItem(article: SearchArticleQri): CategoryFeaturedItem {
  return {
    kind: 'article',
    id: article.id,
    title: article.title,
    href: `/articles/${encodeURIComponent(article.slug)}`,
    image: getArticleImageUrl(article.thumbnailUrl),
    subtitle: article.categoryName,
    score: articleScore(article),
  };
}

function toBookItem(book: TeacherBookListItem): CategoryFeaturedItem {
  return {
    kind: 'book',
    id: book.id,
    title: book.title,
    href: `/books/${encodeURIComponent(book.slug)}`,
    image: book.coverImageUrl,
    subtitle: book.categoryName,
    score: bookScore(book),
  };
}

function toSoftwareItem(item: SoftwareListItem): CategoryFeaturedItem {
  return {
    kind: 'software',
    id: item.id,
    title: item.title,
    href: `/software/${encodeURIComponent(item.slug)}`,
    image: item.coverImageUrl,
    subtitle: item.categoryName,
    score: softwareScore(item),
  };
}

function collectBranchItems(
  tree: CategoryTreeItem[],
  categoryId: number,
  pools: CategoryContentPools,
  lookup: CategoryLookup
): CategoryFeaturedItem[] {
  const branchIds = new Set(getCategoryBranchIds(tree, categoryId));
  const items: CategoryFeaturedItem[] = [];

  for (const course of pools.courses) {
    if (itemMatchesCategoryBranch(course as unknown as Record<string, unknown>, branchIds, lookup)) {
      items.push(toCourseItem(course));
    }
  }
  for (const article of pools.articles) {
    if (itemMatchesCategoryBranch(article as unknown as Record<string, unknown>, branchIds, lookup)) {
      items.push(toArticleItem(article));
    }
  }
  for (const book of pools.books) {
    if (itemMatchesCategoryBranch(book as unknown as Record<string, unknown>, branchIds, lookup)) {
      items.push(toBookItem(book));
    }
  }
  for (const software of pools.software) {
    if (itemMatchesCategoryBranch(software as unknown as Record<string, unknown>, branchIds, lookup)) {
      items.push(toSoftwareItem(software));
    }
  }

  items.sort((a, b) => b.score - a.score);
  return items;
}

function walkCategoryNodes(tree: CategoryTreeItem[], visit: (node: CategoryTreeItem) => void) {
  for (const node of tree) {
    visit(node);
    if (node.children.length > 0) walkCategoryNodes(node.children, visit);
  }
}

export function buildFeaturedByCategoryId(
  tree: CategoryTreeItem[],
  pools: CategoryContentPools,
  maxPerCategory = 4
): Record<number, CategoryFeaturedItem[]> {
  const lookup = buildCategoryLookup(tree);
  const result: Record<number, CategoryFeaturedItem[]> = {};

  walkCategoryNodes(tree, (node) => {
    result[node.id] = collectBranchItems(tree, node.id, pools, lookup).slice(0, maxPerCategory);
  });

  return result;
}

export function buildCategoryBrowseGroups(
  tree: CategoryTreeItem[],
  categoryId: number,
  pools: CategoryContentPools
): CategoryBrowseGroup[] {
  const lookup = buildCategoryLookup(tree);
  const items = collectBranchItems(tree, categoryId, pools, lookup);
  const groups: CategoryBrowseGroup[] = [
    { kind: 'course', labelKey: 'courses', items: [] },
    { kind: 'article', labelKey: 'articles', items: [] },
    { kind: 'book', labelKey: 'books', items: [] },
    { kind: 'software', labelKey: 'software', items: [] },
  ];

  for (const item of items) {
    const group = groups.find((g) => g.kind === item.kind);
    if (group) group.items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}

export function countCategoryBranchItems(
  tree: CategoryTreeItem[],
  categoryId: number,
  pools: CategoryContentPools
): number {
  const lookup = buildCategoryLookup(tree);
  return collectBranchItems(tree, categoryId, pools, lookup).length;
}

export function buildCategoryBreadcrumbTrail(
  tree: CategoryTreeItem[],
  categoryId: number,
  homeLabel: string
): { label: string; href: string }[] {
  const path = getCategoryAncestry(tree, categoryId);
  const crumbs = [{ label: homeLabel, href: '/' }];

  for (const node of path) {
    crumbs.push({ label: node.name, href: buildCategoryBrowseUrl(node.id) });
  }

  return crumbs;
}
