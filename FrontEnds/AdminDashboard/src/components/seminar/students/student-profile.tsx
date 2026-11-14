'use client';

import { useState, useMemo, useEffect } from 'react';
import type {
  SeminarUser,
  SeminarPaymentPlan,
  SeminarClassSchedule,
  SeminarPaymentTransaction,
  SeminarPlanHistoryItem,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Edit,
  Mail,
  Phone,
  User as UserIcon,
  Wallet,
  PlusCircle,
  AlertCircle,
  History,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { ManagePlanDialog } from './manage-plan-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { useLanguage } from '@/components/language-provider';
import {
  format,
  parse,
  isPast,
  isToday,
  startOfDay,
  isEqual,
  addMonths,
  differenceInDays,
} from 'date-fns';
import { ScheduleClassDialog } from './schedule-class-dialog';
import { updateMockSeminarUser } from '@/lib/seminar-mock-data';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PaymentHistoryDialog } from './payment-history-dialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getSeminarClassStatusLabel,
  getSeminarPlanStatusLabel,
  getSeminarRoleLabel,
} from '@/lib/utils/localized-ui';

interface StudentProfileProps {
  student: SeminarUser;
}

export function StudentProfile({ student: initialStudent }: StudentProfileProps) {
  const [student, setStudent] = useState(initialStudent);
  const { t, locale } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const { toast } = useToast();
  const router = useRouter();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SeminarClassSchedule | undefined>(undefined);

  const formatDateBasedOnLocale = (dateString: string) => formatLocalizedDate(dateString, locale, t);
  const formatCurrency = (amount: number) => formatLocalizedCurrency(amount, locale, t);

  useEffect(() => {
    const checkPaymentStatus = () => {
      if (
        student.paymentPlan &&
        student.paymentPlan.status === 'Active' &&
        student.paymentPlan.paymentType === 'installment'
      ) {
        const today = new Date();
        const dueDate = new Date(student.paymentPlan.nextPaymentDue);
        const daysUntilDue = differenceInDays(dueDate, today);

        if (daysUntilDue < 0) {
          const updatedPlan = { ...student.paymentPlan, status: 'Suspended' as const };
          const updatedStudent = { ...student, paymentPlan: updatedPlan };
          updateMockSeminarUser(updatedStudent);
          setStudent(updatedStudent);
        }
      }
    };

    const interval = setInterval(checkPaymentStatus, 1000 * 60 * 60);
    checkPaymentStatus();
    return () => clearInterval(interval);
  }, [student]);

  const handleSavePlan = (plan: SeminarPaymentPlan) => {
    const confirmationDate = new Date();
    const nextPaymentDate = addMonths(confirmationDate, 1);
    const isFirstPayment = !student.paymentPlan || student.paymentPlan.paidInstallments === 0;

    const newPlanHistoryItem: SeminarPlanHistoryItem = {
      id: `plan-${Date.now()}`,
      startDate: confirmationDate.toISOString(),
      planName: plan.planName,
      totalHours: plan.totalHours,
      price: plan.price,
      status: 'Active',
    };

    let updatedPlan: SeminarPaymentPlan;
    if (isFirstPayment) {
      updatedPlan = {
        ...plan,
        nextPaymentDue:
          plan.paymentType === 'installment'
            ? nextPaymentDate.toISOString()
            : confirmationDate.toISOString(),
        status: plan.paymentConfirmed ? (plan.totalInstallments === 1 ? 'Settled' : 'Active') : 'Pending Payment',
        paidInstallments: plan.paymentConfirmed ? 1 : 0,
        planId: newPlanHistoryItem.id,
      };
    } else {
      return;
    }

    let updatedPaymentHistory = student.paymentHistory || [];
    if (updatedPlan.paymentConfirmed) {
      const newPaymentTransaction: SeminarPaymentTransaction = {
        id: `pay-${Date.now()}`,
        date: confirmationDate.toISOString(),
        planId: newPlanHistoryItem.id,
        planName: updatedPlan.planName,
        amount: updatedPlan.price / (updatedPlan.totalInstallments || 1),
        status: 'Completed',
      };
      updatedPaymentHistory = [...updatedPaymentHistory, newPaymentTransaction];
    }

    const updatedStudent: SeminarUser = {
      ...student,
      paymentPlan: updatedPlan,
      paymentHistory: updatedPaymentHistory,
      planHistory: [...(student.planHistory || []), newPlanHistoryItem],
    };

    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);
  };

  const handleClosePlan = () => {
    if (!student.paymentPlan?.planId) return;

    const updatedPlanHistory = (student.planHistory || []).map((p) =>
      p.id === student.paymentPlan?.planId
        ? { ...p, status: 'Expired' as const, endDate: new Date().toISOString() }
        : p
    );

    const updatedStudent: SeminarUser = {
      ...student,
      paymentPlan: undefined,
      planHistory: updatedPlanHistory,
    };

    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);
    toast({
      title: t('student_profile_plan_closed_title'),
      description: t('student_profile_plan_closed_description'),
    });
  };

  const handleAddPayment = () => {
    if (!student.paymentPlan?.planId) return;

    const confirmationDate = new Date();
    const nextPaymentDate = addMonths(confirmationDate, 1);
    const newPaidInstallments = student.paymentPlan.paidInstallments + 1;
    const isFinalPayment = newPaidInstallments === student.paymentPlan.totalInstallments;

    const updatedPlan: SeminarPaymentPlan = {
      ...student.paymentPlan,
      paidInstallments: newPaidInstallments,
      status: isFinalPayment ? 'Settled' : 'Active',
      nextPaymentDue: isFinalPayment
        ? student.paymentPlan.nextPaymentDue
        : nextPaymentDate.toISOString(),
    };

    const newPaymentTransaction: SeminarPaymentTransaction = {
      id: `pay-${Date.now()}`,
      date: confirmationDate.toISOString(),
      planId: student.paymentPlan.planId,
      planName: updatedPlan.planName,
      amount: updatedPlan.price / (updatedPlan.totalInstallments || 1),
      status: 'Completed',
    };

    const updatedStudent: SeminarUser = {
      ...student,
      paymentPlan: updatedPlan,
      paymentHistory: [...(student.paymentHistory || []), newPaymentTransaction],
    };

    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);

    toast({
      title: t('student_profile_payment_recorded_title'),
      description: t('student_profile_payment_recorded_description', {
        current: newPaidInstallments,
        total: updatedPlan.totalInstallments,
      }),
    });
  };

  const timeToMinutes = (time: string): number => {
    if (!time?.includes(':')) return 0;
    const [h, m] = time.split(':').map(Number);
    return Number.isNaN(h) || Number.isNaN(m) ? 0 : h * 60 + m;
  };

  const handleSaveSchedule = (newClass: SeminarClassSchedule) => {
    const existing = student.classSchedule || [];
    const isEditing = existing.some((c) => c.id === newClass.id);
    const updatedSchedule = isEditing
      ? existing.map((c) => (c.id === newClass.id ? newClass : c))
      : [...existing, newClass];

    const updatedStudent: SeminarUser = {
      ...student,
      classSchedule: updatedSchedule,
    };
    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);
    setIsScheduleDialogOpen(false);
    setSelectedClass(undefined);
  };

  const handleDeleteSchedule = (classId: string) => {
    const updatedSchedule = (student.classSchedule || []).filter((c) => c.id !== classId);
    const updatedStudent: SeminarUser = { ...student, classSchedule: updatedSchedule };
    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);
  };

  const handleToggleClassStatus = (classId: string) => {
    const updatedSchedule = (student.classSchedule || []).map((cls) =>
      cls.id === classId
        ? { ...cls, status: cls.status === 'completed' ? ('pending' as const) : ('completed' as const) }
        : cls
    );
    const updatedStudent: SeminarUser = { ...student, classSchedule: updatedSchedule };
    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);
  };

  const handleMarkDayAsCompleted = () => {
    if (!selectedDate) return;
    const dateToCompleteStr = format(selectedDate, 'yyyy-MM-dd');
    const updatedSchedule = (student.classSchedule || []).map((cls) =>
      cls.date === dateToCompleteStr ? { ...cls, status: 'completed' as const } : cls
    );
    const updatedStudent: SeminarUser = { ...student, classSchedule: updatedSchedule };
    updateMockSeminarUser(updatedStudent);
    setStudent(updatedStudent);
    toast({
      title: t('student_profile_day_completed_title'),
      description: t('student_profile_day_completed_description', { date: formatDateBasedOnLocale(dateToCompleteStr) }),
    });
  };

  const { pastDays, scheduledFutureDays, completedDays } = useMemo(() => {
    const classDays = student.classSchedule || [];
    const nextPastDays: Date[] = [];
    const nextScheduledFutureDays: Date[] = [];
    const nextCompletedDays: Date[] = [];
    const today = startOfDay(new Date());
    const uniqueDates = Array.from(new Set(classDays.map((c) => c.date)));

    uniqueDates.forEach((dateStr) => {
      if (!dateStr) return;
      const classDate = startOfDay(parse(dateStr, 'yyyy-MM-dd', new Date()));
      const classesOnDay = classDays.filter((c) => c.date === dateStr);
      const allCompleted = classesOnDay.length > 0 && classesOnDay.every((c) => c.status === 'completed');

      if (allCompleted) nextCompletedDays.push(classDate);
      else if (isPast(classDate) && !isEqual(classDate, today)) nextPastDays.push(classDate);
      else nextScheduledFutureDays.push(classDate);
    });

    return {
      pastDays: nextPastDays,
      scheduledFutureDays: nextScheduledFutureDays,
      completedDays: nextCompletedDays,
    };
  }, [student.classSchedule]);

  const selectedDayClasses = selectedDate
    ? (student.classSchedule || [])
        .filter((c) => c.date === format(selectedDate, 'yyyy-MM-dd'))
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
    : [];

  const LegendItem = ({ colorClass, label }: { colorClass: string; label: string }) => (
    <div className="flex items-center gap-2 text-xs">
      <div className={`h-3 w-3 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </div>
  );

  const isSelectedDateInPast = selectedDate ? isPast(selectedDate) && !isToday(selectedDate) : false;

  const currentPlanHistoryItem = useMemo(() => {
    if (!student.paymentPlan?.planId) return null;
    return (student.planHistory || []).find((p) => p.id === student.paymentPlan?.planId);
  }, [student.paymentPlan, student.planHistory]);

  const paymentAlert = useMemo(() => {
    if (
      !student.paymentPlan ||
      student.paymentPlan.status !== 'Active' ||
      student.paymentPlan.paymentType !== 'installment'
    ) {
      return null;
    }

    const today = new Date();
    const dueDate = new Date(student.paymentPlan.nextPaymentDue);
    const daysUntilDue = differenceInDays(dueDate, today);

    if (daysUntilDue < 0) {
      return {
        level: 'high',
        message: t('student_profile_payment_due_overdue', {
          date: formatDateBasedOnLocale(student.paymentPlan.nextPaymentDue),
        }),
      };
    }

    if (daysUntilDue <= 2) {
      return {
        level: 'medium',
        message: t('student_profile_payment_due_soon', { days: daysUntilDue }),
      };
    }

    if (daysUntilDue <= 5) {
      return {
        level: 'low',
        message: t('student_profile_payment_due_upcoming', { days: daysUntilDue }),
      };
    }

    return null;
  }, [student.paymentPlan, t]);

  const alertVariant: Record<string, string> = {
    low: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-700 dark:text-yellow-200',
    medium: 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-200',
    high: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200',
  };

  const isPlanActive = student.paymentPlan?.status === 'Active' || student.paymentPlan?.status === 'Settled';
  const isPlanSettled = student.paymentPlan?.status === 'Settled';
  const closedPlans = (student.planHistory || []).filter((p) => p.status === 'Expired');
  const selectedDateLabel = formatLocalizedDate(selectedDate, locale, t);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="mb-4 h-24 w-24">
              <AvatarImage src={student.avatar} alt={student.name} />
              <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <CardTitle>{student.name}</CardTitle>
            <CardDescription>@{student.username}</CardDescription>
            {paymentAlert && (
              <Alert
                className={cn(
                  'mt-4 text-left',
                  alertVariant[paymentAlert.level] || alertVariant.low
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('student_profile_payment_reminder_title')}</AlertTitle>
                <AlertDescription>{paymentAlert.message}</AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{student.contactNumber || t('not_available')}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{getSeminarRoleLabel(student.role, t)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" /> {t('student_profile_plan_history_title')}
            </CardTitle>
            <CardDescription>{t('student_profile_plan_history_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('comment_table_col_date')}</TableHead>
                  <TableHead>{t('student_profile_plan_column')}</TableHead>
                  <TableHead>{t('comment_table_col_status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedPlans.length > 0 ? (
                  [...closedPlans].reverse().map((plan) => (
                    <TableRow
                      key={plan.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/dashboard/seminar-students/${student.id}/history/${plan.id}`)
                      }
                    >
                      <TableCell>{formatDateBasedOnLocale(plan.endDate || plan.startDate)}</TableCell>
                      <TableCell>{plan.planName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getSeminarPlanStatusLabel(plan.status, t)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {t('student_profile_no_closed_plans')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{t('student_profile_current_plan_title')}</CardTitle>
              <CardDescription>{t('student_profile_current_plan_description')}</CardDescription>
            </div>
            <div className="flex gap-2">
              {isPlanSettled && (
                <Button onClick={handleClosePlan} variant="default" className="bg-green-600 hover:bg-green-700">
                  <XCircle className="mr-2 h-4 w-4" />
                  {t('student_profile_close_plan_button')}
                </Button>
              )}
              <Button
                onClick={() => setIsPlanDialogOpen(true)}
                variant={student.paymentPlan ? 'outline' : 'default'}
              >
                <Edit className="mr-2 h-4 w-4" />
                {student.paymentPlan ? t('student_profile_manage_plan_button') : t('student_profile_set_plan_button')}
              </Button>
            </div>
          </CardHeader>
          {student.paymentPlan ? (
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-4">
                <Wallet className="mt-1 h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('student_profile_current_plan_label')}</p>
                  <p className="font-semibold">{student.paymentPlan.planName}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="mt-1 h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('student_profile_payment_status_label')}</p>
                  <p className="font-semibold">{getSeminarPlanStatusLabel(student.paymentPlan.status, t)}</p>
                </div>
              </div>
              {student.paymentPlan.paymentType === 'installment' && (
                <div className="flex items-start gap-4">
                  <CreditCard className="mt-1 h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('student_profile_installment_progress_label')}</p>
                    <p className="font-semibold">
                      <button
                        className="text-primary underline hover:no-underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                        onClick={() => setIsPaymentHistoryOpen(true)}
                        disabled={!student.paymentPlan || student.paymentPlan.paymentType !== 'installment'}
                      >
                        {student.paymentPlan.paidInstallments}
                      </button>{' '}
                      {t('student_profile_installment_progress_value', {
                        total: student.paymentPlan.totalInstallments,
                      })}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <Clock className="mt-1 h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('student_profile_hours_remaining_label')}</p>
                  <p className="font-semibold">
                    {student.paymentPlan.totalHours
                      ? t('student_profile_hours_remaining_value', {
                          remaining: student.paymentPlan.totalHours - 5,
                          total: student.paymentPlan.totalHours,
                        })
                      : t('not_available')}
                  </p>
                </div>
              </div>
              {student.paymentPlan.status === 'Active' && student.paymentPlan.paymentType === 'installment' && (
                <div className="flex items-start gap-4">
                  <CalendarIcon className="mt-1 h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('student_profile_next_payment_due_label')}</p>
                    <p className="font-semibold">
                      {student.paymentPlan.nextPaymentDue
                        ? formatDateBasedOnLocale(student.paymentPlan.nextPaymentDue)
                        : t('not_available')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          ) : (
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <p>{t('student_profile_no_active_plan')}</p>
                <Button size="sm" className="mt-4" onClick={() => setIsPlanDialogOpen(true)}>
                  {t('student_profile_set_plan_button')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('student_profile_schedule_title')}</CardTitle>
            <CardDescription>
              {t('student_profile_schedule_description', { name: student.displayName })}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 items-start gap-8 md:grid-cols-[auto_1fr]">
            {!isPlanActive ? (
              <div className="md:col-span-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('student_profile_plan_inactive_title')}</AlertTitle>
                  <AlertDescription>
                    {t('student_profile_plan_inactive_description')}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(day) => setSelectedDate(day || startOfDay(new Date()))}
                    modifiers={{
                      past: pastDays,
                      scheduled: scheduledFutureDays,
                      completed: completedDays,
                    }}
                    modifiersClassNames={{
                      past: 'bg-gray-200/80 dark:bg-gray-700/80 text-muted-foreground',
                      scheduled: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
                      completed:
                        'bg-green-200 dark:bg-green-900/60 text-green-800 dark:text-green-100 font-bold',
                    }}
                    className="rounded-md border"
                  />
                  <div className="mt-4 w-full space-y-2 border-t pt-4">
                    <h4 className="text-sm font-medium">{t('student_profile_schedule_legend_title')}</h4>
                    <LegendItem
                      colorClass="border bg-gray-200 dark:bg-gray-700"
                      label={t('student_profile_schedule_legend_past')}
                    />
                    <LegendItem
                      colorClass="border bg-blue-100 dark:bg-blue-900/50"
                      label={t('student_profile_schedule_legend_scheduled')}
                    />
                    <LegendItem
                      colorClass="border bg-green-200 dark:bg-green-900/60"
                      label={t('student_profile_schedule_legend_completed')}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {t('student_profile_classes_for_date', { date: selectedDateLabel })}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDate && (
                        <>
                          {selectedDayClasses.length > 0 &&
                            !selectedDayClasses.every((c) => c.status === 'completed') && (
                              <Button size="sm" variant="outline" onClick={handleMarkDayAsCompleted}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('student_profile_mark_day_completed')}
                              </Button>
                            )}
                          {!isSelectedDateInPast && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedClass(undefined);
                                setIsScheduleDialogOpen(true);
                              }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              {t('student_profile_add_class_button')}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {selectedDayClasses.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDayClasses.map((cls) => (
                        <div key={cls.id} className="rounded-lg border bg-muted/50 p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{cls.className}</p>
                              <p className="text-sm text-muted-foreground">
                                {cls.startTime} - {cls.endTime}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={cls.status === 'completed' ? 'success' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => handleToggleClassStatus(cls.id)}
                              >
                                {getSeminarClassStatusLabel(cls.status, t)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedClass(cls);
                                  setIsScheduleDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {cls.description && <p className="mt-2 text-xs">{cls.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pt-8 text-center text-sm text-muted-foreground">
                      {isSelectedDateInPast
                        ? t('student_profile_no_classes_past')
                        : t('student_profile_no_classes_future')}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ManagePlanDialog
        isOpen={isPlanDialogOpen}
        onOpenChangeAction={setIsPlanDialogOpen}
        student={student}
        onSaveAction={handleSavePlan}
      />
      <ScheduleClassDialog
        isOpen={isScheduleDialogOpen}
        onOpenChangeAction={setIsScheduleDialogOpen}
        onSaveAction={handleSaveSchedule}
        onDeleteAction={handleDeleteSchedule}
        classData={selectedClass}
        selectedDate={selectedDate}
      />
      {student.paymentPlan && student.paymentHistory && currentPlanHistoryItem && (
        <PaymentHistoryDialog
          isOpen={isPaymentHistoryOpen}
          onOpenChangeAction={setIsPaymentHistoryOpen}
          transactions={student.paymentHistory.filter((p) => p.planId === student.paymentPlan?.planId)}
          studentName={student.name}
          formatDateAction={formatDateBasedOnLocale}
          onAddPaymentAction={handleAddPayment}
          canAddPayment={student.paymentPlan.status === 'Active'}
        />
      )}
    </div>
  );
}
