'use client';

import * as React from 'react';
import { Loader2, Wallet, TrendingUp, Receipt, ArrowDownToLine } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import { getApiErrorMessage } from '@/lib/api/client';
import { formatCurrency } from '@/components/professor/dashboard/professor-format';
import {
  getMyTeacherCourseSales,
  getMyTeacherEarningsChart,
  getMyTeacherEarningsSummary,
  getMyTeacherPayouts,
  requestTeacherPayout,
  type TeacherCourseSaleRow,
  type TeacherEarningsChartPoint,
  type TeacherEarningsSummary,
  type TeacherPayoutRow,
} from '@/lib/api/teacher-finance';
import { ProfessorPayoutBankAlert } from '@/components/professor/profile/professor-payout-bank-tab';
import type { Dictionary } from '@/types';

type Props = { dict: Dictionary };

type Period = 'day' | 'week' | 'month' | 'year';

const chartConfig = {
  gross: { label: 'Gross', color: 'hsl(var(--primary))' },
  net: { label: 'Net', color: 'hsl(142 76% 36%)' },
};

function StatCard({
  title,
  gross,
  net,
  tax,
  count,
  localeTag,
}: {
  title: string;
  gross: number;
  net: number;
  tax: number;
  count: number;
  localeTag: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-bold">{formatCurrency(gross, localeTag)}</p>
        <p className="text-xs text-muted-foreground">
          {formatCurrency(net, localeTag)} net · {formatCurrency(tax, localeTag)} tax · {count} sales
        </p>
      </CardContent>
    </Card>
  );
}

