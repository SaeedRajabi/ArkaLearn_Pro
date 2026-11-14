'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Github,
  Cpu,
  Images,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLanguage } from '@/components/language-provider';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import type { Project } from '@/lib/types';
import {
  getProjectById,
  updateProject as updateProjectApi,
  deleteProject as deleteProjectApi,
} from '@/services/project-api.service';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AddProjectModal } from '../components/add-project-modal';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0600-\u06FF]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project';
}

function toValidDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function resolveProjectDate(...values: unknown[]): Date {
  for (const value of values) {
    const parsed = toValidDate(value);
    if (parsed) return parsed;
  }
  return new Date();
}

function formatDisplayDate(dateValue: unknown, locale: 'en' | 'fa'): string {
  const date = toValidDate(dateValue);
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

function ProjectDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-80 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const { t, locale } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;
  const [project, setProject] = React.useState<Project | null | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isContentExpanded, setIsContentExpanded] = React.useState(false);

  const loadProject = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await getProjectById(projectId);
      if (!data) {
        setProject(null);
        return;
      }
      setProject({
        id: String(data.id),
        title: data.title ?? '',
        slug: data.slug ?? '',
        shortDescription: data.shortDescription ?? '',
        longDescription: data.longDescription ?? '',
        status: data.isPublished ? 'Published' : 'Draft',
        publishedAt: resolveProjectDate(data.publishedAt, data.createdAt),
        thumbnailUrl: data.thumbnailUrl ?? undefined,
        introVideoUrl: data.introVideoUrl ?? undefined,
        gitHubUrl: data.gitHubUrl ?? undefined,
        projectUrl: data.projectUrl ?? undefined,
        technologies: data.technologies ?? [],
        tags: data.tags ?? [],
        gallery: data.gallery ?? [],
        authorName: data.authorName ?? undefined,
      });
    } catch {
      setProject(null);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (project === undefined) {
    return <ProjectDetailsLoading />;
  }

  if (project === null) {
    notFound();
  }

  const handleDelete = async () => {
    try {
      await deleteProjectApi(Number(project.id));
      toast({
        title: t('project_deleted_title'),
        description: t('project_deleted_description').replace('{title}', project.title),
      });
      router.push('/dashboard/projects');
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_delete_project') || 'Failed to delete project.',
      });
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await updateProjectApi({
        id: Number(project.id),
        title: project.title,
        slug: project.slug ?? slugify(project.title),
        shortDescription: project.shortDescription,
        longDescription: project.longDescription,
        thumbnailUrl: project.thumbnailUrl ?? null,
        introVideoUrl: project.introVideoUrl ?? null,
        gitHubUrl: project.gitHubUrl ?? null,
        projectUrl: project.projectUrl ?? null,
        technologiesJson: JSON.stringify(project.technologies ?? []),
        galleryJson: JSON.stringify(project.gallery ?? []),
        tagsJson: JSON.stringify(project.tags ?? []),
        isPublished: true,
      });
      setProject((prev) =>
        prev ? { ...prev, status: 'Published', publishedAt: new Date() } : prev
      );
      toast({
        title: t('project_published_title') || 'Project published',
        description: t('project_published_description') || 'The project has been published.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('error_title') || 'Error',
        description: t('error_publish_project') || 'Failed to publish project.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const thumbnailSrc = project.thumbnailUrl ? resolveStaticAssetUrl(project.thumbnailUrl) : null;
  const introVideoSrc = project.introVideoUrl ? resolveStaticAssetUrl(project.introVideoUrl) : null;
  const publishedAtLabel = formatDisplayDate(project.publishedAt, locale);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="group relative h-[400px] w-full overflow-hidden bg-muted md:h-[500px] lg:h-[600px]">
        {thumbnailSrc ? (
          <>
            <Image
              src={thumbnailSrc}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="100vw"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-background" />
        )}

        <div className="container relative mx-auto flex h-full max-w-7xl flex-col justify-between p-6 md:p-10 lg:p-16">
          <div className="flex items-start justify-between">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-transparent bg-background/80 backdrop-blur-md hover:bg-background/90"
              asChild
            >
              <Link href="/dashboard/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back_to_projects')}
              </Link>
            </Button>

            <div className="flex gap-2">
              {project.status === 'Draft' && (
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full bg-primary/90 shadow-sm hover:bg-primary"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {t('actions_publish')}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full bg-background/80 shadow-sm backdrop-blur-md hover:bg-background/90"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('actions_edit')}
              </Button>
              <Button variant="destructive" size="sm" className="rounded-full shadow-sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions_delete')}
              </Button>
            </div>
          </div>

          <div className="max-w-4xl animate-in space-y-4 duration-700 fade-in slide-in-from-bottom-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                variant={project.status === 'Published' ? 'default' : 'secondary'}
                className="shadow-sm backdrop-blur-md"
              >
                {t(project.status.toLowerCase())}
              </Badge>
              {project.slug && (
                <Badge variant="outline" className="font-mono text-xs" dir="ltr">
                  {project.slug}
                </Badge>
              )}
            </div>

            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {project.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted-foreground md:text-base">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">
                  {project.authorName || t('project_details_author_admin')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{publishedAtLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{t('project_details_created')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container relative z-10 mx-auto -mt-12 max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-8">
            <Card className="overflow-hidden border-none bg-background/95 shadow-xl backdrop-blur-sm">
              <CardContent className="p-8 md:p-10">
                {project.shortDescription && (
                  <div className="mb-8 rounded-2xl border bg-muted/30 p-5">
                    <h2 className="mb-3 text-lg font-semibold">{t('project_details_summary')}</h2>
                    <p className="border-l-4 border-primary pl-4 text-lg font-medium leading-relaxed text-muted-foreground">
                      {project.shortDescription}
                    </p>
                  </div>
                )}

                {introVideoSrc && (
                  <div className="mb-8 overflow-hidden rounded-2xl border bg-muted/30">
                    <video src={introVideoSrc} controls className="aspect-video w-full" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className={!isContentExpanded ? 'relative max-h-80 overflow-hidden' : undefined}>
                    <RichHtmlContent
                      dir="auto"
                      className="prose prose-lg prose-slate dark:prose-invert max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:leading-relaxed prose-p:text-muted-foreground
                        prose-img:my-8 prose-img:rounded-xl prose-img:shadow-lg
                        prose-blockquote:rounded-r-lg prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:px-4 prose-blockquote:py-1
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                      html={project.longDescription}
                    />
                    {!isContentExpanded && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setIsContentExpanded((prev) => !prev)}>
                    {isContentExpanded ? t('show_less') : t('show_more')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {project.gallery && project.gallery.length > 0 && (
              <Card className="border-none bg-background/95 shadow-xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Images className="h-5 w-5 text-primary" />
                    {t('project_details_gallery')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {project.gallery.map((item, index) => (
                      <div key={index} className="overflow-hidden rounded-xl border bg-card">
                        {item.imageUrl && (
                          <div className="relative aspect-video bg-muted">
                            <Image
                              src={resolveStaticAssetUrl(item.imageUrl)}
                              alt={item.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.shortDescription}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24 border-none bg-background/95 shadow-lg backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Tag className="h-4 w-4 text-primary" />
                  {t('project_details_tags')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer px-3 py-1 transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        #{tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm italic text-muted-foreground">{t('project_details_no_tags')}</p>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <Cpu className="h-4 w-4" />
                    {t('project_details_technologies')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies && project.technologies.length > 0 ? (
                      project.technologies.map((tech) => (
                        <Badge key={tech} variant="outline">
                          {tech}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm italic text-muted-foreground">{t('project_details_no_technologies')}</p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('project_details_links')}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {project.gitHubUrl && (
                      <Button variant="outline" size="sm" className="justify-start" asChild>
                        <a href={project.gitHubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="mr-2 h-4 w-4" />
                          {t('project_details_github')}
                          <ExternalLink className="ml-auto h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {project.projectUrl && (
                      <Button variant="outline" size="sm" className="justify-start" asChild>
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('project_details_live_demo')}
                          <ExternalLink className="ml-auto h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {!project.gitHubUrl && !project.projectUrl && (
                      <p className="text-sm italic text-muted-foreground">{t('project_details_no_links')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddProjectModal
        open={isEditModalOpen}
        onOpenChangeAction={setIsEditModalOpen}
        project={project}
        onSuccessAction={loadProject}
      />
    </div>
  );
}
