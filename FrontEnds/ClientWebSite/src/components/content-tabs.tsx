'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CourseListItem } from '@/types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, GraduationCap, Star, Users } from 'lucide-react';
import { ShowcaseSectionBackground } from './showcase-section-background';
import showcaseStyles from './showcase-section.module.css';
import styles from './content-tabs.module.css';
import { RemoteImage } from '@/components/shared/remote-image';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { getCourseUrl } from '@/lib/course-slug';
import { CoursePriceDisplay } from '@/components/shared/course-price-display';

type CourseFilter = 'newest' | 'popular' | 'bestseller';

interface ContentTabsProps {
  dict: Record<string, unknown>;
  courses: CourseListItem[];
}

const SHOWCASE_COUNT = 3;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function courseLevelLabel(
  level: string | undefined,
  levels: Record<string, string> | undefined,
  lang: 'fa' | 'en'
): string {
  const l = (level ?? '').toLowerCase();
  const key =
    l.includes('adv') || l.includes('پیشرفته')
      ? 'advanced'
      : l.includes('inter') || l.includes('میان')
        ? 'intermediate'
        : 'introductory';
  return levels?.[key] ?? (lang === 'fa' ? 'مقدماتی' : 'Beginner');
}

function formatRating(rating?: number): string | null {
  if (rating == null || rating <= 0) return null;
  return Number(rating).toFixed(1);
}

