import { apiRequest, buildQuery } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';

const BASE = 'Teacher';
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_BOOK_FILE_BYTES = 50 * 1024 * 1024;

export type BookApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';

export type TeacherBook = {
  id: number;
  teacherId: number;
  title: string;
  shortDescription: string;
  longDescriptionHtml: string;
  coverImageUrl?: string;
  bookFileUrl?: string;
  bookFileName?: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  epubFileUrl?: string;
  epubFileName?: string;
  wordFileUrl?: string;
  wordFileName?: string;
  categoryId?: number;
  categoryName?: string;
  categoryPath?: string[];
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  slug: string;
  tags: string[];
  approvalStatus: BookApprovalStatus;
  sortOrder: number;
  teacherDisplayName?: string;
  teacherUserName?: string;
  teacherAvatarUrl?: string;
};

export type BookFormatSavePayload = {
  pdfFileUrl?: string;
  pdfFileName?: string;
  epubFileUrl?: string;
  epubFileName?: string;
  wordFileUrl?: string;
  wordFileName?: string;
};

export function bookHasAnyFile(book: Pick<TeacherBook, 'pdfFileUrl' | 'epubFileUrl' | 'wordFileUrl' | 'bookFileUrl'>): boolean {
  return Boolean(book.pdfFileUrl || book.epubFileUrl || book.wordFileUrl || book.bookFileUrl);
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.$values)) return obj.$values.map(String).filter(Boolean);
  }
  return [];
}

function mapBook(row: Record<string, unknown>): TeacherBook {
  const statusRaw = String(row.approvalStatus ?? row.ApprovalStatus ?? 'draft').toLowerCase();
  const approvalStatus = (
    ['approved', 'pending', 'rejected', 'draft'].includes(statusRaw) ? statusRaw : 'draft'
  ) as BookApprovalStatus;

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
    categoryId:
      row.categoryId != null
        ? Number(row.categoryId)
        : row.CategoryId != null
          ? Number(row.CategoryId)
          : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    categoryPath: parseTags(row.categoryPath ?? row.CategoryPath),
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
    approvalStatus,
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    teacherDisplayName: String(row.teacherDisplayName ?? row.TeacherDisplayName ?? '') || undefined,
    teacherUserName: String(row.teacherUserName ?? row.TeacherUserName ?? '') || undefined,
    teacherAvatarUrl: String(row.teacherAvatarUrl ?? row.TeacherAvatarUrl ?? '') || undefined,
  };
}

function parseUploadUrl(raw: unknown): { url: string; fileName?: string } {
  if (!raw || typeof raw !== 'object') return { url: '' };
  const record = raw as Record<string, unknown>;
  const layer = record.data ?? record.Data ?? record;
  if (layer && typeof layer === 'object') {
    const inner = layer as Record<string, unknown>;
    return {
      url: String(inner.url ?? inner.Url ?? ''),
      fileName: String(inner.fileName ?? inner.FileName ?? '') || undefined,
    };
  }
  return {
    url: String(record.url ?? record.Url ?? ''),
    fileName: String(record.fileName ?? record.FileName ?? '') || undefined,
  };
}

export async function getMyBooks(): Promise<TeacherBook[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyBooks`, { credentials: 'include' });
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapBook)
    .filter((b) => b.id > 0);
}

export async function uploadBookCover(file: File): Promise<string> {
  if (file.size > MAX_COVER_BYTES) {
    throw new Error('Cover image must be 5 MB or smaller.');
  }

  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadBookCover`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const { url } = parseUploadUrl(raw);
  if (!url) throw new Error('Cover upload did not return a URL.');
  return url;
}

export async function uploadBookFile(file: File): Promise<{ url: string; fileName: string }> {
  if (file.size > MAX_BOOK_FILE_BYTES) {
    throw new Error('Book file must be 50 MB or smaller.');
  }

  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadBookFile`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const { url, fileName } = parseUploadUrl(raw);
  if (!url) throw new Error('Book file upload did not return a URL.');
  return { url, fileName: fileName ?? file.name };
}

export async function saveTeacherBook(payload: {
  bookId?: number;
  title: string;
  shortDescription: string;
  longDescriptionHtml: string;
  coverImageUrl?: string;
  bookFileUrl?: string;
  bookFileName?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  tags?: string[];
  sortOrder?: number;
  categoryId?: number | null;
} & BookFormatSavePayload): Promise<number> {
  const body: Record<string, unknown> = {
    bookId: payload.bookId ?? 0,
    title: payload.title,
    shortDescription: payload.shortDescription,
    longDescriptionHtml: payload.longDescriptionHtml,
    coverImageUrl: payload.coverImageUrl ?? '',
    publisher: payload.publisher ?? '',
    publicationYear: payload.publicationYear ?? null,
    isbn: payload.isbn ?? '',
    tags: payload.tags ?? [],
    sortOrder: payload.sortOrder ?? 0,
    categoryId: payload.categoryId ?? null,
    pdfFileUrl: payload.pdfFileUrl ?? '',
    pdfFileName: payload.pdfFileName ?? '',
    epubFileUrl: payload.epubFileUrl ?? '',
    epubFileName: payload.epubFileName ?? '',
    wordFileUrl: payload.wordFileUrl ?? '',
    wordFileName: payload.wordFileName ?? '',
  };

  if (payload.bookFileUrl !== undefined) {
    body.bookFileUrl = payload.bookFileUrl ?? '';
    body.bookFileName = payload.bookFileName ?? '';
  }

  const raw = await apiRequest<unknown>(`${BASE}/SaveTeacherBook`, {
    method: 'POST',
    credentials: 'include',
    body,
  });

  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const layer = obj.data ?? obj.Data ?? obj;
    if (typeof layer === 'number') return layer;
    if (layer && typeof layer === 'object') {
      const inner = layer as Record<string, unknown>;
      const id = inner.id ?? inner.Id ?? inner.data ?? inner.Data;
      if (typeof id === 'number') return id;
    }
  }
  return 0;
}

export async function deleteTeacherBook(bookId: number): Promise<void> {
  await apiRequest(`${BASE}/DeleteTeacherBook`, {
    method: 'DELETE',
    credentials: 'include',
    body: { bookId },
  });
}

export { MAX_COVER_BYTES, MAX_BOOK_FILE_BYTES };