export function ProfessorEarningsPageClient({ dict }: Props) {
  const { toast } = useToast();
  const { locale, dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const localeTag = locale === 'fa' ? 'fa-IR' : 'en-US';
  const t = React.useCallback((key: string, fb: string) => getDictValue(dict, key, fb), [dict]);

  const [loading, setLoading] = React.useState(true);
  const [payoutBusy, setPayoutBusy] = React.useState(false);
  const [summary, setSummary] = React.useState<TeacherEarningsSummary | null>(null);
  const [chart, setChart] = React.useState<TeacherEarningsChartPoint[]>([]);
  const [sales, setSales] = React.useState<TeacherCourseSaleRow[]>([]);
  const [payouts, setPayouts] = React.useState<TeacherPayoutRow[]>([]);
  const [period, setPeriod] = React.useState<Period>('month');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, chartData, salesData, payoutsData] = await Promise.all([
        getMyTeacherEarningsSummary(),
        getMyTeacherEarningsChart(period),
        getMyTeacherCourseSales(50),
        getMyTeacherPayouts(20),
      ]);
      setSummary(summaryData);
      setChart(chartData);
      setSales(salesData);
      setPayouts(payoutsData);
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.earnings.loadError', 'Could not load earnings')),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [period, toast, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handlePayout = async () => {
    if (!summary?.canRequestPayout) return;
    setPayoutBusy(true);
    try {
      await requestTeacherPayout();
      toast({ title: t('professorDashboard.earnings.payoutTransferred', 'Payout transferred to your bank account.') });
      await load();
    } catch (error) {
      toast({
        title: getApiErrorMessage(error, t('professorDashboard.earnings.payoutError', 'Payout request failed')),
        variant: 'destructive',
      });
    } finally {
      setPayoutBusy(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = summary;

  return (
    <div className="space-y-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <h1 className="font-headline text-2xl font-bold md:text-3xl">
          {t('professorDashboard.earnings.pageTitle', 'Earnings & analytics')}
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          {t(
            'professorDashboard.earnings.pageDescription',
            'Track course sales, net income after tax, and request payouts from your wallet.'
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('professorDashboard.earnings.availableBalance', 'Available balance')}
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(s?.availableBalanceToman ?? 0, localeTag)}</p>
            {(s?.reservedBalanceToman ?? 0) > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(s?.reservedBalanceToman ?? 0, localeTag)}{' '}
                {t('professorDashboard.earnings.reserved', 'reserved for payout')}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('professorDashboard.earnings.totalGross', 'Total gross sales')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(s?.totalGrossSalesToman ?? 0, localeTag)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {s?.totalSaleCount ?? 0} {t('professorDashboard.earnings.transactions', 'transactions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('professorDashboard.earnings.totalNet', 'Total net earned')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(s?.totalNetEarnedToman ?? 0, localeTag)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('professorDashboard.earnings.afterTax', 'After')} {s?.incomeTaxPercent ?? 5}%{' '}
              {t('professorDashboard.earnings.tax', 'tax')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('professorDashboard.earnings.totalWithdrawn', 'Total withdrawn')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(s?.totalWithdrawnToman ?? 0, localeTag)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('professorDashboard.earnings.taxWithheld', 'Tax withheld')}:{' '}
              {formatCurrency(s?.totalTaxWithheldToman ?? 0, localeTag)}
            </p>
          </CardContent>
        </Card>
      </div>

      {!s?.hasPayoutBankInfo ? <ProfessorPayoutBankAlert dict={dict} /> : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('professorDashboard.earnings.requestPayout', 'Request payout')}</CardTitle>
            <CardDescription>
              {t(
                'professorDashboard.earnings.payoutCooldown',
                'You can request a payout once every 24 hours from your available balance.'
              )}
            </CardDescription>
          </div>
          <Button
            className="gap-2"
            disabled={!s?.canRequestPayout || payoutBusy}
            onClick={() => void handlePayout()}
          >
            {payoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
            {t('professorDashboard.earnings.withdrawAll', 'Withdraw available balance')}
          </Button>
        </CardHeader>
        {s?.nextPayoutEligibleAtUtc ? (
          <CardContent>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t('professorDashboard.earnings.nextPayoutAt', 'Next payout available after')}:{' '}
              {new Date(s.nextPayoutEligibleAtUtc).toLocaleString(localeTag)}
            </p>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t('professorDashboard.earnings.today', 'Today')}
          gross={s?.salesTodayGrossToman ?? 0}
          net={s?.netTodayToman ?? 0}
          tax={s?.taxTodayToman ?? 0}
          count={s?.salesCountToday ?? 0}
          localeTag={localeTag}
        />
        <StatCard
          title={t('professorDashboard.earnings.thisWeek', 'This week')}
          gross={s?.salesWeekGrossToman ?? 0}
          net={s?.netWeekToman ?? 0}
          tax={s?.taxWeekToman ?? 0}
          count={s?.salesCountWeek ?? 0}
          localeTag={localeTag}
        />
        <StatCard
          title={t('professorDashboard.earnings.thisMonth', 'This month')}
          gross={s?.salesMonthGrossToman ?? 0}
          net={s?.netMonthToman ?? 0}
          tax={s?.taxMonthToman ?? 0}
          count={s?.salesCountMonth ?? 0}
          localeTag={localeTag}
        />
        <StatCard
          title={t('professorDashboard.earnings.thisYear', 'This year')}
          gross={s?.salesYearGrossToman ?? 0}
          net={s?.netYearToman ?? 0}
          tax={s?.taxYearToman ?? 0}
          count={s?.salesCountYear ?? 0}
          localeTag={localeTag}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t('professorDashboard.earnings.chartTitle', 'Revenue trend')}</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="day">{t('professorDashboard.earnings.periodDay', 'Day')}</TabsTrigger>
              <TabsTrigger value="week">{t('professorDashboard.earnings.periodWeek', 'Week')}</TabsTrigger>
              <TabsTrigger value="month">{t('professorDashboard.earnings.periodMonth', 'Month')}</TabsTrigger>
              <TabsTrigger value="year">{t('professorDashboard.earnings.periodYear', 'Year')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chart} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="grossToman" stroke="var(--color-gross)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netToman" stroke="var(--color-net)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('professorDashboard.earnings.recentSales', 'Recent course sales')}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('professorDashboard.earnings.noSales', 'No course sales recorded yet.')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('professorDashboard.earnings.course', 'Course')}</TableHead>
                  <TableHead>{t('professorDashboard.earnings.date', 'Date')}</TableHead>
                  <TableHead>{t('professorDashboard.earnings.gross', 'Gross')}</TableHead>
                  <TableHead>{t('professorDashboard.earnings.taxCol', 'Tax')}</TableHead>
                  <TableHead>{t('professorDashboard.earnings.netCol', 'Net')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.courseTitle}</TableCell>
                    <TableCell>{new Date(row.soldAtUtc).toLocaleString(localeTag)}</TableCell>
                    <TableCell>{formatCurrency(row.grossAmountToman, localeTag)}</TableCell>
                    <TableCell>{formatCurrency(row.taxAmountToman, localeTag)}</TableCell>
                    <TableCell>{formatCurrency(row.netAmountToman, localeTag)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('professorDashboard.earnings.payoutHistory', 'Payout history')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('professorDashboard.earnings.noPayouts', 'No payout requests yet.')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('professorDashboard.earnings.date', 'Date')}</TableHead>
                  <TableHead>{t('professorDashboard.earnings.amount', 'Amount')}</TableHead>
                  <TableHead>{t('professorDashboard.earnings.status', 'Status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.requestedAtUtc).toLocaleString(localeTag)}</TableCell>
                    <TableCell>{formatCurrency(row.amountToman, localeTag)}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'paid' ? 'default' : row.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
