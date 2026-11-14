'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Loader2,
  PlusCircle,
  Search,
  Trash2,
  User,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  deleteProfessorEducationPlan,
  searchProfessorEducationPlans,
  type ProfessorEducationPlan,
} from '@/lib/api/professor-education-plans';
import { ProfessorPlanFormDialog } from '@/components/professor/education/professor-plan-form-dialog';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

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

function PlanCard({
  plan,
  locale,
  isRtl,
  t,
  onEdit,
  onDelete,
}: {
  plan: ProfessorEducationPlan;
  locale: string;
  isRtl: boolean;
  t: (key: string, fb: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const totalMinutes = plan.totalHours * 60;
  const progress = totalMinutes > 0 ? Math.min(100, (plan.usedMinutes / totalMinutes) * 100) : 0;
  const isActive = plan.remainingMinutes > 0;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg leading-snug">
              <Link href={`/professor/education-plans/${plan.id}`} className="hover:text-primary hover:underline">
                {plan.title}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {plan.studentFullName || plan.studentUserName || '—'}
              </span>
              <span className="text-muted-foreground/50">•</span>
              <span className="inline-flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                {plan.roomTitle || '—'}
              </span>
            </CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive
              ? t('professorDashboard.educationPlans.active', isRtl ? 'فعال' : 'Active')
              : t('professorDashboard.educationPlans.inactive', isRtl ? 'تمام‌شده' : 'Completed')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>
              {formatDate(plan.startDateUtc, locale)} — {formatDate(plan.endDateUtc, locale)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {plan.remainingHours}h {t('professorDashboard.educationPlans.remaining', isRtl ? 'باقی‌مانده' : 'left')} /{' '}
              {plan.totalHours}h
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('professorDashboard.educationPlans.usage', isRtl ? 'مصرف زمان' : 'Time used')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/professor/education-plans/${plan.id}`}>
              {t('professorDashboard.educationPlans.viewDetails', isRtl ? 'جزئیات' : 'Details')}
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            {t('professorDashboard.educationPlans.edit', isRtl ? 'ویرایش' : 'Edit')}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfessorEducationPlansPageClient({ dict }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);

  const [plans, setPlans] = React.useState<ProfessorEducationPlan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<ProfessorEducationPlan | null>(null);

  const load = React.useCallback(async () => {
    const ownerUserId = Number(user?.id);
    if (!ownerUserId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchProfessorEducationPlans({
        ownerUserId,
        inputValue: search,
        pageSize: 100,
      });
      setPlans(res.plans);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [search, user?.id]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleDelete = async (plan: ProfessorEducationPlan) => {
    const confirmed = window.confirm(
      t('professorDashboard.educationPlans.deleteConfirm', isRtl ? 'این پلن حذف شود؟' : 'Delete this plan?')
    );
    if (!confirmed) return;
    try {
      await deleteProfessorEducationPlan(plan.id);
      toast({
        title: t('professorDashboard.educationPlans.deleted', isRtl ? 'پلن حذف شد' : 'Plan deleted'),
      });
      void load();
    } catch (error) {
      toast({
        title: t('professorDashboard.educationPlans.deleteFailed', isRtl ? 'حذف انجام نشد' : 'Delete failed'),
        description: getApiErrorMessage(error, ''),
        variant: 'destructive',
      });
    }
  };

  const title = t('professorDashboard.menu.educationPlans', isRtl ? 'پلن‌های آموزشی' : 'Education plans');
  const subtitle = t(
    'professorDashboard.educationPlans.subtitle',
    isRtl
      ? 'پلن‌های خصوصی با اتاق آنلاین و ساعات آموزشی برای دانشجویان خود ایجاد کنید.'
      : 'Create private teaching plans with online rooms and allocated hours for your students.'
  );

  return (
    <div className={cn('space-y-6', isRtl && 'text-right')} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditingPlan(null);
            setDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4" />
          {t('professorDashboard.educationPlans.addPlan', isRtl ? 'پلن جدید' : 'New plan')}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className={cn('absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground', isRtl ? 'right-3' : 'left-3')} />
          <Input
            className={isRtl ? 'pr-10' : 'pl-10'}
            placeholder={t('professorDashboard.educationPlans.search', isRtl ? 'جستجو…' : 'Search…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" asChild>
          <Link href="/professor/online-rooms">
            {t('professorDashboard.educationPlans.manageRooms', isRtl ? 'مدیریت اتاق‌ها' : 'Manage rooms')}
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">
                {t('professorDashboard.educationPlans.empty', isRtl ? 'هنوز پلنی ایجاد نشده است.' : 'No plans yet.')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'professorDashboard.educationPlans.emptyHint',
                  isRtl
                    ? 'ابتدا دانشجو و اتاق آنلاین بسازید، سپس پلن آموزشی تعریف کنید.'
                    : 'Create a student and online room first, then add an education plan.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/professor/online-rooms">
                  {t('professorDashboard.menu.onlineRooms', isRtl ? 'اتاق‌های آنلاین' : 'Online rooms')}
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setEditingPlan(null);
                  setDialogOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4" />
                {t('professorDashboard.educationPlans.addPlan', isRtl ? 'پلن جدید' : 'New plan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              locale={locale}
              isRtl={isRtl}
              t={t}
              onEdit={() => {
                setEditingPlan(plan);
                setDialogOpen(true);
              }}
              onDelete={() => void handleDelete(plan)}
            />
          ))}
        </div>
      )}

      <ProfessorPlanFormDialog
        dict={dict}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSaved={load}
      />
    </div>
  );
}
