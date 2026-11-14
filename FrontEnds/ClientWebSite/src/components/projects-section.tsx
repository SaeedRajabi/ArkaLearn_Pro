'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Dictionary, ProjectListItem } from '@/types';
import { cn } from '@/lib/utils';
import { getProjectImageUrl } from '@/lib/utils/image-url';
import { getProjectDetailHref } from '@/lib/project-url';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Layers,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { ShowcaseSectionBackground } from './showcase-section-background';
import showcaseStyles from './showcase-section.module.css';
import styles from './projects-section.module.css';

type ProjectFilter = 'newest' | 'featured' | 'completed';

interface ProjectsSectionProps {
  dict: Dictionary;
  projects: ProjectListItem[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

function projectScore(project: ProjectListItem): number {
  return project.technologies.length * 2 + project.tags.length;
}

function ProjectGridCard({
  project,
  lang,
}: {
  project: ProjectListItem;
  lang: 'en' | 'fa';
}) {
  const dateStr = project.publishedAt ?? project.createdAt;
  const tech = project.technologies.slice(0, 3);

  return (
    <Link href={getProjectDetailHref(project)} className={styles.gridCard}>
      <div className={styles.gridMedia}>
        <Image
          src={getProjectImageUrl(project.thumbnailUrl)}
          alt={project.title}
          fill
          className={styles.gridImage}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className={styles.gridOverlay} />
        {project.tags[0] && <span className={styles.gridTag}>{project.tags[0]}</span>}
      </div>
      <div className={styles.gridBody}>
        <div className={styles.gridTechRow}>
          {tech.map((t) => (
            <span key={t} className={styles.gridTech}>
              {t}
            </span>
          ))}
        </div>
        <h3 className={styles.gridTitle}>{project.title}</h3>
        <p className={styles.gridDesc}>{project.shortDescription}</p>
        <div className={styles.gridFooter}>
          <span>{project.isPublished ? (lang === 'fa' ? 'انجام‌شده' : 'Completed') : ''}</span>
          {dateStr && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateStr}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProjectsSection({ dict, projects: propProjects }: ProjectsSectionProps) {
  const [filter, setFilter] = useState<ProjectFilter>('newest');
  const sectionDict = (dict.projectsSection ?? {}) as Record<string, string>;
  const lang: 'en' | 'fa' =
    (dict.header as { projects?: string }).projects === 'Projects' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const reduceMotion = useReducedMotion();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const published = useMemo(() => propProjects.filter((p) => p.isPublished), [propProjects]);

  const latestProject = published[0] ?? null;
  const sideProjects = published.slice(1, 3);

  const uniqueTechCount = useMemo(
    () => new Set(published.flatMap((p) => p.technologies)).size,
    [published]
  );

  const filteredProjects = useMemo(() => {
    const base = [...published];
    switch (filter) {
      case 'featured':
        return base.sort((a, b) => projectScore(b) - projectScore(a));
      case 'completed':
        return base.filter((p) => Boolean(p.publishedAt)).sort((a, b) => b.id - a.id);
      case 'newest':
      default:
        return base;
    }
  }, [published, filter]);

  const gridProjects = useMemo(() => {
    const excludeIds = new Set<number>();
    if (latestProject) excludeIds.add(latestProject.id);
    sideProjects.forEach((p) => excludeIds.add(p.id));
    return filteredProjects.filter((p) => !excludeIds.has(p.id)).slice(0, 6);
  }, [filteredProjects, latestProject, sideProjects]);

  if (published.length === 0) return null;

  const t = (key: string, fallbackEn: string, fallbackFa: string) =>
    sectionDict[key] ?? (lang === 'en' ? fallbackEn : fallbackFa);

  const labels = {
    latest: t('latestProject', 'Latest project', 'آخرین پروژه'),
    viewProject: t('viewProject', 'View project', 'مشاهده پروژه'),
    orderProject: t('orderProject', 'Request a project', 'درخواست پروژه'),
  };

  const filterLabels: Record<ProjectFilter, string> = {
    newest: t('newest', 'Newest', 'جدیدترین'),
    featured: t('featured', 'Featured', 'ویژه'),
    completed: t('completed', 'Completed', 'انجام‌شده'),
  };

  return (
    <motion.section
      className={showcaseStyles.section}
      dir={isRtl ? 'rtl' : 'ltr'}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.06 }}
      variants={containerVariants}
    >
      <ShowcaseSectionBackground />

      <div className={showcaseStyles.inner}>
        <motion.div variants={itemVariants}>
          <span className={showcaseStyles.eyebrow}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t('eyebrow', 'Portfolio', 'نمونه‌کار')}
          </span>

          <div className={showcaseStyles.headerRow}>
            <div>
              <h2 className={showcaseStyles.title}>
                {t('title', 'Our Projects', 'پروژه‌های ما')}
              </h2>
              <p className={cn(showcaseStyles.subtitle, isRtl && 'font-subtitle')}>
                {t(
                  'subtitle',
                  'Explore real software built by our team — from the newest releases to completed portfolio work.',
                  'نمونه‌کارهای واقعی تیم ما را ببینید؛ از جدیدترین پروژه‌ها تا کارهای تکمیل‌شده.'
                )}
              </p>
            </div>
            <Link href="/projects" className={showcaseStyles.viewAllBtn}>
              {t('viewAll', 'View all projects', 'مشاهده همه پروژه‌ها')}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{published.length}</p>
              <p className={styles.statLabel}>
                {t('statProjects', 'Delivered projects', 'پروژه تحویل‌شده')}
              </p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{uniqueTechCount}+</p>
              <p className={styles.statLabel}>
                {t('statTechnologies', 'Technologies used', 'فناوری به‌کاررفته')}
              </p>
            </div>
            <div className={cn(styles.statCard, 'max-sm:col-span-2')}>
              <p className={styles.statValue}>
                <Layers className="inline h-6 w-6 text-primary" aria-hidden />
              </p>
              <p className={styles.statLabel}>
                {t('statQuality', 'Production-ready solutions', 'راه‌حل‌های آماده تولید')}
              </p>
            </div>
          </div>
        </motion.div>

        {latestProject && (
          <motion.div variants={itemVariants} className={styles.bento}>
            <Link href={getProjectDetailHref(latestProject)} className={styles.spotlight}>
              <div className={styles.spotlightMedia}>
                <Image
                  src={getProjectImageUrl(latestProject.thumbnailUrl)}
                  alt={latestProject.title}
                  fill
                  className={styles.spotlightImage}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
                <div className={styles.spotlightOverlay} />
              </div>
              <div className={styles.spotlightContent}>
                <div className={styles.spotlightContentPanel}>
                  <span className={styles.spotlightBadge}>{labels.latest}</span>
                  <h3 className={styles.spotlightTitle}>{latestProject.title}</h3>
                  <p className={styles.spotlightDesc}>{latestProject.shortDescription}</p>
                  <div className={styles.spotlightMeta}>
                    {latestProject.technologies.slice(0, 5).map((tech) => (
                      <span key={tech} className={styles.techPill}>
                        {tech}
                      </span>
                    ))}
                  </div>
                  <span className={styles.spotlightCta}>
                    {labels.viewProject}
                    <ArrowIcon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>

            <div className={styles.sideStack}>
              {sideProjects.map((project, index) => (
                <Link
                  key={project.id}
                  href={getProjectDetailHref(project)}
                  className={cn(styles.miniCard, index === 0 && styles.miniCardAccent)}
                >
                  <div className={styles.miniThumb}>
                    <Image
                      src={getProjectImageUrl(project.thumbnailUrl)}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  </div>
                  <h4 className={styles.miniTitle}>{project.title}</h4>
                  <p className={styles.miniDesc}>{project.shortDescription}</p>
                </Link>
              ))}

              <Link href="/order-project" className={cn(styles.miniCard, styles.miniCardAccent)}>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Wrench className="h-5 w-5" aria-hidden />
                </div>
                <h4 className={styles.miniTitle}>
                  {t('ctaCardTitle', 'Need a custom build?', 'پروژه اختصاصی می‌خواهید؟')}
                </h4>
                <p className={styles.miniDesc}>
                  {t(
                    'ctaCardDesc',
                    'Tell us your requirements and our team will plan, build, and deliver.',
                    'نیازمندی‌های خود را ثبت کنید تا تیم ما طراحی، توسعه و تحویل را انجام دهد.'
                  )}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {labels.orderProject}
                  <ArrowIcon className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className={styles.filterBar}>
          <div className={styles.filterTabs} role="tablist" aria-label={t('filterLabel', 'Filter projects', 'فیلتر پروژه‌ها')}>
            {(['newest', 'featured', 'completed'] as ProjectFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={cn(styles.filterTab, filter === key && styles.filterTabActive)}
                onClick={() => setFilter(key)}
              >
                {filterLabels[key]}
              </button>
            ))}
          </div>
          <p className={styles.filterHint}>
            {t('showingCount', 'Showing {count} projects', 'نمایش {count} پروژه').replace(
              '{count}',
              String(gridProjects.length)
            )}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            className={styles.grid}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {gridProjects.length > 0 ? (
              gridProjects.map((project) => (
                <ProjectGridCard key={project.id} project={project} lang={lang} />
              ))
            ) : (
              <p className={styles.emptyState}>
                {t('noProjects', 'No projects in this category yet.', 'پروژه‌ای در این دسته یافت نشد.')}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div variants={itemVariants} className={styles.bottomCta}>
          <Link href="/projects" className={showcaseStyles.viewAllBtn}>
            <Briefcase className="h-4 w-4" aria-hidden />
            {t('viewAll', 'View all projects', 'مشاهده همه پروژه‌ها')}
          </Link>
          <Link href="/order-project" className={styles.orderBtn}>
            {labels.orderProject}
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
