'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { AdvertisementDetailView } from '@/components/advertisements/advertisement-detail-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getTeacherAdvertisement } from '@/lib/api/teacher-advertisements';
import { useAuthSessionReady } from '@/lib/hooks/use-auth-session-ready';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export function ProfessorAdvertisementPreviewClient({ dict }: { dict: Dictionary }) {
  const { user, isReady: authReady, isBootstrapping: authBootstrapping, refetch: refetchAuth } =
    useAuthSessionReady();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [ad, setAd] = React.useState<Awaited<ReturnType<typeof getTeacherAdvertisement>>>(null);
  const adRef = React.useRef(ad);
  adRef.current = ad;
  const lang = String((dict as Record<string, unknown>).lang ?? 'fa');
  const pageDict = (dict.advertisementDetailPage ?? {}) as Record<string, string>;
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const loadPreview = React.useCallback(async () => {
    const userName = user?.userName?.trim() || undefined;
    if (!userName && !user?.id) {
      setAd(null);
      return;
    }

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const data = await getTeacherAdvertisement({
          userName,
          forEdit: true,
        });
        setAd(data);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 2) {
          await refetchAuth();
          await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }, [refetchAuth, user?.id, user?.userName]);

  React.useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    (async () => {
      if (!adRef.current) setLoading(true);
      try {
        await loadPreview();
      } catch {
        if (!cancelled) {
          toast({
            title: t('professorDashboard.advertisements.loadError', 'Failed to load advertisement'),
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, loadPreview, toast, dict]);

  if ((authBootstrapping && !ad) || (loading && !ad)) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline">
          <Link href="/professor/advertisements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('professorDashboard.advertisements.backToEdit', 'Back to advertisement editor')}
          </Link>
        </Button>
        <Alert>
          <AlertDescription>
            {t('professorDashboard.advertisements.previewEmpty', 'Save your advertisement first to preview it.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Eye className="h-6 w-6 text-primary" />
            {t('professorDashboard.advertisements.previewTitle', 'Advertisement preview')}
          </h1>
          <p className="text-muted-foreground">
            {t('professorDashboard.advertisements.previewSubtitle', 'This is how visitors will see your listing.')}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/professor/advertisements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('professorDashboard.advertisements.backToEdit', 'Back to editor')}
          </Link>
        </Button>
      </div>

      {!ad.isPublic ? (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <AlertDescription>
            {t(
              'professorDashboard.advertisements.previewDraftBanner',
              'Your advertisement is not public yet. Enable public visibility to publish it.'
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      <AdvertisementDetailView
        ad={ad}
        dict={{
          ...pageDict,
          lang,
          days: (dict.advertisementsPage as Record<string, string> | undefined)?.days ?? 'days',
          months: (dict.advertisementsPage as Record<string, string> | undefined)?.months ?? 'months',
          years: (dict.advertisementsPage as Record<string, string> | undefined)?.years ?? 'years',
        }}
        isPreview
      />
    </div>
  );
}
