'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
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
import type { DashboardMonthlySales } from '@/services/dashboard-service';
import {
  formatLocalizedCurrency,
  getIntlLocale,
} from '@/lib/utils/localized-ui';

type ChartPoint = { label: string; sales: number };

function toChartData(rows: DashboardMonthlySales[], locale: string): ChartPoint[] {
  return rows.map((r) => ({
    label: new Intl.DateTimeFormat(getIntlLocale(locale), {
      month: 'short',
      year: '2-digit',
    }).format(new Date(Date.UTC(r.year, r.month - 1, 1))),
    sales: r.totalPaid,
  }));
}

interface SalesChartProps {
  monthlySales: DashboardMonthlySales[];
  periodTotal: number;
  loading?: boolean;
}

export function SalesChart({ monthlySales, periodTotal, loading }: SalesChartProps) {
  const { t, locale } = useLanguage();
  const chartData = toChartData(monthlySales, locale);
  const maxVal = Math.max(1, ...chartData.map((d) => d.sales));

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle>{t('salesChart_title')}</CardTitle>
        <CardDescription>{t('salesChart_description')}</CardDescription>
        {loading ? (
          <Skeleton className="h-5 w-48 mt-2" />
        ) : (
          <p className="text-sm font-semibold text-foreground pt-1">
            {t('dashboard_sales_period_total')}:{' '}
            {formatLocalizedCurrency(periodTotal, locale, t)}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="w-full min-h-[220px] xs:min-h-[260px] md:min-h-[300px] xl:min-h-[320px] px-1">
          {loading ? (
            <Skeleton className="h-[220px] w-full rounded-lg xs:h-[260px] md:h-[300px]" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              {t('dashboard_sales_empty')}
            </div>
          ) : (
            <ChartContainer
              config={{
                sales: {
                  label: t('salesChart_label'),
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-full w-full min-h-[220px]"
            >
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={locale === 'fa' ? 0 : -25}
                  textAnchor={locale === 'fa' ? 'middle' : 'end'}
                  height={locale === 'fa' ? 32 : 48}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={locale === 'fa' ? 56 : 48}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(getIntlLocale(locale), {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(Number(value))
                  }
                  domain={[0, maxVal * 1.05]}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) =>
                        typeof value === 'number'
                          ? formatLocalizedCurrency(value, locale, t)
                          : String(value ?? '')
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--color-sales)"
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
