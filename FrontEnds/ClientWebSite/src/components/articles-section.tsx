'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Dictionary } from '@/lib/definitions';
import type { ArticleListItem } from '@/types';
import { cn } from '@/lib/utils';
import { ArticleCard } from './article-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { ShowcaseSectionBackground } from './showcase-section-background';
import showcaseStyles from './showcase-section.module.css';
import styles from './articles-section.module.css';

const getInitialArticles = (list: ArticleListItem[]): ArticlesState | null => {
  if (!list || list.length === 0) return null;
  const available = [...list];
  const get = (i: number) => available[i] || null;

  return {
    topLeft: get(0),
    rightTall: get(1),
    bottomLeft1: get(2),
    bottomLeft2: get(3),
  };
};

const getNewArticle = (list: ArticleListItem[], excludeIds: string[]): ArticleListItem | null => {
  if (list.length === 0) return null;
  const available = list.filter((a) => !excludeIds.includes(String(a.id)));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)] ?? null;
};

interface ArticlesSectionProps {
  dict: Dictionary;
  articles: ArticleListItem[];
}

type ArticleKey = 'topLeft' | 'rightTall' | 'bottomLeft1' | 'bottomLeft2';

type ArticlesState = {
  topLeft: ArticleListItem | null;
  rightTall: ArticleListItem | null;
  bottomLeft1: ArticleListItem | null;
  bottomLeft2: ArticleListItem | null;
};

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ArticlesSection({ dict, articles: propArticles }: ArticlesSectionProps) {
  const sectionDict = (dict.articlesSection ?? {}) as Record<string, string>;
  const lang: 'en' | 'fa' = (dict as { header: { articles?: string } }).header.articles === 'Articles' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const articleList = propArticles;
  const [articles, setArticles] = useState<ArticlesState | null>(null);
  const [mounted, setMounted] = useState(false);

  const t = (key: string, fallbackEn: string, fallbackFa: string) =>
    sectionDict[key] ?? (lang === 'en' ? fallbackEn : fallbackFa);

  useEffect(() => {
    setMounted(true);
    setArticles(getInitialArticles(articleList));
  }, [articleList]);

  useEffect(() => {
    if (!mounted || articleList.length <= 4) return;

    const intervalId = setInterval(() => {
      setArticles((prevArticles) => {
        if (!prevArticles) return prevArticles;
        const articleKeys: ArticleKey[] = ['topLeft', 'rightTall', 'bottomLeft1', 'bottomLeft2'];
        const activeKeys = articleKeys.filter((k) => prevArticles[k] !== null);
        if (activeKeys.length === 0) return prevArticles;

        const keyToUpdate = activeKeys[Math.floor(Math.random() * activeKeys.length)] as ArticleKey;
        const currentIds = Object.values(prevArticles)
          .filter((a): a is ArticleListItem => a !== null)
          .map((a) => String(a.id));

        const newArticle = getNewArticle(articleList, currentIds);
        if (!newArticle) return prevArticles;

        return { ...prevArticles, [keyToUpdate]: newArticle };
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [articleList, mounted]);

  const renderArticleCard = (
    article: ArticleListItem | null,
    key: ArticleKey,
    slotClassName: string
  ) => {
    if (!mounted) {
      return <Skeleton className={cn('min-h-[18rem] rounded-2xl', slotClassName)} />;
    }
    if (article === null) return null;

    return (
      <motion.div key={key} className={slotClassName} variants={cardVariants}>
        <AnimatePresence mode="wait">
          <motion.div
            key={String(article.id)}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45 }}
            className={styles.cardWrap}
          >
            <ArticleCard article={article} dict={dict} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  };

  if (mounted && articleList.length === 0) return null;

  return (
    <motion.section
      dir={isRtl ? 'rtl' : 'ltr'}
      className={showcaseStyles.section}
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
    >
      <ShowcaseSectionBackground variant="articles" />

      <div className={showcaseStyles.inner}>
        <motion.div variants={titleVariants}>
          <span className={showcaseStyles.eyebrow}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {t('eyebrow', 'Insights', 'بینش‌ها')}
          </span>

          <div className={showcaseStyles.headerRow}>
            <div>
              <h2 className={showcaseStyles.title}>
                {sectionDict.title ?? t('title', 'Latest Articles', 'آخرین مقالات')}
              </h2>
              <p className={cn(showcaseStyles.subtitle, isRtl && 'font-subtitle')}>
                {sectionDict.subtitle ??
                  t(
                    'subtitle',
                    'Explore the latest insights and trends in the tech world from our experts.',
                    'آخرین بینش‌ها و روندهای دنیای فناوری را از متخصصان ما کاوش کنید.'
                  )}
              </p>
            </div>
            <Link href="/articles" className={showcaseStyles.viewAllBtn}>
              {t('viewAll', 'View all articles', 'مشاهده همه مقالات')}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div variants={titleVariants} className={styles.gridPanel}>
          <motion.div variants={gridVariants} className={styles.bentoGrid}>
            {articles ? (
              <>
                {renderArticleCard(articles.topLeft, 'topLeft', styles.cardSlotWide)}
                {renderArticleCard(articles.rightTall, 'rightTall', styles.cardSlotTall)}
                {renderArticleCard(articles.bottomLeft1, 'bottomLeft1', styles.cardSlot)}
                {renderArticleCard(articles.bottomLeft2, 'bottomLeft2', styles.cardSlot)}
              </>
            ) : (
              <>
                <Skeleton className={cn('min-h-[18rem] rounded-2xl', styles.cardSlotWide)} />
                <Skeleton className={cn('min-h-[18rem] rounded-2xl', styles.cardSlotTall)} />
                <Skeleton className={cn('min-h-[18rem] rounded-2xl', styles.cardSlot)} />
                <Skeleton className={cn('min-h-[18rem] rounded-2xl', styles.cardSlot)} />
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
