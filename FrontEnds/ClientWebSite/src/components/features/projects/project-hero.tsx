import Image from 'next/image';
import { CalendarDays, UserRound } from 'lucide-react';
import type { Project } from '@/types';
import { formatProjectDisplayDate } from '@/lib/utils/locale-format';
import { getTechnologyBadgeClass } from '@/lib/utils/technology-badge';
import { cn } from '@/lib/utils';
import { SeoTagLink } from '@/components/shared/seo-tag-link';
import { Badge } from '@/components/ui/badge';

interface ProjectHeroProps {
  project: Project;
  lang: 'en' | 'fa';
}

export function ProjectHero({ project, lang }: ProjectHeroProps) {
  const dateStr = project.publishedAt ?? project.createdAt;

  return (
    <div className="relative flex min-h-[320px] w-full max-w-full flex-col justify-end overflow-hidden bg-black text-white sm:min-h-[420px]">
      <Image
        src={project.thumbnailUrl}
        alt={project.title}
        fill
        className="object-cover opacity-45"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      <div className="container relative mx-auto flex min-h-[240px] max-w-full flex-col justify-end px-4 py-8 sm:min-h-[300px] sm:py-12">
        <div className="flex min-w-0 max-w-full flex-col justify-end gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-2">
            {project.technologies.slice(0, 6).map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className={cn(
                  'border-transparent backdrop-blur-sm',
                  getTechnologyBadgeClass(tech)
                )}
              >
                {tech}
              </Badge>
            ))}
          </div>

          <h1 className="mb-1 font-headline text-2xl font-extrabold tracking-tight break-words sm:mb-2 sm:text-4xl lg:text-5xl">
            {project.title}
          </h1>

          {project.shortDescription && (
            <p className="max-w-3xl text-base leading-relaxed text-gray-200 sm:text-lg">{project.shortDescription}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
            {project.authorName && (
              <span className="inline-flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                {project.authorName}
              </span>
            )}
            {dateStr && (
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatProjectDisplayDate(dateStr, lang)}
              </span>
            )}
          </div>

          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {project.tags.map((tag) => (
                <SeoTagLink
                  key={tag}
                  tag={tag}
                  variant="secondary"
                  className="border-transparent bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 hover:text-white"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
