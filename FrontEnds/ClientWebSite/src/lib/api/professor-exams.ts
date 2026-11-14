import { apiRequest, buildQuery } from './client';
import type { PagedData, PagedResponseRaw } from './types';
import { normalizePagedResponse } from './types';

const BASE = 'Exam';

export type ProfessorExamListItem = {
  id: number;
  title: string;
  courseId: number;
  courseTitle: string;
  level: string;
  endsAtUtc: string;
  durationMinutes: number;
  status: number;
  totalPoints: number;
  assignedCount: number;
  submittedCount: number;
  gradedCount: number;
  createdAt: string;
};

export type ExamQuestionOption = {
  id?: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
};

export type ExamQuestion = {
  id?: number;
  orderIndex: number;
  questionType: number;
  prompt: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  points: number;
  options: ExamQuestionOption[];
};

export type ExamAttemptSummary = {
  attemptId: number;
  studentId: number;
  userId: number;
  studentName: string;
  status: number;
  startedAtUtc?: string | null;
  submittedAtUtc?: string | null;
  autoScore?: number | null;
  finalScore?: number | null;
};

export type ExamDetail = {
  id: number;
  title: string;
  description?: string | null;
  courseId: number;
  courseTitle: string;
  level: string;
  endsAtUtc: string;
  durationMinutes: number;
  status: number;
  totalPoints: number;
  questions: ExamQuestion[];
  attempts: ExamAttemptSummary[];
};

export type CourseStudentForExam = {
  studentId: number;
  userId: number;
  fullName: string;
  userName?: string | null;
  email?: string | null;
};

export type GradingQuestion = {
  questionId: number;
  orderIndex: number;
  questionType: number;
  prompt: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  points: number;
  options: ExamQuestionOption[];
  selectedOptionIdsJson?: string | null;
  textAnswer?: string | null;
  pointsAwarded?: number | null;
  isAutoGraded?: boolean | null;
  /** Paste events recorded for this answer; shown as a warning badge when > 0. */
  pasteCount?: number;
};

export type ExamAttemptGrading = {
  attemptId: number;
  examId: number;
  examTitle: string;
  studentName: string;
  status: number;
  totalPoints: number;
  autoScore?: number | null;
  finalScore?: number | null;
  professorFeedback?: string | null;
  startedAtUtc?: string | null;
  submittedAtUtc?: string | null;
  /** true = free copy/paste; false = pasted content is flagged. */
  allowPaste: boolean;
  questions: GradingQuestion[];
};

export type CreateExamPayload = {
  title: string;
  description?: string;
  courseId: number;
  level: string;
  endsAtUtc: string;
  durationMinutes: number;
  /** true = students may paste freely; false (default) = pasted content is flagged in grading. */
  allowPaste?: boolean;
  questions: {
    orderIndex: number;
    questionType: number;
    prompt: string;
    points: number;
    bankQuestionId?: number;
    codeSnippet?: string;
    codeLanguage?: string;
    options: { text: string; isCorrect: boolean; orderIndex: number }[];
  }[];
  studentIds: number[];
};

function mapListItem(row: Record<string, unknown>): ProfessorExamListItem {
  return {
    id: Number(row.id ?? row.Id ?? 0),
    title: String(row.title ?? row.Title ?? ''),
    courseId: Number(row.courseId ?? row.CourseId ?? 0),
    courseTitle: String(row.courseTitle ?? row.CourseTitle ?? ''),
    level: String(row.level ?? row.Level ?? ''),
    endsAtUtc: String(row.endsAtUtc ?? row.EndsAtUtc ?? ''),
    durationMinutes: Number(row.durationMinutes ?? row.DurationMinutes ?? 0),
    status: Number(row.status ?? row.Status ?? 0),
    totalPoints: Number(row.totalPoints ?? row.TotalPoints ?? 0),
    assignedCount: Number(row.assignedCount ?? row.AssignedCount ?? 0),
    submittedCount: Number(row.submittedCount ?? row.SubmittedCount ?? 0),
    gradedCount: Number(row.gradedCount ?? row.GradedCount ?? 0),
    createdAt: String(row.createdAt ?? row.CreatedAt ?? ''),
  };
}

