'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/language-provider';
import type { DashboardProjectOrder } from '@/services/dashboard-service';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveStaticAssetUrl } from '@/lib/api-config';

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  const a = p[0]?.[0]?.toUpperCase() ?? '?';
  const b = p[1]?.[0]?.toUpperCase() ?? '';
  return a + b;
}

interface ProjectOrdersListProps {
  orders: DashboardProjectOrder[];
  pendingCount: number;
  loading?: boolean;
}

export function ProjectOrdersList({ orders, pendingCount, loading }: ProjectOrdersListProps) {
  const { t } = useLanguage();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {t('project_orders_widget_title')}
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount}</Badge>
            )}
          </CardTitle>
          <CardDescription>{t('project_orders_widget_description')}</CardDescription>
        </div>
        <Link href="/dashboard/project-orders" className="text-sm text-primary hover:underline">
          {t('project_orders_view_all')}
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ul className="space-y-4">
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[75%] max-w-[200px]" />
                  <Skeleton className="h-3 w-1/2 max-w-[160px]" />
                </div>
              </li>
            ))}
          </ul>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('project_orders_empty')}</p>
        ) : (
          <ul className="space-y-4">
            {orders.slice(0, 5).map((order) => {
              const img = order.requesterAvatarUrl ? resolveStaticAssetUrl(order.requesterAvatarUrl) : '';
              return (
                <li key={order.id}>
                  <Link
                    href={`/dashboard/project-orders/${order.id}`}
                    className="flex items-start gap-4 rounded-lg p-1 -m-1 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      {img ? <AvatarImage src={img} alt={order.requesterName} /> : null}
                      <AvatarFallback>{initials(order.requesterName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        #{order.requestNumber} — {order.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.requesterName}
                      </p>
                    </div>
                    <Badge variant={order.status === 'Submitted' ? 'secondary' : order.status === 'Approved' ? 'default' : 'destructive'}>
                      {order.status}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
