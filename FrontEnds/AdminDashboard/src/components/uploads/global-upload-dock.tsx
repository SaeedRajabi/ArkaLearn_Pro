'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, FileUp, Loader2, X, XCircle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  isUploadJobActive,
  useUploadQueueStore,
  type GlobalUploadJob,
} from '@/stores/upload-queue-store';

function statusLabel(job: GlobalUploadJob, t: (key: string) => string): string {
  switch (job.status) {
    case 'paused':
      return t('global_upload_status_paused');
    case 'finalizing':
      return t('global_upload_status_finalizing');
    case 'failed':
      return t('global_upload_status_failed');
    case 'completed':
      return t('global_upload_status_completed');
    case 'canceled':
      return t('global_upload_status_canceled');
    case 'queued':
      return t('global_upload_status_queued');
    default:
      return t('global_upload_status_uploading');
  }
}

function isOnOriginPath(pathname: string, returnPath: string): boolean {
  return pathname === returnPath || pathname.startsWith(`${returnPath}/`);
}

function shouldShowInDock(job: GlobalUploadJob, pathname: string): boolean {
  if (job.status === 'canceled') return false;
  if (isOnOriginPath(pathname, job.returnPath)) return false;
  return isUploadJobActive(job.status) || job.status === 'completed' || job.status === 'failed';
}

export function GlobalUploadDock() {
  const { t, direction } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname() || '';
  const jobs = useUploadQueueStore((s) => s.jobs);
  const cancel = useUploadQueueStore((s) => s.cancel);
  const remove = useUploadQueueStore((s) => s.remove);
  const notifiedRef = React.useRef<Set<string>>(new Set());
  const [navigatingJobId, setNavigatingJobId] = React.useState<string | null>(null);
  const [navigatingPath, setNavigatingPath] = React.useState<string | null>(null);

  const visibleJobs = React.useMemo(
    () => jobs.filter((job) => shouldShowInDock(job, pathname)),
    [jobs, pathname]
  );

  // Clear loading once navigation reaches the upload origin (or dock hides).
  React.useEffect(() => {
    if (!navigatingPath) return;
    if (isOnOriginPath(pathname, navigatingPath) || visibleJobs.length === 0) {
      setNavigatingJobId(null);
      setNavigatingPath(null);
    }
  }, [pathname, navigatingPath, visibleJobs.length]);

  // Toast terminal results only when admin is away from the upload page.
  React.useEffect(() => {
    for (const job of jobs) {
      if (isOnOriginPath(pathname, job.returnPath)) continue;
      if (notifiedRef.current.has(job.id)) continue;

      if (job.status === 'completed') {
        notifiedRef.current.add(job.id);
        toast({
          title: t('toast_success_title'),
          description: t('student_files_upload_success'),
        });
      } else if (job.status === 'failed') {
        notifiedRef.current.add(job.id);
        toast({
          variant: 'destructive',
          title: t('error_title'),
          description: job.errorMessage || t('student_files_upload_failed'),
        });
      }
    }
  }, [jobs, pathname, t, toast]);

  if (visibleJobs.length === 0) return null;

  const primary = visibleJobs[0];
  const extraCount = visibleJobs.length - 1;
  const isNavigating = navigatingJobId != null;

  const goToUpload = (job: GlobalUploadJob) => {
    if (!job.returnPath) return;
    if (pathname === job.returnPath) return;
    if (isNavigating) return;
    setNavigatingJobId(job.id);
    setNavigatingPath(job.returnPath);
    router.push(job.returnPath);
  };

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[90] flex w-[min(100vw-1.5rem,22rem)] flex-col gap-2 p-3',
        'bottom-3',
        direction === 'rtl' ? 'left-3 sm:left-4' : 'right-3 sm:right-4'
      )}
      role="region"
      aria-label={t('global_upload_region')}
      aria-busy={isNavigating || undefined}
    >
      {visibleJobs.slice(0, 3).map((job) => {
        const active = isUploadJobActive(job.status);
        const failed = job.status === 'failed';
        const done = job.status === 'completed';
        const jobNavigating = navigatingJobId === job.id;

        return (
          <div
            key={job.id}
            className={cn(
              'pointer-events-auto relative cursor-pointer overflow-hidden rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80',
              'transition hover:border-primary/40 hover:shadow-xl',
              failed && 'border-destructive/50',
              done && 'border-emerald-500/40',
              jobNavigating && 'pointer-events-none border-primary/50',
              isNavigating && !jobNavigating && 'opacity-70'
            )}
            role="button"
            tabIndex={isNavigating ? -1 : 0}
            aria-disabled={isNavigating || undefined}
            onClick={() => goToUpload(job)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goToUpload(job);
              }
            }}
          >
            {jobNavigating ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-[2px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="px-3 text-center text-xs font-medium text-muted-foreground">
                  {t('global_upload_navigating')}
                </p>
              </div>
            ) : null}

            <div className={cn('flex items-start gap-3', jobNavigating && 'opacity-40')}>
              <div
                className={cn(
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
                  failed ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : failed ? (
                  <XCircle className="h-5 w-5" />
                ) : job.status === 'finalizing' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileUp className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.fileName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(job.contextKey)} · {statusLabel(job, t)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled={isNavigating}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (active) void cancel(job.id);
                      else remove(job.id);
                    }}
                    aria-label={t('global_upload_dismiss')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {active ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] tabular-nums text-muted-foreground">
                      <span>{t('global_upload_click_to_return')}</span>
                      <span>{Math.min(100, Math.max(0, job.percent))}%</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, job.percent))} className="h-1.5" />
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {t('global_upload_click_to_return')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {extraCount > 0 && primary ? (
        <button
          type="button"
          className="pointer-events-auto rounded-md border bg-muted/90 px-3 py-1.5 text-xs text-muted-foreground shadow backdrop-blur hover:text-foreground disabled:opacity-60"
          disabled={isNavigating}
          onClick={() => goToUpload(primary)}
        >
          {t('global_upload_more', { count: extraCount })}
        </button>
      ) : null}
    </div>
  );
}