export async function searchProfessorExams(params?: {
  courseId?: number;
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedData<ProfessorExamListItem>> {
  const { courseId, inputValue = '', pageNumber = 1, pageSize = 10 } = params ?? {};
  const path = `${BASE}/SearchTeacher${buildQuery({
    courseId: courseId || undefined,
    inputValue,
    pageNumber,
    pageSize,
    needTotalCount: true,
  })}`;
  const raw = await apiRequest<PagedResponseRaw<Record<string, unknown>>>(path);
  const data = normalizePagedResponse(raw);
  return {
    ...data,
    queryResult: data.queryResult.map(mapListItem),
  };
}

export async function getProfessorExamById(examId: number): Promise<ExamDetail> {
  const path = `${BASE}/GetById${buildQuery({ examId })}`;
  const raw = await apiRequest<Record<string, unknown>>(path);
  const questions = (raw.questions ?? raw.Questions ?? []) as Record<string, unknown>[];
  const attempts = (raw.attempts ?? raw.Attempts ?? []) as Record<string, unknown>[];
  return {
    id: Number(raw.id ?? raw.Id ?? examId),
    title: String(raw.title ?? raw.Title ?? ''),
    description: (raw.description ?? raw.Description) as string | null | undefined,
    courseId: Number(raw.courseId ?? raw.CourseId ?? 0),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    level: String(raw.level ?? raw.Level ?? ''),
    endsAtUtc: String(raw.endsAtUtc ?? raw.EndsAtUtc ?? ''),
    durationMinutes: Number(raw.durationMinutes ?? raw.DurationMinutes ?? 0),
    status: Number(raw.status ?? raw.Status ?? 0),
    totalPoints: Number(raw.totalPoints ?? raw.TotalPoints ?? 0),
    questions: questions.map((q, idx) => ({
      id: Number(q.id ?? q.Id ?? 0),
      orderIndex: Number(q.orderIndex ?? q.OrderIndex ?? idx),
      questionType: Number(q.questionType ?? q.QuestionType ?? 0),
      prompt: String(q.prompt ?? q.Prompt ?? ''),
      codeSnippet: (q.codeSnippet ?? q.CodeSnippet) as string | null | undefined,
      codeLanguage: (q.codeLanguage ?? q.CodeLanguage) as string | null | undefined,
      points: Number(q.points ?? q.Points ?? 0),
      options: ((q.options ?? q.Options ?? []) as Record<string, unknown>[]).map((o, oi) => ({
        id: Number(o.id ?? o.Id ?? 0),
        text: String(o.text ?? o.Text ?? ''),
        isCorrect: Boolean(o.isCorrect ?? o.IsCorrect),
        orderIndex: Number(o.orderIndex ?? o.OrderIndex ?? oi),
      })),
    })),
    attempts: attempts.map((a) => ({
      attemptId: Number(a.attemptId ?? a.AttemptId ?? 0),
      studentId: Number(a.studentId ?? a.StudentId ?? 0),
      userId: Number(a.userId ?? a.UserId ?? 0),
      studentName: String(a.studentName ?? a.StudentName ?? ''),
      status: Number(a.status ?? a.Status ?? 0),
      startedAtUtc: (a.startedAtUtc ?? a.StartedAtUtc) as string | null | undefined,
      submittedAtUtc: (a.submittedAtUtc ?? a.SubmittedAtUtc) as string | null | undefined,
      autoScore: (a.autoScore ?? a.AutoScore) as number | null | undefined,
      finalScore: (a.finalScore ?? a.FinalScore) as number | null | undefined,
    })),
  };
}

export async function getCourseStudentsForExam(courseId: number): Promise<CourseStudentForExam[]> {
  const path = `${BASE}/GetCourseStudents${buildQuery({ courseId })}`;
  const raw = await apiRequest<Record<string, unknown>[]>(path);
  return (raw ?? []).map((s) => ({
    studentId: Number(s.studentId ?? s.StudentId ?? 0),
    userId: Number(s.userId ?? s.UserId ?? 0),
    fullName: String(s.fullName ?? s.FullName ?? ''),
    userName: (s.userName ?? s.UserName) as string | null | undefined,
    email: (s.email ?? s.Email) as string | null | undefined,
  }));
}

export async function createProfessorExam(payload: CreateExamPayload): Promise<string> {
  const result = await apiRequest<string | { result?: string }>(`${BASE}/Create`, {
    method: 'POST',
    body: payload,
  });
  if (typeof result === 'string') return result;
  return result?.result ?? 'OK';
}

export async function getExamAttemptForGrading(attemptId: number): Promise<ExamAttemptGrading> {
  const path = `${BASE}/GetAttemptForGrading${buildQuery({ attemptId })}`;
  const raw = await apiRequest<Record<string, unknown>>(path);
  const questions = (raw.questions ?? raw.Questions ?? []) as Record<string, unknown>[];
  return {
    attemptId: Number(raw.attemptId ?? raw.AttemptId ?? attemptId),
    examId: Number(raw.examId ?? raw.ExamId ?? 0),
    examTitle: String(raw.examTitle ?? raw.ExamTitle ?? ''),
    studentName: String(raw.studentName ?? raw.StudentName ?? ''),
    status: Number(raw.status ?? raw.Status ?? 0),
    totalPoints: Number(raw.totalPoints ?? raw.TotalPoints ?? 0),
    autoScore: (raw.autoScore ?? raw.AutoScore) as number | null | undefined,
    finalScore: (raw.finalScore ?? raw.FinalScore) as number | null | undefined,
    professorFeedback: (raw.professorFeedback ?? raw.ProfessorFeedback) as string | null | undefined,
    startedAtUtc: (raw.startedAtUtc ?? raw.StartedAtUtc) as string | null | undefined,
    submittedAtUtc: (raw.submittedAtUtc ?? raw.SubmittedAtUtc) as string | null | undefined,
    allowPaste: Boolean(raw.allowPaste ?? raw.AllowPaste),
    questions: questions.map((q, idx) => ({
      questionId: Number(q.questionId ?? q.QuestionId ?? 0),
      orderIndex: Number(q.orderIndex ?? q.OrderIndex ?? idx),
      questionType: Number(q.questionType ?? q.QuestionType ?? 0),
      prompt: String(q.prompt ?? q.Prompt ?? ''),
      codeSnippet: (q.codeSnippet ?? q.CodeSnippet) as string | null | undefined,
      codeLanguage: (q.codeLanguage ?? q.CodeLanguage) as string | null | undefined,
      points: Number(q.points ?? q.Points ?? 0),
      options: ((q.options ?? q.Options ?? []) as Record<string, unknown>[]).map((o, oi) => ({
        id: Number(o.id ?? o.Id ?? 0),
        text: String(o.text ?? o.Text ?? ''),
        isCorrect: Boolean(o.isCorrect ?? o.IsCorrect),
        orderIndex: Number(o.orderIndex ?? o.OrderIndex ?? oi),
      })),
      selectedOptionIdsJson: (q.selectedOptionIdsJson ?? q.SelectedOptionIdsJson) as string | null | undefined,
      textAnswer: (q.textAnswer ?? q.TextAnswer) as string | null | undefined,
      pointsAwarded: (q.pointsAwarded ?? q.PointsAwarded) as number | null | undefined,
      isAutoGraded: (q.isAutoGraded ?? q.IsAutoGraded) as boolean | null | undefined,
      pasteCount: Number(q.pasteCount ?? q.PasteCount ?? 0),
    })),
  };
}

export async function gradeExamAttempt(payload: {
  attemptId: number;
  finalScore: number;
  professorFeedback?: string;
  questionGrades: { questionId: number; pointsAwarded: number }[];
}): Promise<string> {
  const result = await apiRequest<string | { result?: string }>(`${BASE}/GradeAttempt`, {
    method: 'POST',
    body: payload,
  });
  if (typeof result === 'string') return result;
  return result?.result ?? 'OK';
}
