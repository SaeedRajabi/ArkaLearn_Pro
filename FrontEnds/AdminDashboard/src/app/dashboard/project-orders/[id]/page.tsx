'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import {
  getProjectOrderById,
  reviewProjectOrder,
  type ProjectOrderDetail,
} from '@/services/project-order-api.service';

export default function ProjectOrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const { t } = useLanguage();
  const { toast } = useToast();
  const [order, setOrder] = React.useState<ProjectOrderDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [adminNote, setAdminNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!Number.isFinite(orderId) || orderId <= 0) return;
    setLoading(true);
    try {
      const data = await getProjectOrderById(orderId);
      setOrder(data);
      setAdminNote(data?.adminNote ?? '');
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleReview = async (approve: boolean) => {
    if (!order) return;
    setSubmitting(true);
    try {
      await reviewProjectOrder({
        orderId: order.id,
        approve,
        adminNote: adminNote.trim() || undefined,
      });
      toast({
        title: approve ? t('project_orders_approved_toast') : t('project_orders_rejected_toast'),
      });
      await load();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: t('project_orders_review_error'),
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/project-orders">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t('project_orders_back')}
          </Link>
        </Button>
        <p className="text-muted-foreground">{t('project_orders_not_found')}</p>
      </div>
    );
  }

  const canReview = order.status === 'Submitted';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/project-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('project_orders_detail_title')} #{order.requestNumber}
            </h1>
            <p className="text-sm text-muted-foreground">{order.title}</p>
          </div>
        </div>
        <Badge variant={order.status === 'Approved' ? 'default' : order.status === 'Rejected' ? 'destructive' : 'secondary'}>
          {order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {order.descriptionHtml?.trim() ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('project_orders_description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: order.descriptionHtml }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('project_orders_col_title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{order.title}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('project_orders_requester')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">{t('project_orders_col_requester')}:</span> {order.requesterName || '—'}</p>
              <p><span className="text-muted-foreground">{t('project_orders_col_phone')}:</span> {order.requesterPhone || '—'}</p>
              {order.projectType && (
                <p><span className="text-muted-foreground">{t('project_orders_col_type')}:</span> {order.projectType}</p>
              )}
              {order.requesterEmail && (
                <p><span className="text-muted-foreground">Email:</span> {order.requesterEmail}</p>
              )}
              <p><span className="text-muted-foreground">{t('project_orders_col_date')}:</span> {order.createdAt}</p>
              {order.reviewedAt && (
                <p><span className="text-muted-foreground">{t('project_orders_reviewed_at')}:</span> {order.reviewedAt}</p>
              )}
              {order.reviewedByName && (
                <p><span className="text-muted-foreground">{t('project_orders_reviewed_by')}:</span> {order.reviewedByName}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('project_orders_admin_note')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={t('project_orders_admin_note_placeholder')}
                rows={4}
                disabled={!canReview || submitting}
              />
              {canReview ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="flex-1"
                    onClick={() => void handleReview(true)}
                    disabled={submitting}
                  >
                    <Check className="h-4 w-4 me-2" />
                    {t('project_orders_approve')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => void handleReview(false)}
                    disabled={submitting}
                  >
                    <X className="h-4 w-4 me-2" />
                    {t('project_orders_reject')}
                  </Button>
                </div>
              ) : (
                order.adminNote && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.adminNote}</p>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
