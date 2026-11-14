import { apiRequest } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';
import type { SoftwareDetail } from '@/lib/api/software';

const BASE = 'Software';
export const MAX_SOFTWARE_COVER_BYTES = 5 * 1024 * 1024;
export const MAX_INSTALLER_BYTES = 200 * 1024 * 1024;

export type SoftwareApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';

export type TeacherSoftware = SoftwareDetail & {
  approvalStatus: SoftwareApprovalStatus;
  sortOrder: number;
};

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.$values)) return obj.$values.map(String).filter(Boolean);
  }
  return [];
}

function mapSoftware(row: Record<string, unknown>): TeacherSoftware {
  const statusRaw = String(row.approvalStatus ?? row.ApprovalStatus ?? 'draft').toLowerCase();
  const approvalStatus = (
    ['approved', 'pending', 'rejected', 'draft'].includes(statusRaw) ? statusRaw : 'draft'
  ) as SoftwareApprovalStatus;

  return {
    id: Number(row.id ?? row.Id ?? 0),
    teacherId:
      row.teacherId != null
        ? Number(row.teacherId)
        : row.TeacherId != null
          ? Number(row.TeacherId)
          : undefined,
    title: String(row.title ?? row.Title ?? ''),
    shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
    longDescriptionHtml: String(row.longDescriptionHtml ?? row.LongDescriptionHtml ?? ''),
    coverImageUrl: String(row.coverImageUrl ?? row.CoverImageUrl ?? '') || undefined,
    installerFileUrl: String(row.installerFileUrl ?? row.InstallerFileUrl ?? '') || undefined,
    installerFileName: String(row.installerFileName ?? row.InstallerFileName ?? '') || undefined,
    categoryId:
      row.categoryId != null
        ? Number(row.categoryId)
        : row.CategoryId != null
          ? Number(row.CategoryId)
          : undefined,
    categoryName: String(row.categoryName ?? row.CategoryName ?? '') || undefined,
    categoryPath: parseTags(row.categoryPath ?? row.CategoryPath),
    slug: String(row.slug ?? row.Slug ?? ''),
    tags: parseTags(row.tags ?? row.Tags),
    downloadCount: Number(row.downloadCount ?? row.DownloadCount ?? 0),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    isLikedByViewer: Boolean(row.isLikedByViewer ?? row.IsLikedByViewer),
    isPlatformOwned: Boolean(row.isPlatformOwned ?? row.IsPlatformOwned),
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

export async function getMySoftware(): Promise<TeacherSoftware[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMySoftware`, { credentials: 'include' });
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapSoftware)
    .filter((s) => s.id > 0);
}

export async function uploadSoftwareCover(file: File): Promise<string> {
  if (file.size > MAX_SOFTWARE_COVER_BYTES) throw new Error('Cover image must be 5 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadCover`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const { url } = parseUploadUrl(raw);
  if (!url) throw new Error('Cover upload did not return a URL.');
  return url;
}

export async function uploadSoftwareInstaller(file: File): Promise<{ url: string; fileName: string }> {
  if (file.size > MAX_INSTALLER_BYTES) throw new Error('Installer must be 200 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadInstaller`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const { url, fileName } = parseUploadUrl(raw);
  if (!url) throw new Error('Installer upload did not return a URL.');
  return { url, fileName: fileName ?? file.name };
}

export async function saveTeacherSoftware(payload: {
  softwareId?: number;
  title: string;
  shortDescription: string;
  longDescriptionHtml: string;
  coverImageUrl?: string;
  installerFileUrl?: string;
  installerFileName?: string;
  categoryId?: number | null;
  tags?: string[];
  sortOrder?: number;
}): Promise<number> {
  const raw = await apiRequest<unknown>(`${BASE}/SaveTeacherSoftware`, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      softwareId: payload.softwareId ?? 0,
      title: payload.title,
      shortDescription: payload.shortDescription,
      longDescriptionHtml: payload.longDescriptionHtml,
      coverImageUrl: payload.coverImageUrl ?? '',
      installerFileUrl: payload.installerFileUrl ?? '',
      installerFileName: payload.installerFileName ?? '',
      categoryId: payload.categoryId ?? null,
      tags: payload.tags ?? [],
      sortOrder: payload.sortOrder ?? 0,
    }),
  });
  if (!raw || typeof raw !== 'object') return 0;
  const obj = raw as Record<string, unknown>;
  const layer = obj.data ?? obj.Data ?? obj;
  return Number(
    typeof layer === 'object' && layer != null
      ? (layer as Record<string, unknown>).data ?? (layer as Record<string, unknown>).Data ?? layer
      : layer
  );
}

export async function deleteTeacherSoftware(softwareId: number): Promise<void> {
  await apiRequest(`${BASE}/Delete`, {
    method: 'DELETE',
    credentials: 'include',
    body: JSON.stringify({ softwareId }),
  });
}
