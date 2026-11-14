'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  SeminarUser,
  SeminarPlanHistoryItem,
  SeminarPaymentTransaction,
  SeminarClassSchedule,
} from '@/lib/types';
import {
  BarChart,
  Calendar,
  Check,
  Clock,
  DollarSign,
  List,
  User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import {
  formatLocalizedCurrency,
  formatLocalizedDate,
  getSeminarClassStatusLabel,
  getSeminarPaymentStatusLabel,
  getSeminarPlanStatusLabel,
} from '@/lib/utils/localized-ui';

interface PlanHistoryDetailsProps {
  student: SeminarUser;
  plan: SeminarPlanHistoryItem;
  payments: SeminarPaymentTransaction[];
  classes: SeminarClassSchedule[];
}

export function PlanHistoryDetails({
  student,
  plan,
  payments,
  classes,
}: PlanHistoryDetailsProps) {
  const { t, locale } = useLanguage();
  const formatDateBasedOnLocale = (dateString: string) => {
    return formatLocalizedDate(dateString, locale, t);
  };

  const formatCurrency = (amount: number) => {
    return formatLocalizedCurrency(amount, locale, t);
  };

  const totalClasses = classes.length;
  const attendedClasses = classes.filter((c) => c.status === 'completed').length;
  const attendanceRate =
    totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  const growthData = classes
    .map((_, index) => ({
      name: t('schedule_class_label', { index: index + 1 }),
      growth: 50 + Math.random() * 50,
    }))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/seminar-students/${student.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            {t('plan_history_details_title')}
          </h1>
          <p className="text-muted-foreground">
            {t('plan_history_details_description', {
              studentName: student.name,
              planName: plan.planName,
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('plan_summary_title')}</CardTitle>
            <CardDescription>{plan.planName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>{t('plan_summary_student', { name: student.name })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {t('plan_summary_active_period', {
                  startDate: formatDateBasedOnLocale(plan.startDate),
                  endDate: formatDateBasedOnLocale(plan.endDate || ''),
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{t('plan_summary_total_hours', { hours: plan.totalHours })}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>{t('plan_summary_plan_price', { amount: formatCurrency(plan.price) })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span>
                {t('plan_summary_status')}{' '}
                <Badge variant="secondary">{getSeminarPlanStatusLabel(plan.status, t)}</Badge>
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('plan_performance_overview_title')}</CardTitle>
            <CardDescription>
              {t('plan_performance_overview_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">{t('plan_class_attendance')}</h4>
              <div className="text-4xl font-bold">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {t('plan_classes_attended', {
                  attended: attendedClasses,
                  total: totalClasses,
                })}
              </p>
            </div>
            <div className="h-[150px]">
              <ChartContainer
                config={{
                  growth: { label: t('plan_growth_label'), color: 'hsl(var(--primary))' },
                }}
              >
                <RechartsBarChart data={growthData} accessibilityLayer>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={10}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" hideLabel />}
                  />
                  <Bar dataKey="growth" fill="var(--color-growth)" radius={4} />
                </RechartsBarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              {t('payment_history_section_title')}
            </CardTitle>
            <CardDescription>{t('payment_history_section_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('comment_table_col_date')}</TableHead>
                  <TableHead>{t('orders_table_col_amount')}</TableHead>
                  <TableHead>{t('comment_table_col_status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDateBasedOnLocale(payment.date)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="success">{getSeminarPaymentStatusLabel(payment.status, t)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      {t('plan_no_payments')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <List className="mr-2 h-5 w-5" />
              {t('plan_class_log_title')}
            </CardTitle>
            <CardDescription>
              {t('plan_class_log_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('comment_table_col_date')}</TableHead>
                  <TableHead>{t('schedule_class_name_label')}</TableHead>
                  <TableHead>{t('comment_table_col_status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>{formatDateBasedOnLocale(cls.date)}</TableCell>
                      <TableCell>{cls.className}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cls.status === 'completed' ? 'success' : 'secondary'
                          }
                        >
                          {getSeminarClassStatusLabel(cls.status, t)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      {t('plan_no_classes')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
