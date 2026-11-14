import { apiRequest, buildQuery } from './client';
import { normalizePagedResponse, type PagedData } from './types';
import { unwrapApiList } from '@/lib/api/normalize-list';
import type { TeacherBook } from '@/lib/api/professor-books';

const BASE = 'Teacher';

export type TeacherBookListItem = {
  id: number;
  teacherId: number;
  title: string;
  shortDescription: string;
  coverImageUrl?: string;
  bookFileUrl?: string;
  bookFileName?: string;
  hasBookFile?: boolean;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  slug: string;
  tags: string[];
  categoryId?: number;
  categoryName?: string;
  categoryPath?: string[];
  teacherDisplayName?: string;
  teacherUserName?: string;
  teacherAvatarUrl?: string;
};

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.$values)) return obj.$values.map(String).filter(Boolean);
  }
  return [];
}

function mapListItem(row: Record<string, unknown>): TeacherBookListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    teacherId: Number(row.teacherId ?? row.TeacherId ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
    coverImageUrl: String(row.coverImageUrl ?? row.CoverImageUrl ?? '') || undefined,
    bookFileUrl: String(row.bookFileUrl ?? row.BookFileUrl ?? '') || undefined,
    bookFileName: String(row.bookFileName ?? row.BookFileName ?? '') || undefined,
    pdfFileUrl: String(row.pdfFileUrl ?? row.PdfFileUrl ?? '') || undefined,
    pdfFileName: String(row.pdfFileName ?? row.PdfFileName ?? '') || undefined,
    epubFileUrl: String(row.epubFileUrl ?? row.EpubFileUrl ?? '') || undefined,
    epubFileName: String(row.epubFileName ?? row.EpubFileName ?? '') || undefined,
    wordFileUrl: String(row.wordFileUrl ?? row.WordFileUrl ?? '') || undefined,
    wordFileName: String(row.wordFileName ?? row.WordFileName ?? '') || undefined,
    hasBookFile: Boolean(row.hasBookFile ?? row.HasBookFile),
    publisher: String(row.publisher ?? row.Publisher ?? '') || undefined,
    publicationYear:
      row.publicationYear != null
        ? Number(row.publicationYear)
        : row.PublicationYear != null
          ? Number(row.PublicationYear)
          : undefined,
    isbn: String(row.isbn ?? row.Isbn ?? '') || undefined,
    slug: String(row.slug ?? row.Slug ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
    categoryId:
      row.categoryId != null
        ? Number(row.categoryId)
        : row.CategoryId != null
          ? Number(row.CategoryId)
          : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    categoryPath: parseTags(row.categoryPath ?? row.CategoryPath),
    teacherDisplayName: String(row.teacherDisplayName ?? row.TeacherDisplayName ?? '') || undefined,
    teacherUserName: String(row.teacherUserName ?? row.TeacherUserName ?? '') || undefined,
    teacherAvatarUrl: String(row.teacherAvatarUrl ?? row.TeacherAvatarUrl ?? '') || undefined,
  };
}

function mapBook(row: Record<string, unknown>): TeacherBook {
  const statusRaw = String(row.approvalStatus ?? row.ApprovalStatus ?? 'approved').toLowerCase();
  return {
    id: Number(row.id ?? row.Id ?? 0),
    teacherId: Number(row.teacherId ?? row.TeacherId ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
    longDescriptionHtml: String(row.longDescriptionHtml ?? row.LongDescriptionHtml ?? ''),
    coverImageUrl: String(row.coverImageUrl ?? row.CoverImageUrl ?? '') || undefined,
    bookFileUrl: String(row.bookFileUrl ?? row.BookFileUrl ?? '') || undefined,
    bookFileName: String(row.bookFileName ?? row.BookFileName ?? '') || undefined,
    pdfFileUrl: String(row.pdfFileUrl ?? row.PdfFileUrl ?? '') || undefined,
    pdfFileName: String(row.pdfFileName ?? row.PdfFileName ?? '') || undefined,
    epubFileUrl: String(row.epubFileUrl ?? row.EpubFileUrl ?? '') || undefined,
    epubFileName: String(row.epubFileName ?? row.EpubFileName ?? '') || undefined,
    wordFileUrl: String(row.wordFileUrl ?? row.WordFileUrl ?? '') || undefined,
    wordFileName: String(row.wordFileName ?? row.WordFileName ?? '') || undefined,
    publisher: String(row.publisher ?? row.Publisher ?? '') || undefined,
    publicationYear:
      row.publicationYear != null
        ? Number(row.publicationYear)
        : row.PublicationYear != null
          ? Number(row.PublicationYear)
          : undefined,
    isbn: String(row.isbn ?? row.Isbn ?? '') || undefined,
    slug: String(row.slug ?? row.Slug ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
    categoryId:
      row.categoryId != null
        ? Number(row.categoryId)
        : row.CategoryId != null
          ? Number(row.CategoryId)
          : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    categoryPath: parseTags(row.categoryPath ?? row.CategoryPath),
    approvalStatus: statusRaw as TeacherBook['approvalStatus'],
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    teacherDisplayName: String(row.teacherDisplayName ?? row.TeacherDisplayName ?? '') || undefined,
    teacherUserName: String(row.teacherUserName ?? row.TeacherUserName ?? '') || undefined,
    teacherAvatarUrl: String(row.teacherAvatarUrl ?? row.TeacherAvatarUrl ?? '') || undefined,
  };
}

export async function searchBooks(params?: {
  search?: string;
  tag?: string;
  categoryId?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedData<TeacherBookListItem>> {
  const raw = await apiRequest<unknown>(
    `${BASE}/SearchBooks${buildQuery({
      search: params?.search,
      tag: params?.tag,
      categoryId: params?.categoryId,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 24,
    })}`
  );

  if (!raw || typeof raw !== 'object') {
    return { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 24 };
  }

  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj;
  const paged = normalizePagedResponse(layer as Parameters<typeof normalizePagedResponse>[0]);
  return {
    ...paged,
    queryResult: paged.queryResult.map((row) => mapListItem(row as unknown as Record<string, unknown>)),
  };
}

export async function getBookBySlug(
  slug: string,
  options?: { headers?: HeadersInit }
): Promise<TeacherBook | null> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetBookBySlug${buildQuery({ slug })}`,
    { headers: options?.headers, credentials: 'include' }
  );

  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult ?? obj;
  const row =
    layer && typeof layer === 'object' && !Array.isArray(layer)
      ? (layer as Record<string, unknown>)
      : obj;
  const book = mapBook(row);
  return book.id > 0 || book.slug ? book : null;
}

export async function getTeacherBooks(params: {
  userId?: number;
  teacherId?: number;
  userName?: string;
}): Promise<TeacherBookListItem[]> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetTeacherBooks${buildQuery({
      userId: params.userId,
      teacherId: params.teacherId,
      userName: params.userName,
    })}`
  );
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapListItem)
    .filter((b) => b.id > 0);
}
