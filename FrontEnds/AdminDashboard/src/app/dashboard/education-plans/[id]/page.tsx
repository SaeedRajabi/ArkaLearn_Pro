'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Edit,
  GraduationCap,
  MoreVertical,
  User,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import type { TrainingPlan } from '@/lib/types';
import { deleteTrainingPlan, getTrainingPlanById } from '@/services/training-plan-service';
import { PlanFormDialog } from '../components/plan-form-dialog';
import { formatAdminDate } from '@/lib/utils/localized-dates';

function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function EducationPlanDetailsPage() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const planId = Number(params.id);
  const [plan, setPlan] = useState<TrainingPlan | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    const data = await getTrainingPlanById(planId, true);
    setPlan(data);
  }, [planId]);

  useEffect(() => {
    if (!Number.isFinite(planId)) {
      setPlan(null);
      return;
    }
    void load();
  }, [planId, load]);

  if (plan === undefined) {
    return <p className="p-6 text-muted-foreground">{t('loading')}</p>;
  }
  if (plan === null) notFound();

  const totalMinutes = plan.totalHours * 60;
  const usedMinutes = plan.usedMinutes ?? 0;
  const remainingMinutes = plan.remainingMinutes ?? Math.max(0, totalMinutes - usedMinutes);
  const progress = totalMinutes > 0 ? Math.min(100, (usedMinutes / totalMinutes) * 100) : 0;

  const handleDelete = async () => {
    if (!window.confirm(t('education_plan_delete_confirm'))) return;
    try {
      await deleteTrainingPlan(planId);
      toast({ title: t('plan_deleted_title') });
      router.push('/dashboard/education-plans');
    } catch {
      toast({ variant: 'destructive', title: t('validation_error_title'), description: t('toast_error_description') });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/dashboard/education-plans">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{plan.title}</h1>
              <p className="text-sm text-muted-foreground">{t('education_plan_details_subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('actions_edit')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete()}>
                  {t('actions_delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {t('education_plan_student_card_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-base">{plan.studentFullName ?? '—'}</p>
              <p className="text-muted-foreground">
                {t('room_details_col_username')}: {plan.studentUserName ?? '—'}
              </p>
              {plan.managedRoomStudentId ? (
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href="/dashboard/students">{t('education_plan_view_student_catalog')}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5" />
                {t('education_plan_room_card_title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-base">{plan.roomTitle ?? '—'}</p>
              {plan.roomSlug || plan.roomId ? (
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={`/room/${plan.roomSlug || plan.roomId}`} target="_blank">
                    {t('rooms_dashboard_open_room_button')}
                  </Link>
                </Button>
              ) : null}
              {plan.roomId ? (
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={`/dashboard/rooms/${plan.roomId}`}>{t('room_details_details_button')}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('education_plan_hours_card_title')}
            </CardTitle>
            <CardDescription>{t('education_plan_hours_card_description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress} className="h-3" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t('plan_details_total_hours')}</p>
                <p className="text-2xl font-bold">{plan.totalHours}h</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t('education_plan_used_time')}</p>
                <p className="text-2xl font-bold">{formatMinutes(usedMinutes)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t('education_plan_remaining_hours')}</p>
                <p className="text-2xl font-bold text-primary">{formatMinutes(remainingMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{t('plan_details_hourly_rate')}</p>
                <p className="text-muted-foreground">{plan.hourlyRate.toLocaleString()} {t('currency_toman')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{t('planTable_col_total_amount')}</p>
                <p className="text-muted-foreground">
                  {(plan.baseTotalCostToman ?? plan.totalAmount).toLocaleString()} {t('currency_toman')}
                </p>
                {plan.paymentType === 'installment' && plan.finalTotalCostToman ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('education_plan_final_amount')}: {plan.finalTotalCostToman.toLocaleString()} {t('currency_toman')}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{t('education_plan_period')}</p>
                <p className="text-muted-foreground text-sm">
                  {plan.startDateUtc ? formatAdminDate(plan.startDateUtc, locale) : '—'} —{' '}
                  {plan.endDateUtc ? formatAdminDate(plan.endDateUtc, locale) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {plan.description ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('plan_details_description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{plan.description}</p>
            </CardContent>
          </Card>
        ) : null}

        {plan.paymentType === 'installment' && plan.installments && plan.installments.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('education_plan_payment_installment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {plan.installments.map((installment) => (
                <div key={installment.installmentId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                  <span>
                    {t('education_plan_installment_label', { number: installment.installmentNumber })} —{' '}
                    {installment.amountToman.toLocaleString()} {t('currency_toman')} —{' '}
                    {installment.dueDateUtc ? formatAdminDate(installment.dueDateUtc, locale) : '—'}
                  </span>
                  <span className={installment.isPaid ? 'text-emerald-600' : 'text-muted-foreground'}>
                    {installment.isPaid ? t('education_plan_installment_paid') : t('education_plan_installment_due_date')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <PlanFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        plan={plan}
        onSaved={async () => {
          await load();
          router.refresh();
        }}
      />
    </>
  );
}
