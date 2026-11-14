'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { getCourseDesktopAnalytics, type CourseDesktopAnalytics } from '@/lib/api/desktop-licenses';

type Props = {
  courseId: number;
  isRtl: boolean;
};

function formatWatchSeconds(seconds: number, isRtl: boolean): string {
  if (seconds <= 0) return isRtl ? '۰' : '0';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return isRtl ? `${h}س ${m}د` : `${h}h ${m}m`;
  return isRtl ? `${m} دقیقه` : `${m} min`;
}

export function DesktopLicenseAnalyticsPanel({ courseId, isRtl }: Props) {
  const [data, setData] = React.useState<CourseDesktopAnalytics | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getCourseDesktopAnalytics(courseId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const lessonChart = (data?.lessons ?? [])
    .slice()
    .sort((a, b) => b.totalWatchedSeconds - a.totalWatchedSeconds)
    .slice(0, 12)
    .map((row) => ({
      label: row.lessonTitle.length > 18 ? `${row.lessonTitle.slice(0, 18)}…` : row.lessonTitle,
      minutes: Math.round(row.totalWatchedSeconds / 60),
      viewers: row.uniqueViewerCount,
    }));

  const studentChart = (data?.students ?? [])
    .slice()
    .sort((a, b) => b.totalWatchedSeconds - a.totalWatchedSeconds)
    .slice(0, 12)
    .map((row) => ({
      label: (row.studentName ?? `#${row.userId}`).slice(0, 16),
      minutes: Math.round(row.totalWatchedSeconds / 60),
      lessons: row.lessonsTouched,
    }));

  const chartConfig = {
    minutes: {
      label: isRtl ? 'دقیقه تماشا' : 'Watch minutes',
      color: 'hsl(var(--primary))',
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || (data.lessons.length === 0 && data.students.length === 0)) {
    return (
      <p className={cn('py-8 text-center text-muted-foreground', isRtl && 'text-right')}>
        {isRtl ? 'هنوز داده تحلیلی برای این دوره ثبت نشده است.' : 'No analytics data for this course yet.'}
      </p>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRtl ? 'زمان تماشا به تفکیک درس' : 'Watch time by lesson'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lessonChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isRtl ? 'بدون داده' : 'No data'}</p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
              <BarChart data={lessonChart} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={64} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
          <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
            {(data.lessons ?? []).slice(0, 5).map((row) => (
              <li key={row.lessonId} className="flex justify-between gap-2">
                <span className="truncate">{row.lessonTitle}</span>
                <span>{formatWatchSeconds(row.totalWatchedSeconds, isRtl)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRtl ? 'زمان تماشا به تفکیک دانشجو' : 'Watch time by student'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isRtl ? 'بدون داده' : 'No data'}</p>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-[4/3] w-full">
              <BarChart data={studentChart} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={64} />
                <YAxis tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
          <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
            {(data.students ?? []).slice(0, 5).map((row) => (
              <li key={`${row.userId}-${row.enrollmentId ?? 0}`} className="flex justify-between gap-2">
                <span className="truncate">{row.studentName ?? `#${row.userId}`}</span>
                <span>{formatWatchSeconds(row.totalWatchedSeconds, isRtl)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
