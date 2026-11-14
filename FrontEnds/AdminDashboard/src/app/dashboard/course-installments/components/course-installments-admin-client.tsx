'use client';

import * as React from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

type InstallmentRow = {
  id: number;
  number: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string | null;
  paymentReference?: string | null;
  isOverdue: boolean;
};

type CourseEnrollmentRow = {
  enrollmentId: number;
  courseId: number;
  courseTitle: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  enrolledAt: string;
  licenseKey?: string | null;
  licenseExpiresAtUtc?: string | null;
  contentAccessMode: string;
  installmentCount: number;
  paidInstallmentCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: InstallmentRow[];
};

type EducationPlanRow = {
  planId: number;
  planTitle: string;
  managedRoomStudentId: number;
  studentName: string;
  studentUserName?: string | null;
  ownerUserId: number;
  teacherName?: string | null;
  roomTitle?: string | null;
  startDateUtc: string;
  endDateUtc: string;
  finalTotalCostToman: number;
  installmentCount: number;
  paidInstallmentCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: InstallmentRow[];
};

type DetailTarget =
  | { kind: 'course'; row: CourseEnrollmentRow }
  | { kind: 'education-plan'; row: EducationPlanRow };

function formatToman(n: number) {
  return new Intl.NumberFormat('fa-IR').format(n);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fa-IR');
}

function normalizeCourseRow(raw: Record<string, unknown>): CourseEnrollmentRow {
  const installmentsRaw = Array.isArray(raw.installments) ? raw.installments : [];
  const installments = installmentsRaw.map((item) => {
    const i = item as Record<string, unknown>;
    return {
      id: Number(i.id ?? 0),
      number: Number(i.number ?? 0),
      amount: Number(i.amount ?? 0),
      dueDate: String(i.dueDate ?? ''),
      isPaid: Boolean(i.isPaid),
      paidDate: (i.paidDate as string | null | undefined) ?? null,
      paymentReference: (i.paymentReference as string | null | undefined) ?? null,
      isOverdue: Boolean(i.isOverdue),
    };
  });
  const totalAmount = Number(raw.totalAmount ?? installments.reduce((s, i) => s + i.amount, 0));
  const paidAmount = Number(raw.paidAmount ?? installments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0));
  return {
    enrollmentId: Number(raw.enrollmentId ?? 0),
    courseId: Number(raw.courseId ?? 0),
    courseTitle: String(raw.courseTitle ?? ''),
    studentId: Number(raw.studentId ?? 0),
    studentName: String(raw.studentName ?? ''),
    studentEmail: String(raw.studentEmail ?? ''),
    enrolledAt: String(raw.enrolledAt ?? ''),
    licenseKey: (raw.licenseKey as string | null | undefined) ?? null,
    licenseExpiresAtUtc: (raw.licenseExpiresAtUtc as string | null | undefined) ?? null,
    contentAccessMode: String(raw.contentAccessMode ?? ''),
    installmentCount: Number(raw.installmentCount ?? installments.length),
    paidInstallmentCount: Number(raw.paidInstallmentCount ?? installments.filter((i) => i.isPaid).length),
    totalAmount,
    paidAmount,
    remainingAmount: Number(raw.remainingAmount ?? Math.max(0, totalAmount - paidAmount)),
    installments,
  };
}

