'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Loader2, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import {
  getMyTeacherEarningsChart,
  getMyTeacherEarningsSummary,
  type TeacherEarningsChartPoint,
  type TeacherEarningsSummary,
} from '@/lib/api/teacher-finance';
import type { Dictionary } from '@/types';
import { formatCurrency } from './professor-format';

type Period = 'day' | 'week' | 'month' | 'year';

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export function ProfessorRevenueChart({ dict }: { dict: Dictionary }) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const localeTag = isRtl ? 'fa-IR' : 'en-US';
  const t = (key: string, fb: string) => getDictValue(dict, key, fb);
  const chartConfig = React.useMemo(
    () => ({
      net: { label: t('professorDashboard.chart.netLabel', 'Net'), color: 'hsl(var(--primary))' },
      gross: { label: t('professorDashboard.chart.grossLabel', 'Gross'), color: 'hsl(142 76% 36%)' },
    }),
    [dict]
  );

  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<Period>('month');
  const [summary, setSummary] = React.useState<TeacherEarningsSummary | null>(null);
  const [chartPoints, setChartPoints] = React.useState<TeacherEarningsChartPoint[]>([]);

  const load = React.useCallback(async (selectedPeriod: Period) => {
    setLoading(true);
    try {
      const [summaryData, chartData] = await Promise.all([
        getMyTeacherEarningsSummary(),
        getMyTeacherEarningsChart(selectedPeriod),
      ]);
      setSummary(summaryData);
      setChartPoints(chartData);
    } catch {
      setSummary(null);
      setChartPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(period);
  }, [load, period]);

  const chartData = chartPoints.map((p) => ({
    label: p.label,
    net: p.netToman,
    gross: p.grossToman,
  }));

  const currentMonthNet = summary?.netMonthToman ?? 0;
  const currentMonthGross = summary?.salesMonthGrossToman ?? 0;
  const weekNet = summary?.netWeekToman ?? 0;
  const monthChange = pctChange(currentMonthNet, weekNet > 0 ? weekNet * 4 : 0);
  const isPositive = (monthChange ?? 0) >= 0;

  return (
    <Card id="revenue" className="professor-dashboard__chart-card overflow-hidden">
      <CardHeader className="space-y-4 border-b pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
            {t('professorDashboard.chart.title', 'Revenue analysis')}
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/professor/earnings">{t('professorDashboard.chart.viewDetails', 'Full earnings')}</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[88px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className={cn('grid gap-4 sm:grid-cols-2', isRtl && 'text-right')}>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t('professorDashboard.chart.currentMonth', 'Current month (net)')}
              </p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(currentMonthNet, localeTag)}</p>
              {monthChange != null ? (
                <p
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 text-sm',
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(monthChange).toFixed(1)}%{' '}
                  {t('professorDashboard.chart.vsLastMonth', 'vs last month')}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('professorDashboard.chart.noComparison', 'No prior data to compare')}
                </p>
              )}
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                {t('professorDashboard.chart.monthGross', 'Current month (gross sales)')}
              </p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(currentMonthGross, localeTag)}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {summary?.salesCountMonth ?? 0}{' '}
                {t('professorDashboard.chart.salesCount', 'sales this month')}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="day">{t('professorDashboard.chart.periodDay', 'Day')}</TabsTrigger>
            <TabsTrigger value="week">{t('professorDashboard.chart.periodWeek', 'Week')}</TabsTrigger>
            <TabsTrigger value="month">{t('professorDashboard.chart.periodMonth', 'Month')}</TabsTrigger>
            <TabsTrigger value="year">{t('professorDashboard.chart.periodYear', 'Year')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex h-[280px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
            <p>{t('professorDashboard.chart.empty', 'No earnings recorded yet.')}</p>
            <p>{t('professorDashboard.chart.emptyHint', 'Sales from your courses will appear here.')}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="net"
                stroke="var(--color-net)"
                strokeWidth={3}
                dot={{ r: 3, fill: 'var(--color-net)' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="gross"
                stroke="var(--color-gross)"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
