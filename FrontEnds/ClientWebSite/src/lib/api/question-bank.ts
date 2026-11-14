import { apiRequest, buildQuery } from './client';
import type { PagedData } from './types';
import { normalizePagedResponse } from './types';

const BASE = 'QuestionBank';

export type BankQuestionListItem = {
  id: number;
  questionType: number;
  prompt: string;
  category?: string | null;
  topic?: string | null;
  tags?: string | null;
  courseId?: number | null;
  courseTitle?: string | null;
  defaultPoints: number;
  effectiveDifficulty: number;
  manualDifficulty?: number | null;
  computedDifficulty: number;
  correctRate: number;
  totalGradedAnswers: number;
  correctAnswers: number;
  usageCount: number;
  ownerUserId: number;
  createdAt?: string | null;
};

export type BankQuestionOption = {
  id?: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type BankQuestionDetail = {
  id: number;
  questionType: number;
  prompt: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  defaultPoints: number;
  category?: string | null;
  topic?: string | null;
  tags?: string | null;
  courseId?: number | null;
  courseTitle?: string | null;
  effectiveDifficulty: number;
  manualDifficulty?: number | null;
  computedDifficulty: number;
  correctRate: number;
  totalGradedAnswers: number;
  correctAnswers: number;
  usageCount: number;
  ownerUserId: number;
  ownerTeacherId?: number | null;
  createdAt?: string | null;
  options: BankQuestionOption[];
};

export type BankQuestionAnalytics = {
  totalQuestions: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  unknownCount: number;
  multipleChoiceCount: number;
  trueFalseCount: number;
  shortAnswerCount: number;
  totalUsages: number;
  totalGradedAnswers: number;
  averageCorrectRate: number;
  topCategories: { category: string; count: number }[];
  hardestQuestions: {
    id: number;
    prompt: string;
    effectiveDifficulty: number;
    correctRate: number;
    totalGradedAnswers: number;
  }[];
  easiestQuestions: {
    id: number;
    prompt: string;
    effectiveDifficulty: number;
    correctRate: number;
    totalGradedAnswers: number;
  }[];
};

export type BankQuestionDetailAnalytics = {
  id: number;
  prompt: string;
  effectiveDifficulty: number;
  manualDifficulty?: number | null;
  computedDifficulty: number;
  correctRate: number;
  totalGradedAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  usageCount: number;
  linkedExamCount: number;
  recentExams: { examId: number; examTitle: string; createdAt?: string | null }[];
};

function unwrap<T>(raw: unknown): T {
  if (!raw || typeof raw !== 'object') return raw as T;
  const root = raw as Record<string, unknown>;
  return (root.data ?? root.Data ?? raw) as T;
}

export async function searchBankQuestions(params: {
  pageNumber?: number;
  pageSize?: number;
  inputValue?: string;
  questionType?: number;
  difficulty?: number;
  category?: string;
  topic?: string;
  courseId?: number;
  mineOnly?: boolean;
}): Promise<PagedData<BankQuestionListItem>> {
  const raw = await apiRequest<unknown>(`${BASE}/Search${buildQuery(params)}`, {
    method: 'GET',
    credentials: 'include',
  });
  return normalizePagedResponse<BankQuestionListItem>(raw);
}

export async function getBankQuestionById(id: number): Promise<BankQuestionDetail> {
  const raw = await apiRequest<unknown>(`${BASE}/GetById${buildQuery({ id })}`, {
    method: 'GET',
    credentials: 'include',
  });
  return unwrap<BankQuestionDetail>(raw);
}

export async function getBankQuestionAnalytics(): Promise<BankQuestionAnalytics> {
  const raw = await apiRequest<unknown>(`${BASE}/Analytics`, {
    method: 'GET',
    credentials: 'include',
  });
  return unwrap<BankQuestionAnalytics>(raw);
}

export async function getBankQuestionDetailAnalytics(id: number): Promise<BankQuestionDetailAnalytics> {
  const raw = await apiRequest<unknown>(`${BASE}/QuestionAnalytics${buildQuery({ id })}`, {
    method: 'GET',
    credentials: 'include',
  });
  return unwrap<BankQuestionDetailAnalytics>(raw);
}

export async function createBankQuestion(body: {
  questionType: number;
  prompt: string;
  codeSnippet?: string;
  codeLanguage?: string;
  defaultPoints: number;
  category?: string;
  topic?: string;
  tags?: string;
  courseId?: number;
  manualDifficulty?: number;
  options: BankQuestionOption[];
}): Promise<string> {
  const raw = await apiRequest<unknown>(`${BASE}/Create`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  const data = unwrap<Record<string, unknown> | string>(raw);
  if (typeof data === 'string') return data;
  return String((data as Record<string, unknown>)?.data ?? (data as Record<string, unknown>)?.Data ?? '');
}

export async function updateBankQuestion(body: {
  id: number;
  prompt: string;
  codeSnippet?: string;
  codeLanguage?: string;
  defaultPoints: number;
  category?: string;
  topic?: string;
  tags?: string;
  courseId?: number;
  manualDifficulty?: number;
  options: BankQuestionOption[];
}): Promise<void> {
  await apiRequest<unknown>(`${BASE}/Update`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
}

export async function deleteBankQuestion(id: number): Promise<void> {
  await apiRequest<unknown>(`${BASE}/Delete`, {
    method: 'POST',
    credentials: 'include',
    body: { id },
  });
}

export async function classifyBankQuestion(body: {
  id: number;
  category?: string;
  topic?: string;
  tags?: string;
  manualDifficulty?: number;
  clearManualDifficulty?: boolean;
}): Promise<void> {
  await apiRequest<unknown>(`${BASE}/Classify`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
}

export const DIFFICULTY_LABELS: Record<number, { fa: string; en: string; color: string }> = {
  0: { fa: 'نامشخص', en: 'Unknown', color: 'bg-slate-500' },
  1: { fa: 'آسان', en: 'Easy', color: 'bg-emerald-500' },
  2: { fa: 'متوسط', en: 'Medium', color: 'bg-amber-500' },
  3: { fa: 'سخت', en: 'Hard', color: 'bg-rose-500' },
};
