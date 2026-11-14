'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  Trash2,
  User,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  deleteProfessorEducationPlan,
  getProfessorEducationPlanById,
  type ProfessorEducationPlan,
} from '@/lib/api/professor-education-plans';
import { openProfessorRoom } from '@/lib/api/professor-rooms';
import { ProfessorPlanFormDialog } from '@/components/professor/education/professor-plan-form-dialog';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

function formatDate(value: string, locale: string) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

export function ProfessorEducationPlanDetailPageClient({ dict }: Props) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const planId = Number(params?.id);
  const [plan, setPlan] = React.useState<ProfessorEducationPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [entering, setEntering] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!planId || Number.isNaN(planId)) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getProfessorEducationPlanById(planId);
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleEnterRoom = async () => {
    if (!plan?.roomId) return;
    setEntering(true);
    try {
      await openProfessorRoom({
        roomId: plan.roomId,
        slug: plan.roomSlug,
      });
    } catch (error) {
      toast({
        title: t('professorDashboard.educationPlans.enterRoomFailed', isRtl ? 'ورود به اتاق انجام نشد' : 'Could not enter room'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    } finally {
      setEntering(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    const confirmed = window.confirm(
      t('professorDashboard.educationPlans.deleteConfirm', isRtl ? 'این پلن حذف شود؟' : 'Delete this plan?')
    );
    if (!confirmed) return;
    try {
      await deleteProfessorEducationPlan(plan.id);
      toast({
        title: t('professorDashboard.educationPlans.deleted', isRtl ? 'پلن حذف شد' : 'Plan deleted'),
      });
      router.push('/professor/education-plans');
    } catch (error) {
      toast({
        title: t('professorDashboard.educationPlans.deleteFailed', isRtl ? 'حذف انجام نشد' : 'Delete failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          {t('professorDashboard.educationPlans.notFound', isRtl ? 'پلن یافت نشد.' : 'Plan not found.')}
        </p>
        <Button asChild variant="outline">
          <Link href="/professor/education-plans">
            {t('professorDashboard.educationPlans.backToList', isRtl ? 'بازگشت به لیست' : 'Back to list')}
          </Link>
        </Button>
      </div>
    );
  }

  const totalMinutes = plan.totalHours * 60;
  const progress = totalMinutes > 0 ? Math.min(100, (plan.usedMinutes / totalMinutes) * 100) : 0;
  const isActive = plan.remainingMinutes > 0;

  return (
    <div className={cn('space-y-6', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/professor/education-plans">
            <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
            {t('professorDashboard.educationPlans.backToList', isRtl ? 'بازگشت' : 'Back')}
          </Link>
        </Button>
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive
            ? t('professorDashboard.educationPlans.active', isRtl ? 'فعال' : 'Active')
            : t('professorDashboard.educationPlans.inactive', isRtl ? 'تمام‌شده' : 'Completed')}
        </Badge>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          {plan.description ? <p className="mt-2 max-w-2xl text-muted-foreground">{plan.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" disabled={entering || !plan.roomId} onClick={() => void handleEnterRoom()}>
            {entering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            {t('professorDashboard.educationPlans.enterRoom', isRtl ? 'ورود به اتاق' : 'Enter room')}
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            {t('professorDashboard.educationPlans.edit', isRtl ? 'ویرایش' : 'Edit')}
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('professorDashboard.educationPlans.studentLabel', isRtl ? 'دانشجو' : 'Student')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              {plan.studentFullName || plan.studentUserName || '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('professorDashboard.educationPlans.roomLabel', isRtl ? 'اتاق آنلاین' : 'Online room')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-primary" />
              {plan.roomTitle || '—'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('professorDashboard.educationPlans.period', isRtl ? 'بازه زمانی' : 'Period')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <CalendarDays className="h-5 w-5 text-primary" />
              {formatDate(plan.startDateUtc, locale)} — {formatDate(plan.endDateUtc, locale)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            {t('professorDashboard.educationPlans.timeUsage', isRtl ? 'مصرف زمان آموزشی' : 'Teaching time usage')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold">{plan.totalHours}h</p>
              <p className="text-xs text-muted-foreground">
                {t('professorDashboard.educationPlans.totalHours', isRtl ? 'کل ساعات' : 'Total hours')}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold">{plan.usedHours}h</p>
              <p className="text-xs text-muted-foreground">
                {t('professorDashboard.educationPlans.used', isRtl ? 'مصرف‌شده' : 'Used')}
              </p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{plan.remainingHours}h</p>
              <p className="text-xs text-muted-foreground">
                {t('professorDashboard.educationPlans.remaining', isRtl ? 'باقی‌مانده' : 'Remaining')}
              </p>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {t('professorDashboard.educationPlans.hourlyRate', isRtl ? 'نرخ ساعتی' : 'Hourly rate')}:{' '}
            {plan.hourlyRate.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')} —{' '}
            {t('professorDashboard.educationPlans.totalCost', isRtl ? 'مبلغ کل' : 'Total')}:{' '}
            {plan.totalCost.toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}
          </p>
        </CardContent>
      </Card>

      <ProfessorPlanFormDialog dict={dict} open={editOpen} onOpenChange={setEditOpen} plan={plan} onSaved={load} />
    </div>
  );
}
