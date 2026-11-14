'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Clock, ClipboardList, CreditCard, Link as LinkIcon, UserRound, Video, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { useLanguage } from '@/contexts/language-context';
import {
  enterEducationPlanRoom,
  getMyEducationPlanById,
  getMyEducationPlans,
  openEducationPlanRoom,
  type EducationPlanDetail,
  type EducationPlanInstallment,
  type MyEducationPlan,
} from '@/lib/api/education-plans';
import { redirectToPaymentGateway, requestEducationPlanInstallmentPayment } from '@/lib/api/payments';

function formatMinutes(minutes: number, locale: string) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (locale.startsWith('fa')) {
    if (h > 0 && m > 0) return `${h} ساعت و ${m} دقیقه`;
    if (h > 0) return `${h} ساعت`;
    return `${m} دقیقه`;
  }
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(value: string, locale: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

export function MyEducationPlans({ dict }: { dict: Dictionary }) {
  const { locale } = useLanguage();
  const [plans, setPlans] = useState<MyEducationPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<EducationPlanDetail | null>(null);
  const [payingInstallmentId, setPayingInstallmentId] = useState<number | null>(null);

  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyEducationPlans();
      setPlans(data);
    } catch {
      setPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const openDetail = async (planId: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await getMyEducationPlanById(planId);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  const handleEnterRoom = async (plan: MyEducationPlan) => {
    if (!plan.isActive) return;
    setEnteringId(plan.planId);
    try {
      const response = await enterEducationPlanRoom(plan.planId);
      openEducationPlanRoom(response);
    } finally {
      setEnteringId(null);
    }
  };

  const handlePayInstallment = async (installment: EducationPlanInstallment) => {
    if (installment.isPaid || payingInstallmentId) return;
    setPayingInstallmentId(installment.installmentId);
    try {
      const payment = await requestEducationPlanInstallmentPayment(installment.installmentId);
      redirectToPaymentGateway(payment.paymentUrl);
    } finally {
      setPayingInstallmentId(null);
    }
  };

  const formatAmount = (amount: number) =>
    amount.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US');

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const activeLabel = t('dashboard.educationPlans.statusActive', 'Active');
  const inactiveLabel = t('dashboard.educationPlans.statusInactive', 'Inactive');
  const planTypeLabel = t('dashboard.educationPlans.planType', 'Plan type');
  const periodLabel = t('dashboard.educationPlans.period', 'Period');
  const remainingLabel = t('dashboard.educationPlans.remaining', 'Remaining time');
  const instructorLabel = t('dashboard.educationPlans.instructor', 'Instructor');
  const enterRoomLabel = t('dashboard.educationPlans.enterRoom', 'Enter online room');
  const enteringLabel = t('dashboard.educationPlans.entering', 'Entering...');
  const currencyLabel = t('dashboard.educationPlans.currency', 'Toman');
  const paymentBlockedLabel = t(
    'dashboard.educationPlans.paymentBlocked',
    'Access paused — an installment payment is overdue.'
  );
  const installmentLabel = t('dashboard.educationPlans.installments', 'Installments');
  const payInstallmentLabel = t('dashboard.educationPlans.payInstallment', 'Pay installment');
  const paidLabel = t('dashboard.educationPlans.installmentPaid', 'Paid');
  const overdueLabel = t('dashboard.educationPlans.installmentOverdue', 'Overdue');
  const dueLabel = t('dashboard.educationPlans.installmentDue', 'Due');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t('dashboard.educationPlans.title', 'Educational Plans')}
          </CardTitle>
          <CardDescription>
            {t(
              'dashboard.educationPlans.subtitle',
              'Private tutoring plans assigned to you by your instructor.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('dashboard.educationPlans.empty', 'No educational plans have been assigned to you yet.')}
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const totalMinutes = plan.totalHours * 60;
                const progress =
                  totalMinutes > 0 ? Math.min(100, (plan.usedMinutes / totalMinutes) * 100) : 0;
                return (
                  <div
                    key={plan.planId}
                    className={`flex flex-col gap-3 rounded-lg border p-4 shadow-sm transition-shadow sm:flex-row sm:items-center sm:gap-4 ${
                      plan.isActive
                        ? 'border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/25'
                        : 'border-red-200/80 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void openDetail(plan.planId)}
                          className="text-start text-base font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                        >
                          {plan.title}
                        </button>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? activeLabel : inactiveLabel}
                        </Badge>
                        {plan.paymentBlocked ? (
                          <Badge variant="destructive">{paymentBlockedLabel}</Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          {planTypeLabel}: <span className="font-medium text-foreground">{plan.planTypeLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {periodLabel}: {formatDate(plan.startDateUtc, locale)} — {formatDate(plan.endDateUtc, locale)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {remainingLabel}:{' '}
                          <span className="font-medium text-foreground">
                            {formatMinutes(plan.remainingMinutes, locale)}
                          </span>
                        </span>
                        {plan.ownerFullName ? (
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3.5 w-3.5" />
                            {instructorLabel}:{' '}
                            <span className="font-medium text-foreground">{plan.ownerFullName}</span>
                          </span>
                        ) : null}
                        {plan.roomTitle ? (
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-3.5 w-3.5" />
                            {plan.roomTitle}
                          </span>
                        ) : null}
                      </div>
                      <Progress value={progress} className="h-1.5 max-w-md" />
                      {plan.paymentType === 'installment' && plan.installments && plan.installments.length > 0 ? (
                        <div className="mt-2 space-y-1 rounded-md border bg-background/70 p-2 text-xs">
                          <p className="font-medium">{installmentLabel}</p>
                          {plan.installments.map((installment) => (
                            <div
                              key={installment.installmentId}
                              className="flex flex-wrap items-center justify-between gap-2"
                            >
                              <span>
                                #{installment.installmentNumber} — {formatAmount(installment.amountToman)}{' '}
                                {currencyLabel} — {dueLabel}: {formatDate(installment.dueDateUtc, locale)}
                                {installment.isPaid ? (
                                  <Badge variant="secondary" className="ms-2">
                                    {paidLabel}
                                  </Badge>
                                ) : installment.isOverdue ? (
                                  <Badge variant="destructive" className="ms-2">
                                    {overdueLabel}
                                  </Badge>
                                ) : null}
                              </span>
                              {!installment.isPaid ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={payingInstallmentId === installment.installmentId}
                                  onClick={() => void handlePayInstallment(installment)}
                                >
                                  <CreditCard className="h-3.5 w-3.5 me-1" />
                                  {payInstallmentLabel}
                                </Button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!plan.isActive || enteringId === plan.planId}
                        onClick={() => void handleEnterRoom(plan)}
                        className="w-full sm:w-auto"
                      >
                        <LinkIcon className="h-3.5 w-3.5 me-1.5" />
                        {enteringId === plan.planId ? enteringLabel : enterRoomLabel}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={() => undefined}>
        <DialogContent
          className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          hideCloseButton
        >
          <DialogHeader>
            <DialogTitle>{detail?.title ?? t('dashboard.educationPlans.detailTitle', 'Plan details')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.educationPlans.detailSubtitle', 'Full details of your private education plan.')}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">{t('dashboard.educationPlans.totalHours', 'Total hours')}</p>
                  <p className="text-lg font-semibold">{detail.totalHours}h</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">{remainingLabel}</p>
                  <p className="text-lg font-semibold text-primary">
                    {formatMinutes(detail.remainingMinutes, locale)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">{t('dashboard.educationPlans.usedTime', 'Time used')}</p>
                  <p className="text-lg font-semibold">{formatMinutes(detail.usedMinutes, locale)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">
                    {t('dashboard.educationPlans.hourlyRate', 'Hourly rate')}
                  </p>
                  <p className="text-lg font-semibold">
                    {detail.hourlyRate.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')} {currencyLabel}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
                  <p className="text-muted-foreground">{t('dashboard.educationPlans.totalAmount', 'Total amount')}</p>
                  <p className="text-lg font-semibold">
                    {(detail.finalTotalCostToman ?? detail.totalCost).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}{' '}
                    {currencyLabel}
                  </p>
                  {detail.paymentType === 'installment' && detail.baseTotalCostToman ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('dashboard.educationPlans.baseAmount', 'Base amount')}:{' '}
                      {formatAmount(detail.baseTotalCostToman)} {currencyLabel}
                    </p>
                  ) : null}
                </div>
              </div>

              {detail.paymentType === 'installment' && detail.installments && detail.installments.length > 0 ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="font-medium">{installmentLabel}</p>
                  {detail.paymentBlocked ? (
                    <p className="text-sm text-destructive">{paymentBlockedLabel}</p>
                  ) : null}
                  <div className="space-y-2">
                    {detail.installments.map((installment) => (
                      <div
                        key={installment.installmentId}
                        className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="text-sm">
                          <p className="font-medium">
                            {t('dashboard.educationPlans.installmentNumber', 'Installment')} #{installment.installmentNumber}
                          </p>
                          <p className="text-muted-foreground">
                            {dueLabel}: {formatDate(installment.dueDateUtc, locale)} — {formatAmount(installment.amountToman)}{' '}
                            {currencyLabel}
                          </p>
                        </div>
                        {installment.isPaid ? (
                          <Badge variant="secondary">{paidLabel}</Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={payingInstallmentId === installment.installmentId}
                            onClick={() => void handlePayInstallment(installment)}
                          >
                            <CreditCard className="h-4 w-4 me-1.5" />
                            {payInstallmentLabel}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2 rounded-lg border p-3">
                <p className="font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {periodLabel}
                </p>
                <p className="text-muted-foreground">
                  {formatDate(detail.startDateUtc, locale)} — {formatDate(detail.endDateUtc, locale)}
                </p>
              </div>

              {detail.ownerFullName ? (
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="font-medium flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    {instructorLabel}
                  </p>
                  <p>{detail.ownerFullName}</p>
                </div>
              ) : null}

              {detail.roomTitle ? (
                <div className="space-y-1 rounded-lg border p-3">
                  <p className="font-medium flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {t('dashboard.educationPlans.room', 'Online room')}
                  </p>
                  <p>{detail.roomTitle}</p>
                </div>
              ) : null}

              {detail.description ? (
                <div className="rounded-lg border p-3">
                  <p className="mb-1 font-medium">{t('dashboard.educationPlans.description', 'Description')}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{detail.description}</p>
                </div>
              ) : null}

              <Progress
                value={
                  detail.totalHours > 0
                    ? Math.min(100, (detail.usedMinutes / (detail.totalHours * 60)) * 100)
                    : 0
                }
                className="h-2"
              />
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t('dashboard.educationPlans.detailNotFound', 'Plan details could not be loaded.')}
            </p>
          )}

          <DialogFooter>
            <Button type="button" onClick={closeDetail} className="w-full sm:w-auto">
              <X className="h-4 w-4 me-2" />
              {t('dashboard.educationPlans.close', 'Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
