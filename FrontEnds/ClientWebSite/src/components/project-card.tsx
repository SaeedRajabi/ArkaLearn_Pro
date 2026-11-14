'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Dictionary, ProjectListItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { getProjectImageUrl } from '@/lib/utils/image-url';
import { formatProjectDisplayDate } from '@/lib/utils/locale-format';
import { getProjectDetailHref } from '@/lib/project-url';

const MotionLink = motion(Link);

import { getTechnologyBadgeClass } from '@/lib/utils/technology-badge';

interface ProjectCardProps {
  project: ProjectListItem;
  dict: Dictionary;
  className?: string;
}

export function ProjectCard({ project, dict, className }: ProjectCardProps) {
  const lang = (dict.header as { projects?: string }).projects === 'Projects' ? 'en' : 'fa';
  const dateStr = project.publishedAt ?? project.createdAt;
  const visibleTech = project.technologies.slice(0, 3);
  const extraTech = Math.max(0, project.technologies.length - visibleTech.length);

  return (
    <MotionLink
      href={getProjectDetailHref(project)}
      className={cn(
        'group relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg transition-shadow hover:shadow-xl',
        className
      )}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={getProjectImageUrl(project.thumbnailUrl)}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint={project.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {project.tags[0] && (
          <Badge
            variant="secondary"
            className="absolute top-3 start-3 border-transparent bg-white/85 text-secondary-foreground backdrop-blur-sm"
          >
            {project.tags[0]}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          {visibleTech.map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className={cn('text-xs font-medium', getTechnologyBadgeClass(tech))}
            >
              <Code2 className="me-1 h-3 w-3 opacity-80" />
              {tech}
            </Badge>
          ))}
          {extraTech > 0 && (
            <Badge variant="outline" className="text-xs">
              +{extraTech}
            </Badge>
          )}
        </div>

        <h3 className="line-clamp-2 font-headline text-lg font-bold leading-tight">{project.title}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">{project.shortDescription}</p>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(1, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatProjectDisplayDate(dateStr, lang)}</span>
          </div>
        </div>
      </div>
    </MotionLink>
  );
}