function normalizeEducationPlanRow(raw: Record<string, unknown>): EducationPlanRow {
  const installmentsRaw = Array.isArray(raw.installments ?? raw.Installments)
    ? ((raw.installments ?? raw.Installments) as unknown[])
    : [];
  const installments = installmentsRaw.map((item) => {
    const i = item as Record<string, unknown>;
    return {
      id: Number(i.id ?? i.Id ?? 0),
      number: Number(i.number ?? i.Number ?? 0),
      amount: Number(i.amount ?? i.Amount ?? 0),
      dueDate: String(i.dueDate ?? i.DueDate ?? ''),
      isPaid: Boolean(i.isPaid ?? i.IsPaid),
      paidDate: (i.paidDate ?? i.PaidDate ?? null) as string | null,
      paymentReference: (i.paymentReference ?? i.PaymentReference ?? null) as string | null,
      isOverdue: Boolean(i.isOverdue ?? i.IsOverdue),
    };
  });
  const totalAmount = Number(
    raw.totalAmount ?? raw.TotalAmount ?? installments.reduce((s, i) => s + i.amount, 0)
  );
  const paidAmount = Number(
    raw.paidAmount ??
      raw.PaidAmount ??
      installments.filter((i) => i.isPaid).reduce((s, i) => s + i.amount, 0)
  );
  return {
    planId: Number(raw.planId ?? raw.PlanId ?? 0),
    planTitle: String(raw.planTitle ?? raw.PlanTitle ?? ''),
    managedRoomStudentId: Number(raw.managedRoomStudentId ?? raw.ManagedRoomStudentId ?? 0),
    studentName: String(raw.studentName ?? raw.StudentName ?? ''),
    studentUserName: (raw.studentUserName ?? raw.StudentUserName ?? null) as string | null,
    ownerUserId: Number(raw.ownerUserId ?? raw.OwnerUserId ?? 0),
    teacherName: (raw.teacherName ?? raw.TeacherName ?? null) as string | null,
    roomTitle: (raw.roomTitle ?? raw.RoomTitle ?? null) as string | null,
    startDateUtc: String(raw.startDateUtc ?? raw.StartDateUtc ?? ''),
    endDateUtc: String(raw.endDateUtc ?? raw.EndDateUtc ?? ''),
    finalTotalCostToman: Number(raw.finalTotalCostToman ?? raw.FinalTotalCostToman ?? totalAmount),
    installmentCount: Number(raw.installmentCount ?? raw.InstallmentCount ?? installments.length),
    paidInstallmentCount: Number(
      raw.paidInstallmentCount ??
        raw.PaidInstallmentCount ??
        installments.filter((i) => i.isPaid).length
    ),
    totalAmount,
    paidAmount,
    remainingAmount: Number(
      raw.remainingAmount ?? raw.RemainingAmount ?? Math.max(0, totalAmount - paidAmount)
    ),
    installments,
  };
}

function SummaryStats({
  installmentCount,
  paidInstallmentCount,
  totalAmount,
  paidAmount,
  remainingAmount,
}: {
  installmentCount: number;
  paidInstallmentCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
      <div className="rounded-md border p-2">
        <p className="text-xs text-muted-foreground">اقساط پرداخت‌شده</p>
        <p className="font-medium">
          {paidInstallmentCount} از {installmentCount}
        </p>
      </div>
      <div className="rounded-md border p-2">
        <p className="text-xs text-muted-foreground">مبلغ کل</p>
        <p className="font-medium">{formatToman(totalAmount)} تومان</p>
      </div>
      <div className="rounded-md border p-2">
        <p className="text-xs text-muted-foreground">پرداخت‌شده</p>
        <p className="font-medium">{formatToman(paidAmount)} تومان</p>
      </div>
      <div className="rounded-md border p-2">
        <p className="text-xs text-muted-foreground">مانده</p>
        <p className="font-medium">{formatToman(remainingAmount)} تومان</p>
      </div>
    </div>
  );
}