export default function ContentTabs({ dict, courses: propCourses }: ContentTabsProps) {
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('newest');
  const reduceMotion = useReducedMotion();
  const sectionDict = (dict.coursesSection ?? {}) as Record<string, string>;
  const levels = (dict.levels ?? {}) as Record<string, string>;
  const homeDict = (dict.home ?? {}) as Record<string, string>;
  const lang: 'fa' | 'en' =
    (dict as { header: { courses?: string } }).header.courses === 'Courses' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const freeLabel = homeDict.free ?? (lang === 'fa' ? 'رایگان' : 'Free');

  const t = (key: string, fallbackEn: string, fallbackFa: string) =>
    sectionDict[key] ?? (lang === 'en' ? fallbackEn : fallbackFa);

  const filteredCourses = useMemo(() => {
    switch (courseFilter) {
      case 'popular':
        return [...propCourses].sort((a, b) => (b.studentCount ?? 0) - (a.studentCount ?? 0));
      case 'bestseller':
        return [...propCourses].sort(
          (a, b) => (b.studentCount ?? 0) * (b.rating ?? 0) - (a.studentCount ?? 0) * (a.rating ?? 0)
        );
      case 'newest':
      default:
        return propCourses;
    }
  }, [propCourses, courseFilter]);

  const showcaseCourses = filteredCourses.slice(0, SHOWCASE_COUNT);
  const featured = showcaseCourses[0];
  const sideCourses = showcaseCourses.slice(1, SHOWCASE_COUNT);

  const filterLabels: Record<CourseFilter, string> = {
    newest: t('newest', 'Newest', 'جدیدترین'),
    popular: t('popular', 'Most Popular', 'محبوب‌ترین'),
    bestseller: t('bestsellers', 'Bestsellers', 'پرفروش‌ترین'),
  };

  if (propCourses.length === 0 || !featured) return null;

  const featuredUrl = getCourseUrl({
    id: featured.id,
    slug: featured.slug,
    title: featured.title,
  });
  const featuredRating = formatRating(featured.rating);

  return (
    <motion.section
      dir={isRtl ? 'rtl' : 'ltr'}
      className={showcaseStyles.section}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      variants={containerVariants}
    >
      <ShowcaseSectionBackground variant="courses" />

      <div className={showcaseStyles.inner}>
        <motion.div variants={itemVariants}>
          <span className={showcaseStyles.eyebrow}>
            <GraduationCap className="h-3.5 w-3.5" aria-hidden />
            {t('eyebrow', 'Learning', 'یادگیری')}
          </span>

          <div className={showcaseStyles.headerRow}>
            <div>
              <h2 className={showcaseStyles.title}>
                {sectionDict.title ?? t('title', 'Explore Our Courses', 'دوره‌های ما را کاوش کنید')}
              </h2>
              <p className={cn(showcaseStyles.subtitle, isRtl && 'font-subtitle')}>
                {sectionDict.subtitle ??
                  t(
                    'subtitle',
                    'A curated showcase of standout courses — then browse the full catalog.',
                    'ویترین منتخب دوره‌های شاخص؛ برای دیدن همه، کاتالوگ کامل را باز کنید.'
                  )}
              </p>
            </div>
            <Link href="/courses" className={showcaseStyles.viewAllBtn}>
              {t('viewAll', 'View all courses', 'مشاهده همه دوره‌ها')}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={styles.filterBar}>
          <div
            className={styles.filterTabs}
            role="tablist"
            aria-label={t('filterLabel', 'Filter courses', 'فیلتر دوره‌ها')}
          >
            {(['newest', 'popular', 'bestseller'] as CourseFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={courseFilter === key}
                className={cn(styles.filterTab, courseFilter === key && styles.filterTabActive)}
                onClick={() => setCourseFilter(key)}
              >
                {filterLabels[key]}
              </button>
            ))}
          </div>
          <p className={styles.filterHint}>
            {t('showingCount', 'Showcase of {count} courses', 'ویترین {count} دوره').replace(
              '{count}',
              String(showcaseCourses.length)
            )}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={courseFilter}
            className={styles.vitrine}
            dir={isRtl ? 'rtl' : 'ltr'}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.32 }}
          >
            <Link href={featuredUrl} className={styles.spotlight}>
              <div className={styles.spotlightMedia}>
                <RemoteImage
                  src={getCourseImageUrl(featured.titleImage)}
                  alt={featured.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  className={styles.spotlightImage}
                  data-ai-hint={featured.title}
                />
                <div className={styles.spotlightScrim} />
                <div className={styles.spotlightShine} aria-hidden />
              </div>

              <div className={styles.spotlightTop}>
                <span className={styles.rankChip}>01</span>
                <span className={styles.spotlightBadge}>
                  {t('featuredBadge', 'Featured', 'ویژه')}
                </span>
              </div>

              <div className={styles.spotlightBottom}>
                <p className={styles.spotlightCategory}>{featured.categoryName}</p>
                <h3 className={styles.spotlightTitle}>{featured.title}</h3>
                {featured.shortDescription ? (
                  <p className={styles.spotlightDesc}>{featured.shortDescription}</p>
                ) : null}
                <div className={styles.spotlightMeta}>
                  <span className={styles.metaPill}>
                    {courseLevelLabel(featured.courseLevel, levels, lang)}
                  </span>
                  {featuredRating ? (
                    <span className={styles.metaPill}>
                      <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                      {featuredRating}
                    </span>
                  ) : null}
                  <span className={styles.metaPill}>
                    <Users className="h-3.5 w-3.5" />
                    {featured.studentCount}
                  </span>
                </div>
                <div className={styles.spotlightFooter}>
                  <CoursePriceDisplay
                    price={featured.price ?? 0}
                    originalPrice={featured.originalPrice}
                    lang={lang}
                    freeLabel={freeLabel}
                    size="md"
                    className={styles.spotlightPrice}
                  />
                  <span className={styles.spotlightCta}>
                    {t('viewCourse', 'View course', 'مشاهده دوره')}
                    <ArrowIcon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>

            <div className={styles.sideStack}>
              {sideCourses.map((course, index) => {
                const url = getCourseUrl({
                  id: course.id,
                  slug: course.slug,
                  title: course.title,
                });
                const rating = formatRating(course.rating);
                const rank = String(index + 2).padStart(2, '0');

                return (
                  <Link key={course.id} href={url} className={styles.sideCard}>
                    <div className={styles.sideMedia}>
                      <RemoteImage
                        src={getCourseImageUrl(course.titleImage)}
                        alt={course.title}
                        fill
                        sizes="(max-width: 1024px) 50vw, 28vw"
                        className={styles.sideImage}
                        data-ai-hint={course.title}
                      />
                      <div className={styles.sideScrim} />
                      <span className={styles.rankChip}>{rank}</span>
                    </div>
                    <div className={styles.sideBody}>
                      <p className={styles.sideCategory}>{course.categoryName}</p>
                      <h4 className={styles.sideTitle}>{course.title}</h4>
                      <div className={styles.sideFooter}>
                        <CoursePriceDisplay
                          price={course.price ?? 0}
                          originalPrice={course.originalPrice}
                          lang={lang}
                          freeLabel={freeLabel}
                          size="sm"
                        />
                        <div className={styles.sideStats}>
                          {rating ? (
                            <span className={styles.sideRating}>
                              <Star className="h-3.5 w-3.5 fill-current" />
                              {rating}
                            </span>
                          ) : null}
                          <span className={styles.sideStudents}>
                            <Users className="h-3.5 w-3.5" />
                            {course.studentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
