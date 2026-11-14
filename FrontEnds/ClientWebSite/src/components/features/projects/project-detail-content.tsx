'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTechnologyBadgeClass } from '@/lib/utils/technology-badge';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Github,
  Globe,
  Tags,
  UserRound,
} from 'lucide-react';
import { ProjectQaSection } from './project-qa-section';
import { SeoTagLink } from '@/components/shared/seo-tag-link';
import { DetailExploreLinks } from '@/components/shared/detail-explore-links';
import { ExpandableRichHtmlContent } from '@/components/shared/expandable-rich-html-content';
import { ProjectGallerySection } from './project-gallery-section';
import type { Dictionary, Project } from '@/types';
import { formatProjectDisplayDate } from '@/lib/utils/locale-format';

interface ProjectDetailContentProps {
  project: Project;
  dict: Dictionary;
  lang: 'en' | 'fa';
}

export function ProjectDetailContent({ project, dict, lang }: ProjectDetailContentProps) {
  const isRtl = lang === 'fa';
  const pageDict = dict.projectsPage as Record<string, string>;
  const dateStr = project.publishedAt ?? project.createdAt;

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden space-y-12 py-8 sm:py-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className={cn(
          'grid min-w-0 max-w-full gap-6 sm:gap-8 lg:grid-cols-[280px_minmax(0,1fr)]',
          isRtl && 'lg:grid-cols-[minmax(0,1fr)_280px]'
        )}
      >
        <aside
          className={cn(
            'min-w-0 max-w-full space-y-4 lg:sticky lg:top-28 lg:self-start',
            isRtl ? 'lg:order-2' : 'lg:order-1'
          )}
        >
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <Link
              href="/projects"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {pageDict.backToProjects}
            </Link>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{pageDict.author}</p>
                  <p className="text-muted-foreground">
                    {project.authorName || pageDict.defaultAuthor}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{pageDict.publishedAt}</p>
                  <p className="text-muted-foreground">
                    {formatProjectDisplayDate(dateStr, lang)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {project.gitHubUrl && (
                <Button asChild variant="outline" className="justify-start gap-2">
                  <a href={project.gitHubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    {pageDict.viewOnGitHub}
                    <ExternalLink className="ms-auto h-3.5 w-3.5 opacity-60" />
                  </a>
                </Button>
              )}
              {project.projectUrl && (
                <Button asChild variant="default" className="justify-start gap-2">
                  <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                    {pageDict.viewLiveProject}
                    <ExternalLink className="ms-auto h-3.5 w-3.5 opacity-80" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <Tags className="h-4 w-4 text-primary" />
              {pageDict.tags}
            </div>
            {project.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <SeoTagLink key={tag} tag={tag} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{pageDict.noTags}</p>
            )}
          </div>

          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <p className="mb-3 font-semibold">{pageDict.technologies}</p>
            {project.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="outline"
                    className={cn('text-xs', getTechnologyBadgeClass(tech))}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{pageDict.noTechnologies}</p>
            )}
          </div>

          {project.shortDescription && (
            <div className="rounded-xl border bg-background p-5 text-sm leading-7 text-muted-foreground shadow-sm">
              <p className="mb-2 font-semibold text-foreground">{pageDict.projectSummary}</p>
              {project.shortDescription}
            </div>
          )}
          <DetailExploreLinks lang={lang} tags={project.tags} />
        </aside>

        <div className={cn('min-w-0 max-w-full space-y-6 sm:space-y-8', isRtl ? 'lg:order-1' : 'lg:order-2')}>
          {project.introVideoUrl && (
            <div className="overflow-hidden rounded-2xl border bg-background p-3 shadow-sm sm:p-4">
              <p className="mb-3 text-sm font-semibold">{pageDict.introVideo}</p>
              <video
                src={project.introVideoUrl}
                controls
                playsInline
                className="max-h-[480px] w-full max-w-full rounded-xl bg-black"
                title={project.title}
              />
            </div>
          )}

          {project.gallery.length > 0 && (
            <ProjectGallerySection
              gallery={project.gallery}
              projectTitle={project.title}
              pageDict={pageDict}
              isRtl={isRtl}
            />
          )}

          <div className="min-w-0 max-w-full overflow-hidden rounded-xl bg-background p-4 shadow-sm sm:p-6 md:p-10">
            <h2 className="mb-4 font-headline text-xl font-bold sm:mb-6 sm:text-2xl">{pageDict.longDescription}</h2>
            <ExpandableRichHtmlContent
              html={project.longDescription ?? ''}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="max-w-full overflow-x-auto"
              readMoreLabel={pageDict.readMore ?? 'بیشتر بخوانید'}
              readLessLabel={pageDict.readLess ?? 'کمتر بخوانید'}
            />
          </div>

          <div className="min-w-0 max-w-full">
            <ProjectQaSection
              projectId={Number(project.id)}
              dict={dict}
              lang={lang}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
