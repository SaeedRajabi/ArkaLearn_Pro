'use client';

import * as React from 'react';
import {
  Activity,
  Clock3,
  Globe,
  Laptop,
  MapPin,
  MousePointerClick,
  Monitor,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UserActivityTimelineItem } from '@/services/user-activity-api.service';

type Props = {
  items: UserActivityTimelineItem[];
  locale?: 'fa' | 'en';
};

function actionIcon(actionType: string) {
  const type = actionType.toLowerCase();
  if (type.includes('click')) return MousePointerClick;
  return Activity;
}

function formatTime(iso: string, locale: 'fa' | 'en') {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDayLabel(iso: string, locale: 'fa' | 'en') {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function groupByDay(items: UserActivityTimelineItem[]) {
  const groups = new Map<string, UserActivityTimelineItem[]>();
  for (const item of items) {
    const dayKey = item.occurredAtUtc.slice(0, 10);
    const bucket = groups.get(dayKey) ?? [];
    bucket.push(item);
    groups.set(dayKey, bucket);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function UserActivityTimeline({ items, locale = 'fa' }: Props) {
  const grouped = React.useMemo(() => groupByDay(items), [items]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
        {locale === 'fa' ? 'فعالیتی برای این بازه زمانی یافت نشد.' : 'No activity found for this time range.'}
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-5xl py-4">
      {grouped.map(([dayKey, dayItems]) => (
        <div key={dayKey} className="mb-10">
          <div className="mb-6 flex justify-center">
            <Badge variant="secondary" className="px-4 py-1 text-sm">
              {formatDayLabel(dayItems[0].occurredAtUtc, locale)}
            </Badge>
          </div>

          <div className="relative space-y-8 before:absolute before:inset-y-0 before:start-1/2 before:w-px before:-translate-x-1/2 before:bg-border">
            {dayItems.map((item, index) => {
              const Icon = actionIcon(item.actionType);
              const isLeft = index % 2 === 0;

              return (
                <div key={`${item.id}-${item.occurredAtUtc}-${index}`} className="relative grid grid-cols-1 md:grid-cols-2 md:gap-8">
                  <div className={cn('hidden md:block', isLeft ? 'order-1' : 'order-2')} />
                  <div
                    className={cn(
                      'relative md:col-span-1',
                      isLeft ? 'md:order-1 md:pe-10 md:text-end' : 'md:order-2 md:ps-10 md:text-start'
                    )}
                  >
                    <Card className="shadow-sm transition-shadow hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-base">{item.actionTitle || item.pagePath}</CardTitle>
                          <Badge variant="outline" className="shrink-0">
                            {formatTime(item.occurredAtUtc, locale)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex flex-wrap gap-2 text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {item.pagePath}
                          </span>
                          {item.siteSource ? (
                            <Badge variant="secondary">{item.siteSource}</Badge>
                          ) : null}
                          {item.isBuffered ? (
                            <Badge variant="outline">{locale === 'fa' ? 'حافظه موقت' : 'In memory'}</Badge>
                          ) : null}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {item.ipAddressV4 ? (
                            <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>IPv4: {item.ipAddressV4}</span>
                            </div>
                          ) : null}
                          {item.ipAddressV6 ? (
                            <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="truncate">IPv6: {item.ipAddressV6}</span>
                            </div>
                          ) : null}
                          {item.browserName ? (
                            <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                              <Monitor className="h-4 w-4 text-primary" />
                              <span>
                                {item.browserName}
                                {item.browserVersion ? ` ${item.browserVersion}` : ''}
                              </span>
                            </div>
                          ) : null}
                          {item.operatingSystem ? (
                            <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                              <Laptop className="h-4 w-4 text-primary" />
                              <span>{item.operatingSystem}</span>
                            </div>
                          ) : null}
                          {item.deviceType ? (
                            <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                              <Clock3 className="h-4 w-4 text-primary" />
                              <span>{item.deviceType}</span>
                            </div>
                          ) : null}
                        </div>

                        {item.referrer ? (
                          <p className="text-xs text-muted-foreground">
                            {locale === 'fa' ? 'ارجاع:' : 'Referrer:'} {item.referrer}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="absolute start-1/2 top-6 z-10 hidden -translate-x-1/2 md:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
