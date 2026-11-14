import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';

const BASE = '/Teacher';
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_BOOK_FILE_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export type ArkaContentApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';

export type ArkaBookItem = {
  id: number;
  teacherId?: number;
  title: string;
  shortDescription: string;
  longDescriptionHtml: string;
  coverImageUrl?: string;
  pdfFileUrl?: string;
  pdfFileName?: string;
  epubFileUrl?: string;
  epubFileName?: string;
  wordFileUrl?: string;
  wordFileName?: string;
  bookFileUrl?: string;
  bookFileName?: string;
  categoryId?: number;
  categoryName?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  slug: string;
  tags: string[];
  approvalStatus: ArkaContentApprovalStatus;
  sortOrder: number;
  teacherUserId?: number;
  teacherDisplayName?: string;
};

export type ArkaPromotionalVideoItem = {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  approvalStatus: ArkaContentApprovalStatus;
  sortOrder: number;
  viewCount: number;
  teacherUserId?: number;
  teacherDisplayName?: string;
};

function extractList(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.$values)) return obj.$values;
  const nested = obj.data ?? obj.Data ?? obj.queryResult ?? obj.QueryResult;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === 'object' && Array.isArray((nested as { $values?: unknown[] }).$values)) {
    return (nested as { $values: unknown[] }).$values;
  }
  return [];
}

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const nested = obj.data ?? obj.Data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) return nested as Record<string, unknown>;
  return obj;
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw && typeof raw === 'object' && Array.isArray((raw as { $values?: unknown[] }).$values)) {
    return (raw as { $values: unknown[] }).$values.map(String).filter(Boolean);
  }
  return [];
}

function parseApprovalStatus(raw: unknown): ArkaContentApprovalStatus {
  const statusRaw = String(raw ?? 'draft').toLowerCase();
  if (['approved', 'pending', 'rejected', 'draft'].includes(statusRaw)) {
    return statusRaw as ArkaContentApprovalStatus;
  }
  return 'draft';
}

function mapBook(row: Record<string, unknown>): ArkaBookItem {
  const teacherIdRaw = row.teacherId ?? row.TeacherId;
  const teacherUserIdRaw = row.teacherUserId ?? row.TeacherUserId;
  return {
    id: Number(row.id ?? row.Id ?? 0),
    teacherId: teacherIdRaw != null && Number(teacherIdRaw) > 0 ? Number(teacherIdRaw) : undefined,
    title: String(row.title ?? row.Title ?? ''),
    shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
    longDescriptionHtml: String(row.longDescriptionHtml ?? row.LongDescriptionHtml ?? ''),
    coverImageUrl: String(row.coverImageUrl ?? row.CoverImageUrl ?? '') || undefined,
    pdfFileUrl: String(row.pdfFileUrl ?? row.PdfFileUrl ?? '') || undefined,
    pdfFileName: String(row.pdfFileName ?? row.PdfFileName ?? '') || undefined,
    epubFileUrl: String(row.epubFileUrl ?? row.EpubFileUrl ?? '') || undefined,
    epubFileName: String(row.epubFileName ?? row.EpubFileName ?? '') || undefined,
    wordFileUrl: String(row.wordFileUrl ?? row.WordFileUrl ?? '') || undefined,
    wordFileName: String(row.wordFileName ?? row.WordFileName ?? '') || undefined,
    bookFileUrl: String(row.bookFileUrl ?? row.BookFileUrl ?? '') || undefined,
    bookFileName: String(row.bookFileName ?? row.BookFileName ?? '') || undefined,
    categoryId:
      row.categoryId != null ? Number(row.categoryId) : row.CategoryId != null ? Number(row.CategoryId) : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
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
    approvalStatus: parseApprovalStatus(row.approvalStatus ?? row.ApprovalStatus),
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    teacherUserId:
      teacherUserIdRaw != null && Number(teacherUserIdRaw) > 0 ? Number(teacherUserIdRaw) : undefined,
    teacherDisplayName: String(row.teacherDisplayName ?? row.TeacherDisplayName ?? '') || undefined,
  };
}

function mapVideo(row: Record<string, unknown>): ArkaPromotionalVideoItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    videoUrl: String(row.videoUrl ?? row.VideoUrl ?? ''),
    thumbnailUrl: String(row.thumbnailUrl ?? row.ThumbnailUrl ?? '') || undefined,
    approvalStatus: parseApprovalStatus(row.approvalStatus ?? row.ApprovalStatus),
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    viewCount: Number(row.viewCount ?? row.ViewCount ?? 0),
    teacherUserId:
      row.teacherUserId != null
        ? Number(row.teacherUserId)
        : row.TeacherUserId != null
          ? Number(row.TeacherUserId)
          : undefined,
    teacherDisplayName: String(row.teacherDisplayName ?? row.TeacherDisplayName ?? '') || undefined,
  };
}

export async function getMyArkaBooks(): Promise<ArkaBookItem[]> {
  const response = await apiClient.get<unknown>(`${BASE}/GetMyBooks`, { params: { forEdit: true } });
  return extractList(response.data)
    .map((row) => mapBook(row as Record<string, unknown>))
    .filter((b) => b.id > 0);
}

export async function getTeacherContentBooks(teacherUserId: string): Promise<ArkaBookItem[]> {
  const response = await apiClient.get<unknown>(`${BASE}/GetTeacherBooks`, {
    params: { userId: teacherUserId, forEdit: true },
  });
  return extractList(response.data)
    .map((row) => mapBook(row as Record<string, unknown>))
    .filter((b) => b.id > 0);
}