export function CourseInstallmentsAdminClient() {
  const [tab, setTab] = React.useState<'courses' | 'education-plans'>('education-plans');
  const [courseRows, setCourseRows] = React.useState<CourseEnrollmentRow[]>([]);
  const [planRows, setPlanRows] = React.useState<EducationPlanRow[]>([]);
  const [loadingCourses, setLoadingCourses] = React.useState(true);
  const [loadingPlans, setLoadingPlans] = React.useState(true);
  const [errorCourses, setErrorCourses] = React.useState<string | null>(null);
  const [errorPlans, setErrorPlans] = React.useState<string | null>(null);
  const [q, setQ] = React.useState('');
  const [detail, setDetail] = React.useState<DetailTarget | null>(null);
  const [confirmInstallment, setConfirmInstallment] = React.useState<InstallmentRow | null>(null);
  const [adminNote, setAdminNote] = React.useState('');
  const [marking, setMarking] = React.useState(false);

  const loadCourses = React.useCallback(async () => {
    setLoadingCourses(true);
    setErrorCourses(null);
    try {
      const res = await apiClient.get<unknown>('/CourseInstallments/List');
      const data = res.data;
      const list = Array.isArray(data) ? data : [];
      setCourseRows(list.map((item) => normalizeCourseRow(item as Record<string, unknown>)));
    } catch (e) {
      setErrorCourses(e instanceof Error ? e.message : 'بارگذاری ناموفق بود');
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  const loadPlans = React.useCallback(async () => {
    setLoadingPlans(true);
    setErrorPlans(null);
    try {
      const res = await apiClient.get<unknown>('/CourseInstallments/ListEducationPlans');
      const data = res.data;
      const list = Array.isArray(data) ? data : [];
      setPlanRows(list.map((item) => normalizeEducationPlanRow(item as Record<string, unknown>)));
    } catch (e) {
      setErrorPlans(e instanceof Error ? e.message : 'بارگذاری ناموفق بود');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCourses();
    void loadPlans();
  }, [loadCourses, loadPlans]);

  const filteredCourses = courseRows.filter((r) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.courseTitle.toLowerCase().includes(needle) ||
      r.studentName.toLowerCase().includes(needle) ||
      r.studentEmail.toLowerCase().includes(needle) ||
      String(r.enrollmentId).includes(needle)
    );
  });

  const filteredPlans = planRows.filter((r) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.planTitle.toLowerCase().includes(needle) ||
      r.studentName.toLowerCase().includes(needle) ||
      (r.studentUserName ?? '').toLowerCase().includes(needle) ||
      (r.teacherName ?? '').toLowerCase().includes(needle) ||
      (r.roomTitle ?? '').toLowerCase().includes(needle) ||
      String(r.planId).includes(needle)
    );
  });

  const refreshAfterMark = async () => {
    if (detail?.kind === 'course') {
      await loadCourses();
    } else {
      await loadPlans();
    }
  };

  React.useEffect(() => {
    if (!detail) return;
    if (detail.kind === 'course') {
      const updated = courseRows.find((r) => r.enrollmentId === detail.row.enrollmentId);
      if (updated && updated !== detail.row) setDetail({ kind: 'course', row: updated });
      return;
    }
    const updated = planRows.find((r) => r.planId === detail.row.planId);
    if (updated && updated !== detail.row) setDetail({ kind: 'education-plan', row: updated });
  }, [courseRows, planRows, detail]);

  const handleMarkPaid = async () => {
    if (!detail || !confirmInstallment) return;
    setMarking(true);
    try {
      if (detail.kind === 'course') {
        await apiClient.post('/CourseInstallments/MarkCoursePaid', {
          installmentId: confirmInstallment.id,
          adminNote: adminNote.trim() || undefined,
        });
      } else {
        await apiClient.post('/CourseInstallments/MarkEducationPlanPaid', {
          installmentId: confirmInstallment.id,
          adminNote: adminNote.trim() || undefined,
        });
      }
      toast({ title: 'قسط به‌عنوان پرداخت‌شده ثبت شد.' });
      setConfirmInstallment(null);
      setAdminNote('');
      await refreshAfterMark();
    } catch (e) {
      toast({
        title: 'ثبت پرداخت ناموفق بود',
        description: e instanceof Error ? e.message : 'خطای ناشناخته',
        variant: 'destructive',
      });
    } finally {
      setMarking(false);
    }
  };

  const renderListState = (
    loading: boolean,
    error: string | null,
    empty: boolean,
    children: React.ReactNode
  ) => {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      );
    }
    if (error) return <p className="text-destructive text-sm">{error}</p>;
    if (empty) return <p className="text-muted-foreground text-sm">موردی یافت نشد.</p>;
    return children;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">مدیریت اقساط</h1>
        <p className="text-muted-foreground text-sm">
          پیگیری و تایید پرداخت اقساط دوره‌ها و پلن‌های آموزشی خصوصی. با کلیک روی هر مورد جزئیات اقساط را ببینید
          و در صورت نیاز پرداخت را تایید کنید.
        </p>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجو بر اساس دانشجو، دوره، پلن یا ایمیل..."
        className="max-w-md"
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'courses' | 'education-plans')}>
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="education-plans">اقساط پلن‌های آموزشی</TabsTrigger>
          <TabsTrigger value="courses">اقساط دوره‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="education-plans" className="mt-4 space-y-3">
          {renderListState(
            loadingPlans,
            errorPlans,
            filteredPlans.length === 0,
            filteredPlans.map((row) => (
              <Card
                key={row.planId}
                className="cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => setDetail({ kind: 'education-plan', row })}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{row.planTitle || `پلن #${row.planId}`}</CardTitle>
                      <CardDescription>
                        {row.studentName || 'دانشجو'}
                        {row.studentUserName ? ` · ${row.studentUserName}` : ''}
                        {row.teacherName ? ` · استاد: ${row.teacherName}` : ''}
                        {row.roomTitle ? ` · اتاق: ${row.roomTitle}` : ''}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {row.paidInstallmentCount}/{row.installmentCount} قسط
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <SummaryStats
                    installmentCount={row.installmentCount}
                    paidInstallmentCount={row.paidInstallmentCount}
                    totalAmount={row.totalAmount}
                    paidAmount={row.paidAmount}
                    remainingAmount={row.remainingAmount}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="courses" className="mt-4 space-y-3">
          {renderListState(
            loadingCourses,
            errorCourses,
            filteredCourses.length === 0,
            filteredCourses.map((row) => (
              <Card
                key={row.enrollmentId}
                className="cursor-pointer transition-colors hover:bg-muted/40"
                onClick={() => setDetail({ kind: 'course', row })}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {row.courseTitle || `دوره #${row.courseId}`}
                      </CardTitle>
                      <CardDescription>
                        {row.studentName || 'دانشجو'} — {row.studentEmail || '—'} · ثبت‌نام{' '}
                        {formatDate(row.enrolledAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {row.paidInstallmentCount}/{row.installmentCount} قسط
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <SummaryStats
                    installmentCount={row.installmentCount}
                    paidInstallmentCount={row.paidInstallmentCount}
                    totalAmount={row.totalAmount}
                    paidAmount={row.paidAmount}
                    remainingAmount={row.remainingAmount}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {detail.kind === 'course'
                    ? detail.row.courseTitle || `دوره #${detail.row.courseId}`
                    : detail.row.planTitle || `پلن #${detail.row.planId}`}
                </DialogTitle>
                <DialogDescription>
                  {detail.kind === 'course' ? (
                    <>
                      {detail.row.studentName || 'دانشجو'} — {detail.row.studentEmail || '—'}
                      {detail.row.licenseKey ? (
                        <span className="mt-1 block dir-ltr text-xs">
                          License: {detail.row.licenseKey}
                          {detail.row.licenseExpiresAtUtc
                            ? ` · expires ${formatDate(detail.row.licenseExpiresAtUtc)}`
                            : ''}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {detail.row.studentName || 'دانشجو'}
                      {detail.row.teacherName ? ` · استاد: ${detail.row.teacherName}` : ''}
                      {detail.row.roomTitle ? ` · اتاق: ${detail.row.roomTitle}` : ''}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <SummaryStats
                installmentCount={detail.row.installmentCount}
                paidInstallmentCount={detail.row.paidInstallmentCount}
                totalAmount={detail.row.totalAmount}
                paidAmount={detail.row.paidAmount}
                remainingAmount={detail.row.remainingAmount}
              />

              <div className="space-y-2">
                {detail.row.installments.map((inst) => (
                  <div key={inst.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">قسط {inst.number}</span>
                      {inst.isPaid ? (
                        <Badge variant="secondary">پرداخت‌شده</Badge>
                      ) : inst.isOverdue ? (
                        <Badge variant="destructive">معوق</Badge>
                      ) : (
                        <Badge variant="outline">در انتظار</Badge>
                      )}
                    </div>
                    <div className="grid gap-1 text-sm sm:grid-cols-2">
                      <p>مبلغ: {formatToman(inst.amount)} تومان</p>
                      <p>سررسید: {formatDate(inst.dueDate)}</p>
                      <p>تاریخ پرداخت: {formatDate(inst.paidDate)}</p>
                      <p className="truncate" title={inst.paymentReference ?? undefined}>
                        مرجع: {inst.paymentReference || '—'}
                      </p>
                    </div>
                    {!inst.isPaid ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          setConfirmInstallment(inst);
                          setAdminNote('');
                        }}
                      >
                        تایید پرداخت
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmInstallment}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmInstallment(null);
            setAdminNote('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تایید پرداخت قسط</DialogTitle>
            <DialogDescription>
              {confirmInstallment
                ? `قسط ${confirmInstallment.number} به مبلغ ${formatToman(confirmInstallment.amount)} تومان به‌عنوان پرداخت‌شده ثبت می‌شود.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="admin-note">یادداشت ادمین (اختیاری)</Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="مثلاً: واریز کارت‌به‌کارت / رسید بانکی"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmInstallment(null);
                setAdminNote('');
              }}
              disabled={marking}
            >
              انصراف
            </Button>
            <Button type="button" onClick={() => void handleMarkPaid()} disabled={marking}>
              {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              تایید و پاس کردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
