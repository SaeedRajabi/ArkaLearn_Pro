'use client';

import * as React from 'react';
import {
  BarChart3,
  Loader2,
  Plus,
  Search,
  Trash2,
  Pencil,
  Tags,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { usePagination, DOTS } from '@/hooks/use-pagination';
import { IconSelectPicker } from '@/components/shared/icon-select-picker';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import { useLanguage } from '@/contexts/language-context';
import { resolveUserFacingError } from '@/lib/errors/user-facing-message';
import {
  classifyBankQuestion,
  createBankQuestion,
  deleteBankQuestion,
  DIFFICULTY_LABELS,
  getBankQuestionAnalytics,
  getBankQuestionById,
  getBankQuestionDetailAnalytics,
  searchBankQuestions,
  updateBankQuestion,
  type BankQuestionAnalytics,
  type BankQuestionDetail,
  type BankQuestionDetailAnalytics,
  type BankQuestionListItem,
} from '@/lib/api/question-bank';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';

const QUESTION_TYPES = [
  { value: '0', labelFa: 'چهارگزینه‌ای', labelEn: 'Multiple choice' },
  { value: '1', labelFa: 'صحیح / غلط', labelEn: 'True / False' },
  { value: '2', labelFa: 'تشریحی', labelEn: 'Short answer' },
];

const DIFFICULTIES = [
  { value: '', labelFa: 'همه سختی‌ها', labelEn: 'All difficulties' },
  { value: '0', labelFa: 'نامشخص', labelEn: 'Unknown' },
  { value: '1', labelFa: 'آسان', labelEn: 'Easy' },
  { value: '2', labelFa: 'متوسط', labelEn: 'Medium' },
  { value: '3', labelFa: 'سخت', labelEn: 'Hard' },
];

const PAGE_SIZE = 10;

type Props = { dict: Dictionary };

type Draft = {
  id?: number;
  questionType: number;
  prompt: string;
  defaultPoints: number;
  category: string;
  topic: string;
  tags: string;
  manualDifficulty: string;
  options: { text: string; isCorrect: boolean; orderIndex: number }[];
};

function emptyDraft(type = 0): Draft {
  const draft: Draft = {
    questionType: type,
    prompt: '',
    defaultPoints: 1,
    category: '',
    topic: '',
    tags: '',
    manualDifficulty: '',
    options: [],
  };
  if (type === 1) {
    draft.options = [
      { text: 'صحیح', isCorrect: true, orderIndex: 0 },
      { text: 'غلط', isCorrect: false, orderIndex: 1 },
    ];
  } else if (type === 0) {
    draft.options = [
      { text: '', isCorrect: true, orderIndex: 0 },
      { text: '', isCorrect: false, orderIndex: 1 },
      { text: '', isCorrect: false, orderIndex: 2 },
      { text: '', isCorrect: false, orderIndex: 3 },
    ];
  }
  return draft;
}

export function ProfessorQuestionBankPageClient({ dict }: Props) {
  const { locale } = useLanguage();
  const isFa = locale === 'fa';
  const { toast } = useToast();
  // Stable identity: `t` is referenced by the auto-fired `load` effect below.
  // A fresh arrow per render made `load` change on every render and re-triggered
  // the fetch loop, leaving the page stuck on its loading spinner.
  const t = React.useCallback((key: string, fallback: string) => getDictValue(dict, key, fallback), [dict]);

  const [items, setItems] = React.useState<BankQuestionListItem[]>([]);
  const [analytics, setAnalytics] = React.useState<BankQuestionAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [difficultyFilter, setDifficultyFilter] = React.useState('');
  const [mineOnly, setMineOnly] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft());
  const [saving, setSaving] = React.useState(false);
  const [detail, setDetail] = React.useState<BankQuestionDetail | null>(null);
  const [detailAnalytics, setDetailAnalytics] = React.useState<BankQuestionDetailAnalytics | null>(null);
  const [classifyOpen, setClassifyOpen] = React.useState(false);
  const [classifyDraft, setClassifyDraft] = React.useState({
    id: 0,
    category: '',
    topic: '',
    tags: '',
    manualDifficulty: '',
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Any change to search/filters restarts the list from the first page.
  React.useEffect(() => {
    setPage(1);
  }, [debounced, typeFilter, difficultyFilter, mineOnly]);

  // Paged list — refetched on search/filter changes and on page changes.
  const loadList = React.useCallback(async () => {
    setLoading(true);
    try {
      const pageData = await searchBankQuestions({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        inputValue: debounced || undefined,
        questionType: typeFilter ? Number(typeFilter) : undefined,
        difficulty: difficultyFilter ? Number(difficultyFilter) : undefined,
        mineOnly,
      });
      setItems(pageData.queryResult ?? []);
      setTotalCount(pageData.totalCount ?? 0);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.loadFailed', 'بارگذاری بانک سوالات ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    } finally {
      setLoading(false);
    }
  }, [debounced, typeFilter, difficultyFilter, mineOnly, page, t, toast]);

  // Analytics is filter- and page-independent — loaded once (and after mutations),
  // not on every page change (it scans the whole bank server-side).
  const loadAnalytics = React.useCallback(async () => {
    try {
      setAnalytics(await getBankQuestionAnalytics());
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.loadFailed', 'بارگذاری بانک سوالات ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    }
  }, [t, toast]);

  // Full refresh used after create/delete/classify mutations.
  const load = React.useCallback(async () => {
    await Promise.all([loadList(), loadAnalytics()]);
  }, [loadList, loadAnalytics]);

  React.useEffect(() => {
    void loadList();
  }, [loadList]);

  React.useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginationRange = usePagination({
    totalCount,
    pageSize: PAGE_SIZE,
    currentPage: page,
    siblingCount: 1,
  });

  async function openDetail(id: number) {
    try {
      const [q, a] = await Promise.all([getBankQuestionById(id), getBankQuestionDetailAnalytics(id)]);
      setDetail(q);
      setDetailAnalytics(a);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.loadFailed', 'بارگذاری ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    }
  }

  function openCreate() {
    setDraft(emptyDraft(0));
    setEditorOpen(true);
  }

  async function openEdit(id: number) {
    try {
      const q = await getBankQuestionById(id);
      setDraft({
        id: q.id,
        questionType: q.questionType,
        prompt: q.prompt,
        defaultPoints: q.defaultPoints,
        category: q.category ?? '',
        topic: q.topic ?? '',
        tags: q.tags ?? '',
        manualDifficulty: q.manualDifficulty != null ? String(q.manualDifficulty) : '',
        options: (q.options ?? []).map((o, i) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          orderIndex: o.orderIndex ?? i,
        })),
      });
      setEditorOpen(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.loadFailed', 'بارگذاری ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    }
  }

  async function saveDraft() {
    if (!draft.prompt.trim()) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.promptRequired', 'متن سوال الزامی است'),
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        prompt: draft.prompt.trim(),
        defaultPoints: draft.defaultPoints,
        category: draft.category || undefined,
        topic: draft.topic || undefined,
        tags: draft.tags || undefined,
        manualDifficulty: draft.manualDifficulty ? Number(draft.manualDifficulty) : undefined,
        options: draft.options.map((o, i) => ({ ...o, orderIndex: i })),
      };
      if (draft.id) {
        await updateBankQuestion({ id: draft.id, ...payload, codeSnippet: undefined, codeLanguage: undefined });
      } else {
        await createBankQuestion({
          questionType: draft.questionType,
          ...payload,
        });
      }
      toast({ title: t('professorDashboard.questionBank.saved', 'سوال ذخیره شد') });
      setEditorOpen(false);
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.saveFailed', 'ذخیره ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeQuestion(id: number) {
    if (!window.confirm(isFa ? 'این سوال از بانک حذف شود؟' : 'Delete this question from the bank?')) return;
    try {
      await deleteBankQuestion(id);
      toast({ title: t('professorDashboard.questionBank.deleted', 'سوال حذف شد') });
      setDetail(null);
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.deleteFailed', 'حذف ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    }
  }

  async function saveClassify() {
    try {
      await classifyBankQuestion({
        id: classifyDraft.id,
        category: classifyDraft.category || undefined,
        topic: classifyDraft.topic || undefined,
        tags: classifyDraft.tags || undefined,
        manualDifficulty: classifyDraft.manualDifficulty
          ? Number(classifyDraft.manualDifficulty)
          : undefined,
        clearManualDifficulty: !classifyDraft.manualDifficulty,
      });
      toast({ title: t('professorDashboard.questionBank.classified', 'طبقه‌بندی ذخیره شد') });
      setClassifyOpen(false);
      await load();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.questionBank.saveFailed', 'ذخیره ناموفق بود'),
        description: resolveUserFacingError(err, 'خطا'),
      });
    }
  }

  const difficultyBadge = (d: number) => {
    const meta = DIFFICULTY_LABELS[d] ?? DIFFICULTY_LABELS[0];
    return (
      <Badge variant="secondary" className="gap-1.5">
        <span className={cn('inline-block h-2 w-2 rounded-full', meta.color)} />
        {isFa ? meta.fa : meta.en}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {t('professorDashboard.questionBank.title', 'بانک سوالات')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              'professorDashboard.questionBank.subtitle',
              'سوالات را ذخیره، طبقه‌بندی و در آزمون‌ها استفاده کنید. سختی بر اساس پاسخ دانشجویان محاسبه می‌شود.'
            )}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t('professorDashboard.questionBank.add', 'افزودن سوال')}
        </Button>
      </div>

      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('professorDashboard.questionBank.total', 'کل سوالات')}</CardDescription>
              <CardTitle className="text-2xl">{analytics.totalQuestions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('professorDashboard.questionBank.avgCorrect', 'میانگین پاسخ صحیح')}</CardDescription>
              <CardTitle className="text-2xl">{Math.round((analytics.averageCorrectRate || 0) * 100)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('professorDashboard.questionBank.hard', 'سخت')}</CardDescription>
              <CardTitle className="text-2xl text-rose-600">{analytics.hardCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('professorDashboard.questionBank.easy', 'آسان')}</CardDescription>
              <CardTitle className="text-2xl text-emerald-600">{analytics.easyCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('professorDashboard.questionBank.search', 'جستجو در متن، دسته یا موضوع…')}
            />
          </div>
          <IconSelectPicker
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: '', label: isFa ? 'همه انواع' : 'All types' },
              ...QUESTION_TYPES.map((x) => ({ value: x.value, label: isFa ? x.labelFa : x.labelEn })),
            ]}
            className="w-[180px]"
          />
          <IconSelectPicker
            value={difficultyFilter}
            onChange={setDifficultyFilter}
            options={DIFFICULTIES.map((x) => ({ value: x.value, label: isFa ? x.labelFa : x.labelEn }))}
            className="w-[180px]"
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={mineOnly} onCheckedChange={(v) => setMineOnly(Boolean(v))} />
            {t('professorDashboard.questionBank.mineOnly', 'فقط سوالات من')}
          </label>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('professorDashboard.questionBank.empty', 'هنوز سوالی در بانک نیست. اولین سوال را اضافه کنید.')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <button type="button" className="min-w-0 flex-1 text-start" onClick={() => void openDetail(item.id)}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {difficultyBadge(item.effectiveDifficulty)}
                    <Badge variant="outline">
                      {QUESTION_TYPES.find((x) => x.value === String(item.questionType))?.[isFa ? 'labelFa' : 'labelEn']}
                    </Badge>
                    {item.category ? <Badge variant="secondary">{item.category}</Badge> : null}
                    <span className="text-xs text-muted-foreground">
                      {Math.round((item.correctRate || 0) * 100)}% · {item.usageCount}{' '}
                      {t('professorDashboard.questionBank.uses', 'استفاده')}
                    </span>
                  </div>
                  <p className="line-clamp-2 font-medium">{item.prompt}</p>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title={t('professorDashboard.questionBank.classify', 'طبقه‌بندی')}
                    onClick={() => {
                      setClassifyDraft({
                        id: item.id,
                        category: item.category ?? '',
                        topic: item.topic ?? '',
                        tags: item.tags ?? '',
                        manualDifficulty: item.manualDifficulty != null ? String(item.manualDifficulty) : '',
                      });
                      setClassifyOpen(true);
                    }}
                  >
                    <Tags className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => void openEdit(item.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => void removeQuestion(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalCount > PAGE_SIZE ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {(paginationRange ?? []).map((item, idx) =>
              item === DOTS ? (
                <PaginationItem key={`dots-${idx}`}>
                  <span className="px-2 text-muted-foreground">…</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    isActive={item === page}
                    onClick={() => setPage(Number(item))}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      {analytics && (analytics.hardestQuestions.length > 0 || analytics.easiestQuestions.length > 0) ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                {t('professorDashboard.questionBank.hardest', 'سخت‌ترین سوالات')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.hardestQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="block w-full rounded-md border p-3 text-start text-sm hover:bg-muted/40"
                  onClick={() => void openDetail(q.id)}
                >
                  <div className="mb-1 flex justify-between gap-2">
                    {difficultyBadge(q.effectiveDifficulty)}
                    <span className="text-xs text-muted-foreground">{Math.round(q.correctRate * 100)}%</span>
                  </div>
                  {q.prompt}
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                {t('professorDashboard.questionBank.easiest', 'آسان‌ترین سوالات')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analytics.easiestQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="block w-full rounded-md border p-3 text-start text-sm hover:bg-muted/40"
                  onClick={() => void openDetail(q.id)}
                >
                  <div className="mb-1 flex justify-between gap-2">
                    {difficultyBadge(q.effectiveDifficulty)}
                    <span className="text-xs text-muted-foreground">{Math.round(q.correctRate * 100)}%</span>
                  </div>
                  {q.prompt}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {draft.id
                ? t('professorDashboard.questionBank.edit', 'ویرایش سوال')
                : t('professorDashboard.questionBank.add', 'افزودن سوال')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!draft.id ? (
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.type', 'نوع سوال')}</Label>
                <IconSelectPicker
                  value={String(draft.questionType)}
                  onChange={(v) => setDraft(emptyDraft(Number(v)))}
                  options={QUESTION_TYPES.map((x) => ({
                    value: x.value,
                    label: isFa ? x.labelFa : x.labelEn,
                  }))}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{t('professorDashboard.questionBank.prompt', 'متن سوال')}</Label>
              <Textarea
                rows={4}
                value={draft.prompt}
                onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.points', 'نمره پیش‌فرض')}</Label>
                <Input
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={draft.defaultPoints}
                  onChange={(e) => setDraft((d) => ({ ...d, defaultPoints: Number(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.manualDifficulty', 'سختی دستی')}</Label>
                <IconSelectPicker
                  value={draft.manualDifficulty}
                  onChange={(v) => setDraft((d) => ({ ...d, manualDifficulty: v }))}
                  options={DIFFICULTIES.filter((x) => x.value !== '').map((x) => ({
                    value: x.value,
                    label: isFa ? x.labelFa : x.labelEn,
                  }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.category', 'دسته')}</Label>
                <Input value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.topic', 'موضوع')}</Label>
                <Input value={draft.topic} onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.tags', 'برچسب‌ها')}</Label>
                <Input value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} />
              </div>
            </div>
            {draft.questionType !== 2 ? (
              <div className="space-y-2">
                <Label>{t('professorDashboard.questionBank.options', 'گزینه‌ها')}</Label>
                {draft.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Checkbox
                      checked={opt.isCorrect}
                      onCheckedChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          options: d.options.map((o, i) =>
                            i === idx
                              ? { ...o, isCorrect: Boolean(v) }
                              : d.questionType === 0
                                ? { ...o, isCorrect: false }
                                : o
                          ),
                        }))
                      }
                    />
                    <Input
                      value={opt.text}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          options: d.options.map((o, i) => (i === idx ? { ...o, text: e.target.value } : o)),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              {t('common.cancel', 'انصراف')}
            </Button>
            <Button disabled={saving} onClick={() => void saveDraft()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('common.save', 'ذخیره')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={classifyOpen} onOpenChange={setClassifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('professorDashboard.questionBank.classify', 'طبقه‌بندی سوال')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>{t('professorDashboard.questionBank.category', 'دسته')}</Label>
              <Input
                value={classifyDraft.category}
                onChange={(e) => setClassifyDraft((d) => ({ ...d, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.questionBank.topic', 'موضوع')}</Label>
              <Input
                value={classifyDraft.topic}
                onChange={(e) => setClassifyDraft((d) => ({ ...d, topic: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.questionBank.tags', 'برچسب‌ها')}</Label>
              <Input
                value={classifyDraft.tags}
                onChange={(e) => setClassifyDraft((d) => ({ ...d, tags: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('professorDashboard.questionBank.manualDifficulty', 'سختی دستی')}</Label>
              <IconSelectPicker
                value={classifyDraft.manualDifficulty}
                onChange={(v) => setClassifyDraft((d) => ({ ...d, manualDifficulty: v }))}
                options={[
                  { value: '', label: isFa ? 'خودکار (بر اساس پاسخ‌ها)' : 'Auto (from answers)' },
                  ...DIFFICULTIES.filter((x) => x.value !== '0' && x.value !== '').map((x) => ({
                    value: x.value,
                    label: isFa ? x.labelFa : x.labelEn,
                  })),
                ]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void saveClassify()}>{t('common.save', 'ذخیره')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  {difficultyBadge(detail.effectiveDifficulty)}
                  <span className="text-base font-semibold">
                    {t('professorDashboard.questionBank.analysis', 'تحلیل سوال')}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm leading-relaxed">{detail.prompt}</p>
              {detailAnalytics ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">
                      {t('professorDashboard.questionBank.correctRate', 'نرخ پاسخ صحیح')}
                    </div>
                    <div className="text-lg font-semibold">{Math.round(detailAnalytics.correctRate * 100)}%</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">
                      {t('professorDashboard.questionBank.answers', 'پاسخ‌های نمره‌دهی‌شده')}
                    </div>
                    <div className="text-lg font-semibold">{detailAnalytics.totalGradedAnswers}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">{t('professorDashboard.questionBank.uses', 'استفاده')}</div>
                    <div className="text-lg font-semibold">{detailAnalytics.usageCount}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-muted-foreground">
                      {t('professorDashboard.questionBank.linkedExams', 'آزمون‌های مرتبط')}
                    </div>
                    <div className="text-lg font-semibold">{detailAnalytics.linkedExamCount}</div>
                  </div>
                </div>
              ) : null}
              {detailAnalytics?.recentExams?.length ? (
                <div className="space-y-2">
                  <Label>{t('professorDashboard.questionBank.recentExams', 'آخرین آزمون‌ها')}</Label>
                  <ul className="space-y-1 text-sm">
                    {detailAnalytics.recentExams.map((e) => (
                      <li key={e.examId} className="rounded border px-3 py-2">
                        {e.examTitle}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
