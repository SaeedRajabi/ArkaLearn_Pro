'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useLanguage } from '@/components/language-provider';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardMonthlyEnrollment } from '@/services/dashboard-service';
import { formatLocalizedNumber, getIntlLocale } from '@/lib/utils/localized-ui';

type Point = { label: string; enrollments: number };

function toData(rows: DashboardMonthlyEnrollment[], locale: string): Point[] {
  return rows.map((r) => ({
    label: new Intl.DateTimeFormat(getIntlLocale(locale), {
      month: 'short',
      year: '2-digit',
    }).format(new Date(Date.UTC(r.year, r.month - 1, 1))),
    enrollments: r.count,
  }));
}

interface EnrollmentChartProps {
  monthlyEnrollments: DashboardMonthlyEnrollment[];
  periodTotal: number;
  loading?: boolean;
}

export function EnrollmentChart({ monthlyEnrollments, periodTotal, loading }: EnrollmentChartProps) {
  const { t, locale } = useLanguage();
  const data = toData(monthlyEnrollments, locale);

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle>{t('enrollmentChart_title')}</CardTitle>
        <CardDescription>{t('enrollmentChart_description')}</CardDescription>
        {loading ? (
          <Skeleton className="h-5 w-40 mt-2" />
        ) : (
          <p className="text-sm font-semibold text-foreground pt-1">
            {t('dashboard_enrollment_period_total')}: {formatLocalizedNumber(periodTotal, locale)}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full min-h-[260px] md:min-h-[300px]">
          {loading ? (
            <Skeleton className="h-[260px] w-full rounded-lg md:h-[300px]" />
          ) : data.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              {t('dashboard_enrollment_empty')}
            </div>
          ) : (
            <ChartContainer
              config={{
                enrollments: {
                  label: t('enrollmentChart_label'),
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-full w-full min-h-[260px] md:min-h-[300px]"
            >
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={locale === 'fa' ? 0 : -25}
                  textAnchor={locale === 'fa' ? 'middle' : 'end'}
                  height={locale === 'fa' ? 36 : 52}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
