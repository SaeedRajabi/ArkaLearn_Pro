'use client';

import * as React from 'react';
import { ChevronDown, Plus, Trash2, Loader2, Code2, Library, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { IconSelectPicker } from '@/components/shared/icon-select-picker';
import { FlatpickrDateTimePicker } from '@/components/shared/flatpickr-datetime-picker';
import { EXAM_CODE_LANGUAGES } from '@/components/shared/exam-question-code-block';
import { searchProfessorCourses } from '@/lib/api/professor-courses';
import {
  createProfessorExam,
  getCourseStudentsForExam,
  type CourseStudentForExam,
} from '@/lib/api/professor-exams';
import {
  DIFFICULTY_LABELS,
  getBankQuestionById,
  searchBankQuestions,
  type BankQuestionListItem,
} from '@/lib/api/question-bank';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type QuestionDraft = {
  id: string;
  orderIndex: number;
  questionType: number;
  prompt: string;
  points: number;
  codeSnippet: string;
  codeLanguage: string;
  hasCode: boolean;
  bankQuestionId?: number;
  options: { text: string; isCorrect: boolean; orderIndex: number }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Dictionary;
  onSaved: () => void;
};

const QUESTION_TYPES = [
  { value: '0', labelFa: 'چهارگزینه‌ای', labelEn: 'Multiple choice' },
  { value: '1', labelFa: 'صحیح / غلط', labelEn: 'True / False' },
  { value: '2', labelFa: 'تشریحی', labelEn: 'Short answer' },
];

const LEVELS = [
  { value: 'beginner', labelFa: 'مبتدی', labelEn: 'Beginner' },
  { value: 'intermediate', labelFa: 'متوسط', labelEn: 'Intermediate' },
  { value: 'advanced', labelFa: 'پیشرفته', labelEn: 'Advanced' },
];

const OPTION_LABELS_FA = ['الف', 'ب', 'ج', 'د', 'ه', 'و'];

const STUDENT_ROW_HEIGHT = 40;
const STUDENT_LIST_MAX_HEIGHT = 220;
const STUDENT_LIST_OVERSCAN = 4;

function newQuestion(index: number, questionType = 0): QuestionDraft {
  const base: QuestionDraft = {
    id: crypto.randomUUID(),
    orderIndex: index,
    questionType,
    prompt: '',
    points: 1,
    codeSnippet: '',
    codeLanguage: 'csharp',
    hasCode: false,
    options: [],
  };
  if (questionType === 1) {
    base.options = [
      { text: 'True', isCorrect: true, orderIndex: 0 },
      { text: 'False', isCorrect: false, orderIndex: 1 },
    ];
  } else if (questionType === 0) {
    base.options = [
      { text: '', isCorrect: true, orderIndex: 0 },
      { text: '', isCorrect: false, orderIndex: 1 },
      { text: '', isCorrect: false, orderIndex: 2 },
      { text: '', isCorrect: false, orderIndex: 3 },
    ];
  }
  return base;
}

function questionTypeLabel(type: number, isRtl: boolean) {
  const item = QUESTION_TYPES.find((x) => x.value === String(type));
  return item ? (isRtl ? item.labelFa : item.labelEn) : '';
}

export function ProfessorCreateExamModal({ open, onOpenChange, dict, onSaved }: Props) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [courseId, setCourseId] = React.useState('');
  const [level, setLevel] = React.useState('beginner');
  const [endsAt, setEndsAt] = React.useState<Date | undefined>();
  const [durationMinutes, setDurationMinutes] = React.useState(60);
  const [allowPaste, setAllowPaste] = React.useState(false);
  const [courses, setCourses] = React.useState<{ value: string; label: string }[]>([]);
  const [students, setStudents] = React.useState<CourseStudentForExam[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<number[]>([]);
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState('');
  const studentsListRef = React.useRef<HTMLDivElement>(null);
  const [studentsListScrollTop, setStudentsListScrollTop] = React.useState(0);
  const [questions, setQuestions] = React.useState<QuestionDraft[]>([newQuestion(0)]);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set([questions[0]?.id]));
  const [submitting, setSubmitting] = React.useState(false);
  const [bankPickerOpen, setBankPickerOpen] = React.useState(false);
  const [bankSearch, setBankSearch] = React.useState('');
  const [bankItems, setBankItems] = React.useState<BankQuestionListItem[]>([]);
  const [bankLoading, setBankLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    searchProfessorCourses({ pageSize: 100 })
      .then((data) => setCourses(data.queryResult.map((c) => ({ value: String(c.id), label: c.title }))))
      .catch(() => setCourses([]));
  }, [open]);

  React.useEffect(() => {
    if (!courseId) {
      setStudents([]);
      setSelectedStudentIds([]);
      setStudentSearch('');
      return;
    }
    let cancelled = false;
    setStudentsLoading(true);
    getCourseStudentsForExam(Number(courseId))
      .then((list) => {
        if (!cancelled) setStudents(list);
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      })
      .finally(() => {
        if (!cancelled) setStudentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  React.useEffect(() => {
    setStudentsListScrollTop(0);
    studentsListRef.current?.scrollTo({ top: 0 });
  }, [studentSearch, courseId]);

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const filteredStudents = React.useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      [s.fullName, s.userName, s.email].some((v) => (v ?? '').toLowerCase().includes(term))
    );
  }, [students, studentSearch]);

  // Windowed rendering: with thousands of students only the visible slice is
  // mounted, so the list stays fast regardless of course size.
  const studentWindowStart = Math.max(
    0,
    Math.floor(studentsListScrollTop / STUDENT_ROW_HEIGHT) - STUDENT_LIST_OVERSCAN
  );
  const studentWindowEnd = Math.min(
    filteredStudents.length,
    Math.ceil((studentsListScrollTop + STUDENT_LIST_MAX_HEIGHT) / STUDENT_ROW_HEIGHT) +
      STUDENT_LIST_OVERSCAN
  );
  const visibleStudents = filteredStudents.slice(studentWindowStart, studentWindowEnd);

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudentIds((prev) => {
      const set = new Set(prev);
      filteredStudents.forEach((s) => set.add(s.studentId));
      return [...set];
    });
  };

  const clearSelectedStudents = () => {
    setSelectedStudentIds([]);
  };

  const updateQuestion = (id: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    const q = newQuestion(0);
    setQuestions((prev) => [q, ...prev]);
    setExpandedIds(new Set([q.id]));
  };

  const openBankPicker = async () => {
    setBankPickerOpen(true);
    setBankLoading(true);
    try {
      const page = await searchBankQuestions({
        pageNumber: 1,
        pageSize: 30,
        inputValue: bankSearch.trim() || undefined,
      });
      setBankItems(page.queryResult ?? []);
    } catch {
      setBankItems([]);
    } finally {
      setBankLoading(false);
    }
  };

  const addFromBank = async (item: BankQuestionListItem) => {
    try {
      const detail = await getBankQuestionById(item.id);
      const q: QuestionDraft = {
        id: crypto.randomUUID(),
        orderIndex: 0,
        questionType: detail.questionType,
        prompt: detail.prompt,
        points: detail.defaultPoints || 1,
        codeSnippet: detail.codeSnippet ?? '',
        codeLanguage: detail.codeLanguage ?? 'csharp',
        hasCode: Boolean(detail.codeSnippet?.trim()),
        bankQuestionId: detail.id,
        options: (detail.options ?? []).map((o, i) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          orderIndex: o.orderIndex ?? i,
        })),
      };
      setQuestions((prev) => [q, ...prev]);
      setExpandedIds(new Set([q.id]));
      setBankPickerOpen(false);
      toast({
        title: t(
          'professorDashboard.exams.bankAdded',
          isRtl ? 'سوال از بانک اضافه شد.' : 'Question added from bank.'
        ),
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.exams.bankAddFailed', isRtl ? 'افزودن از بانک ناموفق بود.' : 'Could not add from bank.'),
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((x) => x.id !== id));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleExpanded = (id: string, openState: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (openState) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !courseId || !endsAt || selectedStudentIds.length === 0) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.exams.validation', isRtl ? 'فیلدهای الزامی را تکمیل کنید.' : 'Please complete required fields.'),
      });
      return;
    }
    if (endsAt.getTime() <= Date.now()) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.exams.endsAtFuture', isRtl ? 'مهلت شرکت در آزمون باید در آینده باشد.' : 'The exam deadline must be in the future.'),
      });
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const label = `${t('professorDashboard.exams.questionLabel', isRtl ? 'سوال' : 'Question')} ${i + 1}`;
      if (!q.prompt.trim()) {
        toast({
          variant: 'destructive',
          title: t('professorDashboard.exams.promptRequired', isRtl ? `متن ${label} خالی است.` : `${label} has no prompt.`),
        });
        return;
      }
      if (!(Number(q.points) > 0)) {
        toast({
          variant: 'destructive',
          title: t('professorDashboard.exams.pointsRequired', isRtl ? `نمره ${label} باید بزرگ‌تر از صفر باشد.` : `${label}: points must be greater than zero.`),
        });
        return;
      }
      if (q.questionType === 0 && q.options.filter((o) => o.text.trim()).length < 2) {
        toast({
          variant: 'destructive',
          title: t('professorDashboard.exams.optionsRequired', isRtl ? `${label}: حداقل دو گزینه باید تکمیل شود.` : `${label}: at least two options must be filled.`),
        });
        return;
      }
    }
    setSubmitting(true);
    try {
      await createProfessorExam({
        title: title.trim(),
        description: description.trim() || undefined,
        courseId: Number(courseId),
        level,
        endsAtUtc: endsAt.toISOString(),
        durationMinutes,
        allowPaste,
        studentIds: selectedStudentIds,
        questions: questions.map((q, idx) => ({
          orderIndex: idx,
          questionType: q.questionType,
          prompt: q.prompt.trim(),
          points: Number(q.points) || 0,
          bankQuestionId: q.bankQuestionId,
          codeSnippet: q.hasCode && q.codeSnippet.trim() ? q.codeSnippet : undefined,
          codeLanguage: q.hasCode && q.codeSnippet.trim() ? q.codeLanguage : undefined,
          options:
            q.questionType === 2
              ? []
              : q.options
                  .filter((o) => o.text.trim())
                  .map((o, oi) => ({ text: o.text.trim(), isCorrect: o.isCorrect, orderIndex: oi })),
        })),
      });
      toast({ title: t('professorDashboard.exams.created', isRtl ? 'امتحان ثبت شد.' : 'Exam created.') });
      onSaved();
      const first = newQuestion(0);
      setTitle('');
      setDescription('');
      setCourseId('');
      setAllowPaste(false);
      setQuestions([first]);
      setExpandedIds(new Set([first.id]));
      setSelectedStudentIds([]);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.exams.createFailed', isRtl ? 'ثبت امتحان ناموفق بود.' : 'Failed to create exam.'),
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{t('professorDashboard.exams.addExam', isRtl ? 'ثبت امتحان جدید' : 'New exam')}</DialogTitle>
          <DialogDescription>
            {t('professorDashboard.exams.formDescription', isRtl ? 'سوالات، زمان و دانشجویان را تعیین کنید.' : 'Set questions, timing and students.')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('professorDashboard.exams.title', isRtl ? 'عنوان' : 'Title')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{t('professorDashboard.exams.description', isRtl ? 'توضیحات' : 'Description')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="rounded-lg border border-dashed bg-muted/20 p-3 sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  checked={allowPaste}
                  onCheckedChange={(checked) => setAllowPaste(Boolean(checked))}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">
                    {t('professorDashboard.exams.allowPaste', isRtl ? 'اجازه کپی/چسباندن متن' : 'Allow copy/paste')}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {allowPaste
                      ? t(
                          'professorDashboard.exams.allowPasteOn',
                          isRtl
                            ? 'دانشجو می‌تواند متن را آزادانه کپی و چسباند و چیزی علامت‌گذاری نمی‌شود.'
                            : 'Students can paste freely; nothing is flagged.'
                        )
                      : t(
                          'professorDashboard.exams.allowPasteOff',
                          isRtl
                            ? 'چسباندن متن مجاز است اما بخش‌های کپی‌شده در تصحیح با پس‌زمینه متفاوت به شما نمایش داده می‌شود.'
                            : 'Pasting is allowed but copied parts are highlighted for you while grading.'
                        )}
                  </span>
                </span>
              </label>
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.exams.course', isRtl ? 'دوره' : 'Course')}</Label>
              <IconSelectPicker
                options={courses}
                value={courseId}
                onChange={setCourseId}
                placeholder={t('professorDashboard.exams.selectCourse', isRtl ? 'انتخاب دوره' : 'Select course')}
                isRtl={isRtl}
                searchable
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.exams.level', isRtl ? 'سطح' : 'Level')}</Label>
              <IconSelectPicker
                options={LEVELS.map((l) => ({ value: l.value, label: isRtl ? l.labelFa : l.labelEn }))}
                value={level}
                onChange={setLevel}
                isRtl={isRtl}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.exams.endsAt', isRtl ? 'مهلت شرکت' : 'Registration deadline')}</Label>
              <FlatpickrDateTimePicker mode="datetime" value={endsAt} onChange={setEndsAt} locale={locale} isRtl={isRtl} />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.exams.duration', isRtl ? 'مدت پاسخ (دقیقه)' : 'Duration (minutes)')}</Label>
              <Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)} />
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Label>
                {t('professorDashboard.exams.students', isRtl ? 'دانشجویان' : 'Students')}
                {selectedStudentIds.length > 0 ? (
                  <span className="ms-2 text-xs font-normal text-muted-foreground">
                    {t('professorDashboard.exams.selectedCount', isRtl ? 'انتخاب‌شده: {n}' : 'Selected: {n}').replace('{n}', String(selectedStudentIds.length))}
                  </span>
                ) : null}
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelectedStudents}
                  disabled={!selectedStudentIds.length}
                >
                  {t('professorDashboard.exams.clearSelection', isRtl ? 'حذف انتخاب‌ها' : 'Clear selection')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllStudents}
                  disabled={studentsLoading || !filteredStudents.length}
                >
                  {t('professorDashboard.exams.selectAllStudents', isRtl ? 'همه دانشجویان دوره' : 'All course students')}
                </Button>
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={t('professorDashboard.exams.searchStudents', isRtl ? 'جستجوی نام، ایمیل یا نام کاربری...' : 'Search name, email or username...')}
                className="h-9 ps-8 text-sm"
              />
            </div>

            <div
              ref={studentsListRef}
              onScroll={(e) => setStudentsListScrollTop(e.currentTarget.scrollTop)}
              className="overflow-y-auto rounded-md border bg-background"
              style={{ maxHeight: STUDENT_LIST_MAX_HEIGHT }}
            >
              {studentsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('professorDashboard.exams.loadingStudents', isRtl ? 'در حال دریافت دانشجویان دوره...' : 'Loading course students...')}
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {students.length
                    ? t('professorDashboard.exams.studentSearchNoMatch', isRtl ? 'دانشجویی با این جستجو یافت نشد.' : 'No students match this search.')
                    : t('professorDashboard.exams.noStudents', isRtl ? 'دانشجوی فعالی یافت نشد.' : 'No active students.')}
                </p>
              ) : (
                <div className="relative" style={{ height: filteredStudents.length * STUDENT_ROW_HEIGHT }}>
                  {visibleStudents.map((s, idx) => {
                    const rowIndex = studentWindowStart + idx;
                    return (
                      <label
                        key={s.studentId}
                        className="absolute inset-x-0 flex cursor-pointer items-center gap-2 px-3 text-sm hover:bg-muted/50"
                        style={{ top: rowIndex * STUDENT_ROW_HEIGHT, height: STUDENT_ROW_HEIGHT }}
                      >
                        <Checkbox
                          checked={selectedStudentIds.includes(s.studentId)}
                          onCheckedChange={() => toggleStudent(s.studentId)}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {s.fullName || s.userName || s.email}
                        </span>
                        {s.fullName && s.userName ? (
                          <span className="max-w-[40%] truncate text-xs text-muted-foreground" dir="ltr">
                            {s.userName}
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>
                {t('professorDashboard.exams.questions', isRtl ? 'سوالات' : 'Questions')} ({totalPoints}{' '}
                {t('professorDashboard.exams.points', isRtl ? 'نمره' : 'pts')})
              </Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => void openBankPicker()}>
                  <Library className="h-4 w-4" />
                  {t('professorDashboard.exams.fromBank', isRtl ? 'از بانک سوالات' : 'From question bank')}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                  <Plus className="h-4 w-4" />
                  {t('professorDashboard.exams.addQuestion', isRtl ? 'افزودن سوال' : 'Add question')}
                </Button>
              </div>
            </div>

            {questions.map((q, qIdx) => {
              const isOpen = expandedIds.has(q.id);
              const summary = q.prompt.trim() || t('professorDashboard.exams.emptyPrompt', isRtl ? 'بدون متن' : 'No prompt');
              return (
                <Collapsible key={q.id} open={isOpen} onOpenChange={(v) => toggleExpanded(q.id, v)}>
                  <div className="rounded-lg border bg-card">
                    <div className="flex items-center gap-2 p-3">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 text-start text-sm"
                        >
                          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                          <span className="font-medium">
                            {t('professorDashboard.exams.questionLabel', isRtl ? 'سوال' : 'Question')} {qIdx + 1}
                          </span>
                          <span className="truncate text-muted-foreground">
                            ({questionTypeLabel(q.questionType, isRtl)} · {q.points}{' '}
                            {t('professorDashboard.exams.points', isRtl ? 'نمره' : 'pts')}) — {summary}
                          </span>
                          {q.bankQuestionId ? (
                            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                              {t('professorDashboard.exams.fromBankBadge', isRtl ? 'بانک' : 'Bank')}
                            </span>
                          ) : null}
                          {q.hasCode && q.codeSnippet.trim() ? (
                            <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      </CollapsibleTrigger>
                      {questions.length > 1 ? (
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeQuestion(q.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>

                    <CollapsibleContent className="space-y-3 border-t px-3 pb-3 pt-3">
                      <div className="space-y-2">
                        <Label>{t('professorDashboard.exams.questionType', isRtl ? 'نوع سوال' : 'Question type')}</Label>
                        <IconSelectPicker
                          options={QUESTION_TYPES.map((qt) => ({
                            value: qt.value,
                            label: isRtl ? qt.labelFa : qt.labelEn,
                          }))}
                          value={String(q.questionType)}
                          onChange={(v) => {
                            const type = Number(v);
                            if (type === 1) {
                              updateQuestion(q.id, {
                                questionType: type,
                                options: [
                                  { text: isRtl ? 'صحیح' : 'True', isCorrect: true, orderIndex: 0 },
                                  { text: isRtl ? 'غلط' : 'False', isCorrect: false, orderIndex: 1 },
                                ],
                              });
                            } else if (type === 0) {
                              updateQuestion(q.id, {
                                questionType: type,
                                options:
                                  q.options.length >= 2
                                    ? q.options
                                    : [
                                        { text: '', isCorrect: true, orderIndex: 0 },
                                        { text: '', isCorrect: false, orderIndex: 1 },
                                        { text: '', isCorrect: false, orderIndex: 2 },
                                        { text: '', isCorrect: false, orderIndex: 3 },
                                      ],
                              });
                            } else {
                              updateQuestion(q.id, { questionType: type, options: [] });
                            }
                          }}
                          isRtl={isRtl}
                          maxHeight={220}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>{t('professorDashboard.exams.questionPrompt', isRtl ? 'متن سوال' : 'Question prompt')}</Label>
                        <Textarea
                          value={q.prompt}
                          onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Label className="shrink-0">{t('professorDashboard.exams.points', isRtl ? 'نمره' : 'Points')}</Label>
                        <Input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={q.points}
                          onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) || 0 })}
                          className="w-28"
                        />
                      </div>

                      <div className="space-y-2 rounded-lg border border-dashed p-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Checkbox
                            checked={q.hasCode}
                            onCheckedChange={(checked) => updateQuestion(q.id, { hasCode: Boolean(checked) })}
                          />
                          <Code2 className="h-4 w-4" />
                          {t('professorDashboard.exams.addCode', isRtl ? 'افزودن کد به سوال' : 'Add code to question')}
                        </label>
                        {q.hasCode ? (
                          <div className="space-y-2">
                            <IconSelectPicker
                              options={EXAM_CODE_LANGUAGES.map((lang) => ({
                                value: lang.value,
                                label: isRtl ? lang.labelFa : lang.labelEn,
                              }))}
                              value={q.codeLanguage}
                              onChange={(v) => updateQuestion(q.id, { codeLanguage: v })}
                              isRtl={isRtl}
                            />
                            <Textarea
                              value={q.codeSnippet}
                              onChange={(e) => updateQuestion(q.id, { codeSnippet: e.target.value })}
                              rows={6}
                              className="font-mono text-sm"
                              placeholder={t('professorDashboard.exams.codePlaceholder', isRtl ? 'کد سوال را اینجا بنویسید...' : 'Write question code here...')}
                              dir="ltr"
                            />
                          </div>
                        ) : null}
                      </div>

                      {q.questionType !== 2 ? (
                        <div className="space-y-2">
                          <Label>{t('professorDashboard.exams.options', isRtl ? 'گزینه‌ها' : 'Options')}</Label>
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <span className="w-6 shrink-0 text-sm text-muted-foreground">
                                {isRtl ? `${OPTION_LABELS_FA[oi] ?? oi + 1})` : `${String.fromCharCode(65 + oi)})`}
                              </span>
                              <Checkbox
                                checked={opt.isCorrect}
                                onCheckedChange={(checked) => {
                                  const opts = q.options.map((o, i) =>
                                    i === oi ? { ...o, isCorrect: Boolean(checked) } : o
                                  );
                                  updateQuestion(q.id, { options: opts });
                                }}
                              />
                              <Input
                                value={opt.text}
                                onChange={(e) => {
                                  const opts = q.options.map((o, i) =>
                                    i === oi ? { ...o, text: e.target.value } : o
                                  );
                                  updateQuestion(q.id, { options: opts });
                                }}
                                placeholder={t('professorDashboard.exams.option', isRtl ? 'متن گزینه' : 'Option text')}
                                disabled={q.questionType === 1}
                              />
                            </div>
                          ))}
                          {q.questionType === 0 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  options: [...q.options, { text: '', isCorrect: false, orderIndex: q.options.length }],
                                })
                              }
                            >
                              <Plus className="h-3 w-3" /> {t('professorDashboard.exams.addOption', isRtl ? 'گزینه' : 'Option')}
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('professorDashboard.exams.cancel', isRtl ? 'انصراف' : 'Cancel')}
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('professorDashboard.exams.save', isRtl ? 'ثبت امتحان' : 'Create exam')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <Dialog open={bankPickerOpen} onOpenChange={setBankPickerOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {t('professorDashboard.exams.fromBank', isRtl ? 'انتخاب از بانک سوالات' : 'Pick from question bank')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              placeholder={t('professorDashboard.questionBank.search', isRtl ? 'جستجو…' : 'Search…')}
            />
            <Button type="button" variant="secondary" onClick={() => void openBankPicker()}>
              {t('professorDashboard.exams.searchBank', isRtl ? 'جستجو' : 'Search')}
            </Button>
          </div>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {bankLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : bankItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('professorDashboard.questionBank.empty', isRtl ? 'سوالی یافت نشد.' : 'No questions found.')}
              </p>
            ) : (
              bankItems.map((item) => {
                const diff = DIFFICULTY_LABELS[item.effectiveDifficulty] ?? DIFFICULTY_LABELS[0];
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full rounded-lg border p-3 text-start hover:bg-muted/40"
                    onClick={() => void addFromBank(item)}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn('inline-block h-2 w-2 rounded-full', diff.color)} />
                      {isRtl ? diff.fa : diff.en}
                      {item.category ? <span>· {item.category}</span> : null}
                      <span>· {Math.round((item.correctRate || 0) * 100)}%</span>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium">{item.prompt}</p>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
