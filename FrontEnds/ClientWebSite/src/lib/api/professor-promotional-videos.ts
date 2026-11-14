import { apiRequest, buildQuery } from './client';
import { unwrapApiList } from '@/lib/api/normalize-list';

const BASE = 'Teacher';
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

export type PromotionalVideoApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';

export type TeacherPromotionalVideo = {
  id: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  approvalStatus: PromotionalVideoApprovalStatus;
  sortOrder: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLikedByViewer: boolean;
};

export type PromotionalVideoComment = {
  id: number;
  videoId: number;
  text: string;
  timeStamp: string;
  parentId?: number | null;
  author?: {
    id: number;
    fullName: string;
    userName?: string;
    avatarUrl?: string;
  } | null;
  replies: PromotionalVideoComment[];
};

function mapVideo(row: Record<string, unknown>): TeacherPromotionalVideo {
  const statusRaw = String(row.approvalStatus ?? row.ApprovalStatus ?? 'draft').toLowerCase();
  const approvalStatus = (
    ['approved', 'pending', 'rejected', 'draft'].includes(statusRaw) ? statusRaw : 'draft'
  ) as PromotionalVideoApprovalStatus;

  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    videoUrl: String(row.videoUrl ?? row.VideoUrl ?? ''),
    thumbnailUrl: String(row.thumbnailUrl ?? row.ThumbnailUrl ?? '') || undefined,
    approvalStatus,
    sortOrder: Number(row.sortOrder ?? row.SortOrder ?? 0),
    viewCount: Number(row.viewCount ?? row.ViewCount ?? 0),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    commentCount: Number(row.commentCount ?? row.CommentCount ?? 0),
    isLikedByViewer: Boolean(row.isLikedByViewer ?? row.IsLikedByViewer),
  };
}

function mapComment(row: Record<string, unknown>): PromotionalVideoComment {
  const author = (row.author ?? row.Author) as Record<string, unknown> | undefined;
  const replies = row.replies ?? row.Replies;

  return {
    id: Number(row.id ?? row.Id ?? 0),
    videoId: Number(row.videoId ?? row.VideoId ?? 0),
    text: String(row.text ?? row.Text ?? ''),
    timeStamp: String(row.timeStamp ?? row.TimeStamp ?? ''),
    parentId:
      row.parentId != null
        ? Number(row.parentId)
        : row.ParentId != null
          ? Number(row.ParentId)
          : null,
    author: author
      ? {
          id: Number(author.id ?? author.Id ?? 0),
          fullName: String(author.fullName ?? author.FullName ?? ''),
          userName:
            author.userName != null
              ? String(author.userName)
              : author.UserName != null
                ? String(author.UserName)
                : undefined,
          avatarUrl:
            author.avatarUrl != null
              ? String(author.avatarUrl)
              : author.AvatarUrl != null
                ? String(author.AvatarUrl)
                : undefined,
        }
      : null,
    replies: unwrapApiList<Record<string, unknown>>(replies).map(mapComment),
  };
}

function parseUploadUrl(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const record = raw as Record<string, unknown>;
  const layer = record.data ?? record.Data ?? record;
  if (layer && typeof layer === 'object') {
    const inner = layer as Record<string, unknown>;
    return String(inner.url ?? inner.Url ?? '');
  }
  return String(record.url ?? record.Url ?? '');
}

export async function getTeacherPromotionalVideos(params: {
  userId?: number;
  teacherId?: number;
  userName?: string;
}): Promise<TeacherPromotionalVideo[]> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetPromotionalVideos${buildQuery({
      userId: params.userId,
      teacherId: params.teacherId,
      userName: params.userName,
    })}`
  );
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapVideo)
    .filter((v) => v.id > 0);
}

export async function getMyPromotionalVideos(): Promise<TeacherPromotionalVideo[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetMyPromotionalVideos`);
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapVideo)
    .filter((v) => v.id > 0);
}

export async function uploadPromotionalVideoFile(file: File): Promise<string> {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error('Video must be 50 MB or smaller.');
  }

  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadPromotionalVideo`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const url = parseUploadUrl(raw);
  if (!url) throw new Error('Video upload did not return a URL.');
  return url;
}

export async function uploadPromotionalVideoThumbnail(file: File): Promise<string> {
  if (file.size > MAX_THUMBNAIL_BYTES) {
    throw new Error('Thumbnail must be 5 MB or smaller.');
  }

  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadPromotionalVideoThumbnail`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const url = parseUploadUrl(raw);
  if (!url) throw new Error('Thumbnail upload did not return a URL.');
  return url;
}

export async function savePromotionalVideo(payload: {
  videoId?: number;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  sortOrder?: number;
  durationSeconds?: number;
}): Promise<void> {
  await apiRequest(`${BASE}/SavePromotionalVideo`, {
    method: 'POST',
    body: {
      VideoId: payload.videoId ?? 0,
      Title: payload.title,
      VideoUrl: payload.videoUrl,
      ThumbnailUrl: payload.thumbnailUrl ?? '',
      SortOrder: payload.sortOrder ?? 0,
      DurationSeconds: payload.durationSeconds,
    },
  });
}

export async function deletePromotionalVideo(videoId: number): Promise<void> {
  await apiRequest(`${BASE}/DeletePromotionalVideo`, {
    method: 'DELETE',
    body: { VideoId: videoId },
  });
}

export async function recordPromotionalVideoView(videoId: number): Promise<void> {
  await apiRequest(`${BASE}/RecordPromotionalVideoView`, {
    method: 'POST',
    body: { videoId },
  });
}

export async function togglePromotionalVideoLike(videoId: number): Promise<{
  action: string;
  likeCount: number;
  isLiked: boolean;
}> {
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/TogglePromotionalVideoLike`, {
    method: 'POST',
    body: { videoId },
  });
  const layer = (raw.data ?? raw.Data ?? raw) as Record<string, unknown>;
  return {
    action: String(layer.action ?? layer.Action ?? ''),
    likeCount: Number(layer.likeCount ?? layer.LikeCount ?? 0),
    isLiked: Boolean(layer.isLiked ?? layer.IsLiked),
  };
}

export async function getPromotionalVideoComments(videoId: number): Promise<PromotionalVideoComment[]> {
  const raw = await apiRequest<unknown>(
    `${BASE}/GetPromotionalVideoComments${buildQuery({ videoId })}`
  );
  return unwrapApiList<Record<string, unknown>>(raw)
    .map(mapComment)
    .filter((c) => c.id > 0);
}

export async function addPromotionalVideoComment(payload: {
  videoId: number;
  content: string;
  parentId?: number;
}): Promise<void> {
  await apiRequest(`${BASE}/AddPromotionalVideoComment`, {
    method: 'POST',
    body: {
      videoId: payload.videoId,
      content: payload.content,
      ...(payload.parentId != null ? { parentId: payload.parentId } : {}),
    },
  });
}

export { MAX_VIDEO_BYTES, MAX_THUMBNAIL_BYTES };
