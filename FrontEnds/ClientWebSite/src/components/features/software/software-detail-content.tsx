'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import type { SoftwareDetail } from '@/lib/api/software';
import { recordSoftwareDownload, toggleSoftwareLike } from '@/lib/api/software';
import type { Dictionary } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeoTagLink } from '@/components/shared/seo-tag-link';
import { getSoftwareCoverImageUrl, getUserImageUrl } from '@/lib/utils/image-url';
import {
  Download,
  Heart,
  Package,
  Sparkles,
  UserRound,
  HardDriveDownload,
  Tags,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SoftwareDownloadDialog } from '@/components/features/software/software-download-dialog';
import { cn } from '@/lib/utils';

interface SoftwareDetailContentProps {
  software: SoftwareDetail;
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function SoftwareDetailContent({ software, dict, lang }: SoftwareDetailContentProps) {
  const isRtl = lang === 'fa';
  const locale = isRtl ? 'fa-IR' : 'en-US';
  const pageDict = (dict.softwarePage ?? {}) as Record<string, string>;
  const cover = getSoftwareCoverImageUrl(software.coverImageUrl);
  const teacherName = software.teacherDisplayName?.trim() || software.teacherUserName?.trim() || '';
  const teacherHref = software.teacherUserName
    ? `/advertisements/${encodeURIComponent(software.teacherUserName)}`
    : undefined;
  const installerName = software.installerFileName?.trim() || `${software.title}.zip`;
  const { toast } = useToast();
  const [downloadCount, setDownloadCount] = useState(software.downloadCount);
  const [likeCount, setLikeCount] = useState(software.likeCount);
  const [isLiked, setIsLiked] = useState(software.isLikedByViewer);
  const [liking, setLiking] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const recordDownload = useCallback(async () => {
    try {
      const count = await recordSoftwareDownload(software.id);
      if (count > 0) {
        setDownloadCount(count);
      }
    } catch {
      // Download should still proceed even if analytics recording fails.
    }
  }, [software.id]);

  const handleLike = async () => {
    setLiking(true);
    try {
      const result = await toggleSoftwareLike(software.id);
      setLikeCount(result.likeCount);
      setIsLiked(result.isLiked);
    } catch {
      toast({
        title: pageDict.likeFailed ?? (isRtl ? 'برای لایک باید وارد شوید' : 'Sign in to like'),
        variant: 'destructive',
      });
    } finally {
      setLiking(false);
    }
  };

  return (
    <>
      <article className="space-y-10" dir={isRtl ? 'rtl' : 'ltr'}>
        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_340px]">
            <div className="relative min-h-[280px] lg:min-h-[420px]">
              <Image
                src={cover}
                alt={software.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 space-y-4 p-6 md:p-8">
                <div className="flex flex-wrap gap-2">
                  {software.categoryName ? (
                    <Badge variant="secondary" className="bg-background/90 text-foreground">
                      {software.categoryName}
                    </Badge>
                  ) : null}
                  {software.isPlatformOwned ? (
                    <Badge className="bg-primary/95 text-primary-foreground">
                      <Sparkles className="me-1 h-3.5 w-3.5" />
                      {pageDict.platformBadge ?? (isRtl ? 'نرم‌افزار پلتفرم' : 'Platform software')}
                    </Badge>
                  ) : null}
                </div>
                <h1 className="font-headline text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                  {software.title}
                </h1>
                {software.shortDescription ? (
                  <p className="max-w-3xl text-base leading-relaxed text-white/90 md:text-lg">
                    {software.shortDescription}
                  </p>
                ) : null}
                {software.tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Tags className="h-4 w-4 text-white/70" />
                    {software.tags.map((tag) => (
                      <SeoTagLink
                        key={tag}
                        tag={tag}
                        variant="outline"
                        className="border-white/25 bg-black/25 text-white hover:bg-primary/20 hover:text-white"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="flex flex-col gap-5 border-t bg-gradient-to-b from-muted/20 to-background p-6 lg:border-s lg:border-t-0">
              <div className="rounded-2xl border bg-background/80 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <HardDriveDownload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {pageDict.downloadPanelTitle ?? (isRtl ? 'دریافت نرم‌افزار' : 'Get this software')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pageDict.downloadPanelHint ??
                        (isRtl
                          ? 'مسیر ذخیره و زمان شروع دانلود را خودتان تعیین کنید.'
                          : 'Choose save location and when to start downloading.')}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-muted/30 p-3 text-center">
                    <Download className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                    <p className="text-xl font-bold tabular-nums">{downloadCount}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {pageDict.downloads ?? (isRtl ? 'دانلود' : 'downloads')}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-3 text-center">
                    <Heart className="mx-auto mb-1.5 h-4 w-4 text-red-500" />
                    <p className="text-xl font-bold tabular-nums">{likeCount}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {pageDict.likes ?? (isRtl ? 'لایک' : 'likes')}
                    </p>
                  </div>
                </div>

                {software.installerFileUrl ? (
                  <Button className="h-12 w-full rounded-xl text-base" size="lg" onClick={() => setDownloadOpen(true)}>
                    <Download className="me-2 h-5 w-5" />
                    {pageDict.download ?? (isRtl ? 'دانلود نرم‌افزار' : 'Download software')}
                  </Button>
                ) : (
                  <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {pageDict.noInstaller ?? (isRtl ? 'فایل نصب موجود نیست.' : 'No installer available.')}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="mt-3 h-11 w-full rounded-xl"
                  onClick={handleLike}
                  disabled={liking}
                >
                  <Heart className={cn('me-2 h-4 w-4', isLiked && 'fill-current text-red-500')} />
                  {isLiked
                    ? pageDict.unlike ?? (isRtl ? 'حذف لایک' : 'Unlike')
                    : pageDict.like ?? (isRtl ? 'لایک' : 'Like')}
                </Button>
              </div>

              {software.installerFileName ? (
                <div className="rounded-2xl border bg-muted/15 p-4 text-xs text-muted-foreground">
                  <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <Package className="h-4 w-4 text-primary" />
                    {pageDict.installerFile ?? (isRtl ? 'فایل نصب' : 'Installer file')}
                  </div>
                  <p className="break-all">{software.installerFileName}</p>
                  <p className="mt-2 leading-relaxed">
                    {pageDict.installerHint ??
                      (isRtl
                        ? 'پس از انتخاب مسیر، دانلود امن با قابلیت توقف و ادامه انجام می‌شود.'
                        : 'Secure download with pause and resume support.')}
                  </p>
                </div>
              ) : null}

              {teacherName ? (
                <div className="mt-auto rounded-2xl border p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {pageDict.publisher ?? (isRtl ? 'منتشرکننده' : 'Publisher')}
                  </p>
                  {teacherHref ? (
                    <Link href={teacherHref} className="inline-flex items-center gap-3 hover:text-primary">
                      {software.teacherAvatarUrl ? (
                        <Image
                          src={getUserImageUrl(software.teacherAvatarUrl)}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <UserRound className="h-5 w-5" />
                        </span>
                      )}
                      <span className="font-medium">{teacherName}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-3 text-muted-foreground">
                      <UserRound className="h-5 w-5" />
                      {teacherName}
                    </span>
                  )}
                </div>
              ) : null}
            </aside>
          </div>
        </section>

        {software.longDescriptionHtml ? (
          <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold md:text-2xl">
                {pageDict.aboutSoftware ?? (isRtl ? 'درباره این نرم‌افزار' : 'About this software')}
              </h2>
            </div>
            <RichHtmlContent html={software.longDescriptionHtml} className="prose max-w-none dark:prose-invert" />
          </section>
        ) : null}
      </article>

      <SoftwareDownloadDialog
        dict={dict}
        slug={software.slug}
        softwareId={software.id}
        fileName={installerName}
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        locale={locale}
        isRtl={isRtl}
        onBeforeStart={recordDownload}
      />
    </>
  );
}
