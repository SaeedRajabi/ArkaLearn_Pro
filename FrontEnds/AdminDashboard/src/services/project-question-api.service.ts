import apiClient from '@/lib/apiClient';
import { apiWriteUpdate } from '@/lib/api-write';
import { asLongId, isValidLongId } from '@/lib/id';

export type ProjectAnswerItem = {
  id: number;
  userId: number;
  contentHtml: string;
  audioUrl?: string | null;
  likeCount: number;
  authorName?: string | null;
  createdAt: string;
};

export type ProjectQuestionDetail = {
  id: number;
  projectId: number;
  projectTitle?: string | null;
  userId: number;
  subject?: string | null;
  contentHtml: string;
  audioUrl?: string | null;
  status: string;
  authorName?: string | null;
  authorEmail?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  answers: ProjectAnswerItem[];
};

export type SearchProjectQuestionItem = {
  id: number;
  projectId: number;
  projectTitle?: string | null;
  subject?: string | null;
  status: string;
  authorName?: string | null;
  answerCount: number;
  createdAt: string;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if ('data' in obj && obj.data != null) return unwrap<T>(obj.data);
  return obj as T;
}

function extractList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as { $values?: unknown[]; queryResult?: unknown; QueryResult?: unknown };
    if (Array.isArray(obj.$values)) return obj.$values;
    if (obj.queryResult) return extractList(obj.queryResult);
    if (obj.QueryResult) return extractList(obj.QueryResult);
  }
  return [];
}

function mapDetail(row: Record<string, unknown>): ProjectQuestionDetail {
  const answersRaw = row.answers ?? row.Answers;
  return {
    id: Number(row.id ?? row.Id ?? 0),
    projectId: Number(row.projectId ?? row.ProjectId ?? 0),
    projectTitle: (row.projectTitle ?? row.ProjectTitle ?? null) as string | null,
    userId: Number(row.userId ?? row.UserId ?? 0),
    subject: (row.subject ?? row.Subject ?? null) as string | null,
    contentHtml: String(row.contentHtml ?? row.ContentHtml ?? ''),
    audioUrl: (row.audioUrl ?? row.AudioUrl ?? null) as string | null,
    status: String(row.status ?? row.Status ?? ''),
    authorName: (row.authorName ?? row.AuthorName ?? null) as string | null,
    authorEmail: (row.authorEmail ?? row.AuthorEmail ?? null) as string | null,
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
    reviewedAt: (row.reviewedAt ?? row.ReviewedAt ?? null) as string | null,
    reviewedByName: (row.reviewedByName ?? row.ReviewedByName ?? null) as string | null,
    answers: extractList(answersRaw).map((a) => {
      const o = a as Record<string, unknown>;
      return {
        id: Number(o.id ?? o.Id ?? 0),
        userId: Number(o.userId ?? o.UserId ?? 0),
        contentHtml: String(o.contentHtml ?? o.ContentHtml ?? ''),
        audioUrl: (o.audioUrl ?? o.AudioUrl ?? null) as string | null,
        likeCount: Number(o.likeCount ?? o.LikeCount ?? 0),
        authorName: (o.authorName ?? o.AuthorName ?? null) as string | null,
        createdAt: String(o.createdAt ?? o.CreatedAt ?? ''),
      };
    }),
  };
}

export async function searchProjectQuestions(params: {
  inputValue?: string;
  status?: string;
  projectId?: number;
  submitterUserId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: SearchProjectQuestionItem[]; totalCount: number }> {
  const queryParams: Record<string, unknown> = {
    InputValue: params.inputValue ?? '',
    Status: params.status ?? '',
    PageNumber: params.pageNumber ?? 1,
    PageSize: params.pageSize ?? 50,
    NeedTotalCount: true,
  };
  if (params.projectId != null && params.projectId > 0) {
    queryParams.ProjectId = params.projectId;
  }
  if (params.submitterUserId && isValidLongId(params.submitterUserId)) {
    queryParams.SubmitterUserId = asLongId(params.submitterUserId);
  }

  const res = await apiClient.get<unknown>('/ProjectQuestion/Search', {
    params: queryParams,
  });
  const payload = unwrap<Record<string, unknown>>(res.data) ?? {};
  const list = extractList(payload);
  const items = list.map((x) => {
    const o = x as Record<string, unknown>;
    return {
      id: Number(o.id ?? o.Id ?? 0),
      projectId: Number(o.projectId ?? o.ProjectId ?? 0),
      projectTitle: (o.projectTitle ?? o.ProjectTitle ?? null) as string | null,
      subject: (o.subject ?? o.Subject ?? null) as string | null,
      status: String(o.status ?? o.Status ?? ''),
      authorName: (o.authorName ?? o.AuthorName ?? null) as string | null,
      answerCount: Number(o.answerCount ?? o.AnswerCount ?? 0),
      createdAt: String(o.createdAt ?? o.CreatedAt ?? ''),
    };
  });
  return {
    items,
    totalCount: Number(payload.totalCount ?? payload.TotalCount ?? items.length),
  };
}

export async function getProjectQuestionById(questionId: number): Promise<ProjectQuestionDetail | null> {
  const res = await apiClient.get<unknown>('/ProjectQuestion/GetById', { params: { questionId } });
  const payload = unwrap<Record<string, unknown>>(res.data);
  return payload ? mapDetail(payload) : null;
}

export async function reviewProjectQuestion(questionId: number, approve: boolean): Promise<void> {
  await apiWriteUpdate('/ProjectQuestion/Review', { questionId, approve });
}

export async function submitProjectAnswer(payload: {
  questionId: number;
  contentHtml: string;
  audioUrl?: string;
}): Promise<void> {
  await apiClient.post('/ProjectQuestion/SubmitAnswer', payload);
}

export async function uploadProjectQuestionImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<{ url?: string }>('/ProjectQuestion/UploadImage', form);
  return String(res.data?.url ?? '');
}

export async function uploadProjectQuestionAudio(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<{ url?: string }>('/ProjectQuestion/UploadAudio', form);
  return String(res.data?.url ?? '');
}
