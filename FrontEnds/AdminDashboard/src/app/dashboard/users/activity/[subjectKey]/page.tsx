'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { getUserActivityTimeline, type UserActivityTimeline } from '@/services/user-activity-api.service';
import { UserActivityTimeline as UserActivityTimelineView } from '../components/user-activity-timeline';

function toUtcIsoFromLocalDate(dateValue: string, timeValue?: string) {
  if (!dateValue) return undefined;
  const time = timeValue && timeValue.length > 0 ? timeValue : '00:00';
  const local = new Date(`${dateValue}T${time}:00`);
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
}

export default function UserActivityDetailPage() {
  const params = useParams<{ subjectKey: string }>();
  const subjectKey = decodeURIComponent(params.subjectKey ?? '');
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const [dateValue, setDateValue] = React.useState('');
  const [timeFrom, setTimeFrom] = React.useState('');
  const [timeTo, setTimeTo] = React.useState('');
  const [appliedFrom, setAppliedFrom] = React.useState<string | undefined>();
  const [appliedTo, setAppliedTo] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(true);
  const [timeline, setTimeline] = React.useState<UserActivityTimeline | null>(null);

  const loadTimeline = React.useCallback(
    (fromUtc?: string, toUtc?: string) => {
      setLoading(true);
      getUserActivityTimeline({ subjectKey, fromUtc, toUtc })
        .then((data) => setTimeline(data))
        .catch(() => {
          toast({ title: t('user_activity_timeline_failed'), variant: 'destructive' });
          setTimeline(null);
        })
        .finally(() => setLoading(false));
    },
    [subjectKey, t, toast]
  );

  React.useEffect(() => {
    loadTimeline(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo, loadTimeline]);

  React.useEffect(() => {
    if (!dateValue && timeline?.selectedDayUtc) {
      setDateValue(timeline.selectedDayUtc.slice(0, 10));
    }
  }, [timeline?.selectedDayUtc, dateValue]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const fromUtc = toUtcIsoFromLocalDate(dateValue, timeFrom || '00:00');
    const toUtc = toUtcIsoFromLocalDate(dateValue, timeTo || '23:59');
    setAppliedFrom(fromUtc);
    setAppliedTo(toUtc ?? (fromUtc ? new Date(new Date(fromUtc).setHours(23, 59, 59, 999)).toISOString() : undefined));
  };

  const handleResetFilter = () => {
    setDateValue('');
    setTimeFrom('');
    setTimeTo('');
    setAppliedFrom(undefined);
    setAppliedTo(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ms-2 h-8 px-2">
          <Link href="/dashboard/users/activity">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('user_activity_back')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
          {timeline?.displayName || t('user_activity_detail_title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {timeline?.isAnonymous ? t('user_activity_anonymous') : t('user_activity_detail_desc')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('user_activity_filter_title')}</CardTitle>
          <CardDescription>{t('user_activity_filter_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" onSubmit={handleApplyFilter}>
            <div className="space-y-2">
              <Label htmlFor="activity-date">{t('user_activity_filter_date')}</Label>
              <Input
                id="activity-date"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-time-from">{t('user_activity_filter_time_from')}</Label>
              <Input
                id="activity-time-from"
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-time-to">{t('user_activity_filter_time_to')}</Label>
              <Input
                id="activity-time-to"
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">
                <Search className="me-2 h-4 w-4" />
                {t('user_activity_filter_apply')}
              </Button>
              <Button type="button" variant="outline" onClick={handleResetFilter}>
                {t('user_activity_filter_reset')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('user_activity_loading')}</span>
        </div>
      ) : (
         <UserActivityTimelineView items={timeline?.items ?? []} locale={locale === 'fa' ? 'fa' : 'en'} />
      )}
    </div>
  );
}
