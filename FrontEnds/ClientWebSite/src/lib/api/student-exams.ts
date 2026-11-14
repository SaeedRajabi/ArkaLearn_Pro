import { apiRequest, buildQuery } from './client';

const BASE = 'Exam';

export type AssignedExam = {
  examId: number;
  attemptId?: number | null;
  title: string;
  courseTitle: string;
  level: string;
  endsAtUtc: string;
  durationMinutes: number;
  totalPoints: number;
  attemptStatus: number;
  finalScore?: number | null;
  expiresAtUtc?: string | null;
};

export type ExamTakingQuestion = {
  id: number;
  orderIndex: number;
  questionType: number;
  prompt: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  points: number;
  options: { id: number; text: string; orderIndex: number }[];
};

export type ExamTakingAnswer = {
  questionId: number;
  selectedOptionIdsJson?: string | null;
  textAnswer?: string | null;
  pasteCount?: number;
  pointsAwarded?: number | null;
};

export type ExamTaking = {
  examId: number;
  attemptId: number;
  title: string;
  courseTitle: string;
  durationMinutes: number;
  endsAtUtc: string;
  expiresAtUtc?: string | null;
  attemptStatus: number;
  totalPoints: number;
  finalScore?: number | null;
  professorFeedback?: string | null;
  /** true = free copy/paste; false = pasted content is tracked and flagged to the teacher. */
  allowPaste: boolean;
  questions: ExamTakingQuestion[];
  answers: ExamTakingAnswer[];
};

export type ExamAnswerPayload = {
  questionId: number;
  selectedOptionIdsJson?: string | null;
  textAnswer?: string | null;
  pasteCount?: number;
};

export async function getMyAssignedExams(): Promise<AssignedExam[]> {
  const path = `${BASE}/GetMyAssigned`;
  const raw = await apiRequest<Record<string, unknown>[]>(path);
  return (raw ?? []).map((row) => ({
    examId: Number(row.examId ?? row.ExamId ?? 0),
    attemptId: (row.attemptId ?? row.AttemptId) as number | null | undefined,
    title: String(row.title ?? row.Title ?? ''),
    courseTitle: String(row.courseTitle ?? row.CourseTitle ?? ''),
    level: String(row.level ?? row.Level ?? ''),
    endsAtUtc: String(row.endsAtUtc ?? row.EndsAtUtc ?? ''),
    durationMinutes: Number(row.durationMinutes ?? row.DurationMinutes ?? 0),
    totalPoints: Number(row.totalPoints ?? row.TotalPoints ?? 0),
    attemptStatus: Number(row.attemptStatus ?? row.AttemptStatus ?? 0),
    finalScore: (row.finalScore ?? row.FinalScore) as number | null | undefined,
    expiresAtUtc: (row.expiresAtUtc ?? row.ExpiresAtUtc) as string | null | undefined,
  }));
}

export async function getExamForTaking(examId: number): Promise<ExamTaking> {
  const path = `${BASE}/GetForTaking${buildQuery({ examId })}`;
  const raw = await apiRequest<Record<string, unknown>>(path);
  const questions = (raw.questions ?? raw.Questions ?? []) as Record<string, unknown>[];
  const answers = (raw.answers ?? raw.Answers ?? []) as Record<string, unknown>[];
  return {
    examId: Number(raw.examId ?? raw.ExamId ?? examId),
    attemptId: Number(raw.attemptId ?? raw.AttemptId ?? 0),
    title: String(raw.title ?? raw.Title ?? ''),
    courseTitle: String(raw.courseTitle ?? raw.CourseTitle ?? ''),
    durationMinutes: Number(raw.durationMinutes ?? raw.DurationMinutes ?? 0),
    endsAtUtc: String(raw.endsAtUtc ?? raw.EndsAtUtc ?? ''),
    expiresAtUtc: (raw.expiresAtUtc ?? raw.ExpiresAtUtc) as string | null | undefined,
    attemptStatus: Number(raw.attemptStatus ?? raw.AttemptStatus ?? 0),
    totalPoints: Number(raw.totalPoints ?? raw.TotalPoints ?? 0),
    finalScore: (raw.finalScore ?? raw.FinalScore) as number | null | undefined,
    professorFeedback: (raw.professorFeedback ?? raw.ProfessorFeedback) as string | null | undefined,
    allowPaste: Boolean(raw.allowPaste ?? raw.AllowPaste),
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
        orderIndex: Number(o.orderIndex ?? o.OrderIndex ?? oi),
      })),
    })),
    answers: answers.map((a) => ({
      questionId: Number(a.questionId ?? a.QuestionId ?? 0),
      selectedOptionIdsJson: (a.selectedOptionIdsJson ?? a.SelectedOptionIdsJson) as string | null | undefined,
      textAnswer: (a.textAnswer ?? a.TextAnswer) as string | null | undefined,
      pasteCount: Number(a.pasteCount ?? a.PasteCount ?? 0),
      pointsAwarded: (a.pointsAwarded ?? a.PointsAwarded) as number | null | undefined,
    })),
  };
}

export async function startExamAttempt(examId: number): Promise<{ attemptId: number; expiresAtUtc: string }> {
  const raw = await apiRequest<Record<string, unknown>>(`${BASE}/StartAttempt`, {
    method: 'POST',
    body: { examId },
  });
  return {
    attemptId: Number(raw.attemptId ?? raw.AttemptId ?? 0),
    expiresAtUtc: String(raw.expiresAtUtc ?? raw.ExpiresAtUtc ?? ''),
  };
}

export async function saveExamAnswers(attemptId: number, answers: ExamAnswerPayload[]): Promise<void> {
  await apiRequest(`${BASE}/SaveAnswers`, {
    method: 'POST',
    body: { attemptId, answers },
  });
}

export async function submitExamAttempt(attemptId: number, answers: ExamAnswerPayload[]): Promise<void> {
  await apiRequest(`${BASE}/SubmitAttempt`, {
    method: 'POST',
    body: { attemptId, answers },
  });
}

export async function abandonExamAttempt(attemptId: number): Promise<void> {
  await apiRequest(`${BASE}/AbandonAttempt`, {
    method: 'POST',
    body: { attemptId },
  });
}
