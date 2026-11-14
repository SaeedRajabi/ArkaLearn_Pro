import { apiRequest } from './client';
import { API_BASE_URL } from './config';

const BASE = 'ProjectQuestion';

export type ProjectAnswerItem = {
  id: number;
  userId: number;
  contentHtml: string;
  audioUrl?: string | null;
  likeCount: number;
  likedByCurrentUser: boolean;
  isBestAnswer: boolean;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
};

export type ProjectQuestionItem = {
  id: number;
  projectId: number;
  userId: number;
  subject?: string | null;
  contentHtml: string;
  audioUrl?: string | null;
  status: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  createdAt: string;
  answers: ProjectAnswerItem[];
};

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as { $values?: unknown[]; data?: unknown };
    if (Array.isArray(obj.$values)) return obj.$values;
    if (obj.data) return extractList(obj.data);
  }
  return [];
}

function mapAnswer(row: Record<string, unknown>): ProjectAnswerItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    userId: Number(row.userId ?? row.UserId ?? 0),
    contentHtml: String(row.contentHtml ?? row.ContentHtml ?? ''),
    audioUrl: (row.audioUrl ?? row.AudioUrl ?? null) as string | null,
    likeCount: Number(row.likeCount ?? row.LikeCount ?? 0),
    likedByCurrentUser: Boolean(row.likedByCurrentUser ?? row.LikedByCurrentUser),
    isBestAnswer: Boolean(row.isBestAnswer ?? row.IsBestAnswer),
    authorName: (row.authorName ?? row.AuthorName ?? null) as string | null,
    authorAvatarUrl: (row.authorAvatarUrl ?? row.AuthorAvatarUrl ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
  };
}

function mapQuestion(row: Record<string, unknown>): ProjectQuestionItem {
  const answersRaw = row.answers ?? row.Answers;
  const answers = extractList(answersRaw).map((a) => mapAnswer(a as Record<string, unknown>));
  return {
    id: Number(row.id ?? row.Id ?? 0),
    projectId: Number(row.projectId ?? row.ProjectId ?? 0),
    userId: Number(row.userId ?? row.UserId ?? 0),
    subject: (row.subject ?? row.Subject ?? null) as string | null,
    contentHtml: String(row.contentHtml ?? row.ContentHtml ?? ''),
    audioUrl: (row.audioUrl ?? row.AudioUrl ?? null) as string | null,
    status: String(row.status ?? row.Status ?? ''),
    authorName: (row.authorName ?? row.AuthorName ?? null) as string | null,
    authorAvatarUrl: (row.authorAvatarUrl ?? row.AuthorAvatarUrl ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    answers,
  };
}

export async function getProjectQuestions(projectId: number): Promise<ProjectQuestionItem[]> {
  const raw = await apiRequest<unknown>(`${BASE}/GetByProjectId?projectId=${projectId}`);
  return extractList(raw).map((x) => mapQuestion(x as Record<string, unknown>));
}

export async function submitProjectQuestion(payload: {
  projectId: number;
  subject?: string;
  contentHtml: string;
  audioUrl?: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>(`${BASE}/Submit`, { method: 'POST', body: payload });
  return String(raw ?? '');
}

export async function submitProjectAnswer(payload: {
  questionId: number;
  contentHtml: string;
  audioUrl?: string;
}): Promise<string> {
  const raw = await apiRequest<unknown>(`${BASE}/SubmitAnswer`, { method: 'POST', body: payload });
  return String(raw ?? '');
}

export async function likeProjectAnswer(answerId: number): Promise<'liked' | 'unliked'> {
  const raw = await apiRequest<string>(`${BASE}/LikeAnswer`, {
    method: 'POST',
    body: { answerId },
  });
  const s = String(raw ?? '').toLowerCase();
  return s.includes('unliked') ? 'unliked' : 'liked';
}

export async function uploadProjectQuestionImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/UploadImage`;
  const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Image upload failed');
  const json = (await res.json()) as { url?: string };
  return String(json.url ?? '');
}

export async function uploadProjectQuestionAudio(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${BASE}/UploadAudio`;
  const res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Audio upload failed');
  const json = (await res.json()) as { url?: string };
  return String(json.url ?? '');
}
