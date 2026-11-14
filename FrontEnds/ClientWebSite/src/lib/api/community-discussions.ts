import { apiRequest } from './client';
import { API_BASE_URL } from './config';
import { normalizePagedResponse, type PagedData } from './types';

const BASE = 'CommunityDiscussion';

export type CommunityReplyItem = {
  id: number;
  userId: number;
  contentHtml: string;
  audioUrl?: string | null;
  likeCount: number;
  likedByCurrentUser: boolean;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
};

export type CommunityThreadSort = 'newest' | 'mostReplies' | 'mostLiked';

export type CommunityThreadListItem = {
  id: number;
  subject?: string | null;
  contentPreview?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  replyCount: number;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
};

export type CommunityThreadDetail = {
  id: number;
  userId: number;
  subject?: string | null;
  contentHtml: string;
  audioUrl?: string | null;
  slug?: string | null;
  replyCount: number;
  likeCount: number;
  dislikeCount: number;
  myReaction: number;
  isSubscribed: boolean;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
  replies: CommunityReplyItem[];
};

function mapReply(row: Record<string, unknown>): CommunityReplyItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    userId: Number(row.userId ?? row.UserId ?? 0),
    contentHtml: String(row.contentHtml ?? row.ContentHtml ?? ''),
    audioUrl: (row.audioUrl ?? row.AudioUrl ?? null) as string | null,
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    likedByCurrentUser: Boolean(row.likedByCurrentUser ?? row.LikedByCurrentUser),
    authorName: (row.authorName ?? row.AuthorName ?? null) as string | null,
    authorAvatarUrl: (row.authorAvatarUrl ?? row.AuthorAvatarUrl ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
  };
}

function mapListItem(row: Record<string, unknown>): CommunityThreadListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    subject: (row.subject ?? row.Subject ?? null) as string | null,
    contentPreview: (row.contentPreview ?? row.ContentPreview ?? null) as string | null,
    authorName: (row.authorName ?? row.AuthorName ?? null) as string | null,
    authorAvatarUrl: (row.authorAvatarUrl ?? row.AuthorAvatarUrl ?? null) as string | null,
    replyCount: Number(row.replyCount ?? row.ReplyCount ?? 0),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    dislikeCount: Number(row.dislikeCount ?? row.DislikeCount ?? 0),
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
  };
}

function mapThreadDetail(row: Record<string, unknown>): CommunityThreadDetail {
  const repliesRaw = row.replies ?? row.Replies;
  const replies = Array.isArray(repliesRaw)
    ? repliesRaw
    : repliesRaw && typeof repliesRaw === 'object' && '$values' in (repliesRaw as object)
      ? (repliesRaw as { $values: unknown[] }).$values
      : [];

  return {
    id: Number(row.id ?? row.Id ?? 0),
    userId: Number(row.userId ?? row.UserId ?? 0),
    subject: (row.subject ?? row.Subject ?? null) as string | null,
    contentHtml: String(row.contentHtml ?? row.ContentHtml ?? ''),
    audioUrl: (row.audioUrl ?? row.AudioUrl ?? null) as string | null,
    slug: (row.slug ?? row.Slug ?? null) as string | null,
    replyCount: Number(row.replyCount ?? row.ReplyCount ?? 0),
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    dislikeCount: Number(row.dislikeCount ?? row.DislikeCount ?? 0),
    myReaction: Number(row.myReaction ?? row.MyReaction ?? 0),
    isSubscribed: Boolean(row.isSubscribed ?? row.IsSubscribed),
    authorName: (row.authorName ?? row.AuthorName ?? null) as string | null,
    authorAvatarUrl: (row.authorAvatarUrl ?? row.AuthorAvatarUrl ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    replies: replies.map((r) => mapReply(r as Record<string, unknown>)),
  };
}

export async function searchCommunityThreads(params: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
  sortBy?: CommunityThreadSort;
}): Promise<PagedData<CommunityThreadListItem>> {
  const qs = new URLSearchParams();
  qs.set('PageNumber', String(params.pageNumber ?? 1));
  qs.set('PageSize', String(params.pageSize ?? 20));
  qs.set('NeedTotalCount', 'true');
  if (params.inputValue?.trim()) qs.set('InputValue', params.inputValue.trim());
  if (params.sortBy) qs.set('SortBy', params.sortBy);

  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/Search?${qs.toString()}`);
  const paged = normalizePagedResponse(raw as Parameters<typeof normalizePagedResponse>[0]);
  return {
    ...paged,
    queryResult: paged.queryResult.map((x) => mapListItem(x as Record<string, unknown>)),
  };
}

export async function getCommunityThreadById(threadId: number): Promise<CommunityThreadDetail | null> {
  try {
    const raw = await apiRequest<unknown>(`${BASE}/GetById?threadId=${threadId}`);
    if (!raw || typeof raw !== 'object') return null;
    return mapThreadDetail(raw as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function submitCommunityThread(payload: {
  subject?: string;
  contentHtml: string;
  audioUrl?: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>(`${BASE}/Submit`, { method: 'POST', body: payload });
  return String(raw ?? '');
}

export async function submitCommunityReply(payload: {
  threadId: number;
  contentHtml: string;
  audioUrl?: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>(`${BASE}/SubmitReply`, { method: 'POST', body: payload });
  return String(raw ?? '');
}

export async function likeCommunityReply(replyId: number): Promise<'liked' | 'unliked'> {
  const raw = await apiRequest<string>(`${BASE}/LikeReply`, {
    method: 'POST',
    body: { replyId },
  });
  const s = String(raw ?? '').toLowerCase();
  return s.includes('unliked') ? 'unliked' : 'liked';
}

export async function reactCommunityThread(
  threadId: number,
  reaction: -1 | 0 | 1
): Promise<{ likes: number; dislikes: number; myReaction: number }> {
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/React`, {
    method: 'POST',
    body: { threadId, reaction },
  });
  return {
    likes: Number(raw?.likes ?? raw?.Likes ?? 0),
    dislikes: Number(raw?.dislikes ?? raw?.Dislikes ?? 0),
    myReaction: Number(raw?.myReaction ?? raw?.MyReaction ?? 0),
  };
}

export async function subscribeCommunityThread(threadId: number): Promise<void> {
  await apiRequest(`${BASE}/Subscribe`, { method: 'POST', body: { threadId } });
}

export async function unsubscribeCommunityThread(threadId: number): Promise<void> {
  await apiRequest(`${BASE}/Unsubscribe`, { method: 'POST', body: { threadId } });
}

export async function uploadCommunityQaImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/UploadImage`;
  const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Image upload failed');
  const json = (await res.json()) as { url?: string };
  return String(json.url ?? '');
}

export async function uploadCommunityQaAudio(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/UploadAudio`;
  const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Audio upload failed');
  const json = (await res.json()) as { url?: string };
  return String(json.url ?? '');
}