export async function getMyArkaPromotionalVideos(): Promise<ArkaPromotionalVideoItem[]> {
  const response = await apiClient.get<unknown>(`${BASE}/GetMyPromotionalVideos`);
  return extractList(response.data)
    .map((row) => mapVideo(row as Record<string, unknown>))
    .filter((v) => v.id > 0);
}

export async function getTeacherContentVideos(teacherUserId: string): Promise<ArkaPromotionalVideoItem[]> {
  const response = await apiClient.get<unknown>(`${BASE}/GetPromotionalVideos`, {
    params: { userId: teacherUserId, forEdit: true },
  });
  return extractList(response.data)
    .map((row) => mapVideo(row as Record<string, unknown>))
    .filter((v) => v.id > 0);
}

export async function saveArkaBook(
  payload: {
  bookId?: number;
  title: string;
  shortDescription: string;
  longDescriptionHtml: string;
  coverImageUrl?: string;
  publisher?: string;
  publicationYear?: number;
  isbn?: string;
  tags?: string[];
  sortOrder?: number;
  categoryId?: number | null;
  pdfFileUrl?: string;
  pdfFileName?: string;
  epubFileUrl?: string;
  epubFileName?: string;
  wordFileUrl?: string;
  wordFileName?: string;
},
  options?: { teacherUserId?: string; teacherId?: number }
): Promise<number> {
  const body: Record<string, unknown> = {
    bookId: payload.bookId ?? 0,
    teacherUserId: options?.teacherUserId ? Number(options.teacherUserId) : null,
    teacherId: options?.teacherId && options.teacherId > 0 ? options.teacherId : null,
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
  const response = await apiWriteUpdate<number>(`${BASE}/SaveTeacherBook`, body);
  const raw = response.data;
  if (typeof raw === 'number') return raw;
  const layer = unwrapPayload(raw);
  const id = layer?.id ?? layer?.Id ?? layer?.data ?? layer?.Data;
  return typeof id === 'number' ? id : Number(id ?? 0);
}

export async function deleteArkaBook(bookId: number, options?: { teacherUserId?: string }): Promise<void> {
  await apiClient.delete(`${BASE}/DeleteTeacherBook`, {
    data: {
      bookId,
      teacherUserId: options?.teacherUserId ? Number(options.teacherUserId) : null,
    },
  });
}

export async function uploadArkaBookCover(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (file.size > MAX_COVER_BYTES) throw new Error('Cover image must be 5 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post(`${BASE}/UploadBookCover`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total ?? 0;
      if (total <= 0) {
        onProgress(0);
        return;
      }
      onProgress(Math.min(100, Math.max(0, Math.round((event.loaded / total) * 100))));
    },
  });
  const payload = unwrapPayload(response.data);
  const url = String(payload?.url ?? payload?.Url ?? '');
  if (!url) throw new Error('Cover upload failed.');
  onProgress?.(100);
  return url;
}

export async function uploadArkaBookFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; fileName: string }> {
  if (file.size > MAX_BOOK_FILE_BYTES) throw new Error('Book file must be 50 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post(`${BASE}/UploadBookFile`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const total = event.total ?? 0;
      if (total <= 0) {
        onProgress(0);
        return;
      }
      onProgress(Math.min(100, Math.max(0, Math.round((event.loaded / total) * 100))));
    },
  });
  const payload = unwrapPayload(response.data);
  const url = String(payload?.url ?? payload?.Url ?? '');
  const fileName = String(payload?.fileName ?? payload?.FileName ?? file.name);
  if (!url) throw new Error('Book file upload failed.');
  onProgress?.(100);
  return { url, fileName };
}

export async function saveArkaPromotionalVideo(
  payload: {
  videoId?: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  sortOrder?: number;
  durationSeconds?: number;
},
  options?: { teacherUserId?: string }
): Promise<void> {
  await apiWriteUpdate(`${BASE}/SavePromotionalVideo`, {
    videoId: payload.videoId ?? 0,
    teacherUserId: options?.teacherUserId ? Number(options.teacherUserId) : null,
    title: payload.title,
    videoUrl: payload.videoUrl,
    thumbnailUrl: payload.thumbnailUrl ?? '',
    sortOrder: payload.sortOrder ?? 0,
    durationSeconds: payload.durationSeconds,
  });
}

export async function deleteArkaPromotionalVideo(videoId: number, options?: { teacherUserId?: string }): Promise<void> {
  await apiClient.delete(`${BASE}/DeletePromotionalVideo`, {
    data: {
      videoId,
      teacherUserId: options?.teacherUserId ? Number(options.teacherUserId) : null,
    },
  });
}

export async function uploadArkaPromotionalVideo(file: File): Promise<string> {
  if (file.size > MAX_VIDEO_BYTES) throw new Error('Video must be 50 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post(`${BASE}/UploadPromotionalVideo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapPayload(response.data);
  const url = String(payload?.url ?? payload?.Url ?? '');
  if (!url) throw new Error('Video upload failed.');
  return url;
}

export async function uploadArkaPromotionalVideoThumbnail(file: File): Promise<string> {
  if (file.size > MAX_THUMBNAIL_BYTES) throw new Error('Thumbnail must be 5 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const response = await apiClient.post(`${BASE}/UploadPromotionalVideoThumbnail`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const payload = unwrapPayload(response.data);
  const url = String(payload?.url ?? payload?.Url ?? '');
  if (!url) throw new Error('Thumbnail upload failed.');
  return url;
}

export const CLIENT_SITE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CLIENT_SITE_URL) || 'https://arkasoftware.ir';
