'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Megaphone,
  Newspaper,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getDictValue } from '@/lib/i18n-client';
import {
  getMyTeacherXpSummary,
  redeemXpFreeMonth,
  type MyTeacherXpSummary,
} from '@/lib/api/advertisement-monetization';
import type { Dictionary } from '@/types';
import styles from './professor-xp-panel.module.css';

function reasonLabel(reason: string, t: (key: string, fb: string) => string) {
  const map: Record<string, string> = {
    SaveAdvertisement: t('professorDashboard.xp.reasonSaveAd', 'Saved advertisement'),
    SaveVideo: t('professorDashboard.xp.reasonSaveVideo', 'Saved promotional video'),
    SaveBook: t('professorDashboard.xp.reasonSaveBook', 'Saved book'),
    PublishCourse: t('professorDashboard.xp.reasonPublishCourse', 'Published course'),
    PublishArticle: t('professorDashboard.xp.reasonPublishArticle', 'Published article'),
    PortfolioArticle: t('professorDashboard.xp.reasonPortfolioArticle', 'Added portfolio article'),
    RedeemFreeMonth: t('professorDashboard.xp.reasonRedeem', 'Redeemed free month'),
  };
  return map[reason] ?? reason;
}

const REWARD_ICONS = {
  ad: Megaphone,
  video: Video,
  book: BookOpen,
  course: GraduationCap,
  article: Newspaper,
  portfolio: Star,
} as const;

let cachedXpSummary: MyTeacherXpSummary | null = null;

export function ProfessorXpPanel({ dict }: { dict: Dictionary }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(!cachedXpSummary);
  const [redeeming, setRedeeming] = React.useState(false);
  const [summary, setSummary] = React.useState<MyTeacherXpSummary | null>(cachedXpSummary);
  const lang = String((dict as Record<string, unknown>).lang ?? 'fa');
  const localeTag = lang === 'fa' ? 'fa-IR' : 'en-US';
  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const load = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent && !cachedXpSummary) {
      setLoading(true);
    }
    try {
      const next = await getMyTeacherXpSummary();
      cachedXpSummary = next;
      setSummary(next);
    } catch {
      if (!cachedXpSummary) {
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load({ silent: !!cachedXpSummary });
  }, [load]);

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      await redeemXpFreeMonth();
      toast({ title: t('professorDashboard.adPlans.xpRedeemed', 'One free month activated!') });
      await load();
    } catch {
      toast({ title: t('professorDashboard.adPlans.xpRedeemError', 'Not enough XP'), variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <section className={styles.root} aria-labelledby="professor-xp-title">
        <div className={styles.loading}>
          <p className="mb-3 text-sm text-muted-foreground">
            {t('professorDashboard.xp.loadError', 'Could not load XP data.')}
          </p>
          <Button type="button" variant="outline" onClick={() => void load()}>
            {t('professorDashboard.xp.retry', 'Try again')}
          </Button>
        </div>
      </section>
    );
  }

  const progress =
    summary.xpNextFreeMonthThreshold > 0
      ? Math.min(100, (summary.experiencePoints / summary.xpNextFreeMonthThreshold) * 100)
      : 0;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (progress / 100) * circumference;

  const rewardRows = [
    { key: 'ad', icon: REWARD_ICONS.ad, label: t('professorDashboard.xp.rewardSaveAd', 'Register advertisement'), value: summary.rewards.saveAdvertisement },
    { key: 'video', icon: REWARD_ICONS.video, label: t('professorDashboard.xp.rewardSaveVideo', 'Add promotional video'), value: summary.rewards.saveVideo },
    { key: 'book', icon: REWARD_ICONS.book, label: t('professorDashboard.xp.rewardSaveBook', 'Add book'), value: summary.rewards.saveBook },
    { key: 'course', icon: REWARD_ICONS.course, label: t('professorDashboard.xp.rewardPublishCourse', 'Publish course'), value: summary.rewards.publishCourse },
    { key: 'article', icon: REWARD_ICONS.article, label: t('professorDashboard.xp.rewardPublishArticle', 'Publish article'), value: summary.rewards.publishArticle },
    { key: 'portfolio', icon: REWARD_ICONS.portfolio, label: t('professorDashboard.xp.rewardPortfolioArticle', 'Portfolio article'), value: summary.rewards.portfolioArticle },
  ].filter((row) => row.value > 0);

  return (
    <section className={styles.root} aria-labelledby="professor-xp-title">
      <div className={styles.glow} aria-hidden />
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconBadge}>
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 id="professor-xp-title" className={styles.title}>
              {t('professorDashboard.xp.title', 'Experience points (XP)')}
            </h2>
            <p className={styles.subtitle}>
              {t('professorDashboard.xp.subtitle', 'Earn XP from activity and redeem for a free advertisement month.')}
            </p>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.heroGrid}>
          <div className={styles.xpHero}>
            <div className={styles.ringWrap}>
              <svg className={styles.ringSvg} viewBox="0 0 100 100" aria-hidden>
                <defs>
                  <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(271 81% 56%)" />
                  </linearGradient>
                </defs>
                <circle className={styles.ringTrack} cx="50" cy="50" r="42" />
                <circle
                  className={styles.ringProgress}
                  cx="50"
                  cy="50"
                  r="42"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className={styles.ringCenter}>
                <span className={styles.xpValue}>
                  {summary.experiencePoints.toLocaleString(localeTag)}
                </span>
                <span className={styles.xpLabel}>{t('professorDashboard.xp.badge', 'XP')}</span>
              </div>
            </div>

            <div className={styles.meta}>
              <span className={styles.threshold}>
                {t('professorDashboard.adPlans.xpNext', 'Next free month')}:{' '}
                <span className={styles.thresholdValue}>
                  {summary.xpNextFreeMonthThreshold.toLocaleString(localeTag)}{' '}
                  {t('professorDashboard.xp.badge', 'XP')}
                </span>
              </span>
              <p className={styles.freePlan}>
                {Math.round(progress)}% {t('professorDashboard.xp.progressLabel', 'toward next reward')}
              </p>
              {summary.xpFreePlanUntilUtc ? (
                <p className={styles.freePlan}>
                  {t('professorDashboard.xp.freePlanUntil', 'XP free plan until')}:{' '}
                  {new Date(summary.xpFreePlanUntilUtc).toLocaleDateString(localeTag)}
                </p>
              ) : null}
              <div className={styles.actions}>
                {summary.canRedeemFreeMonth ? (
                  <Button onClick={() => void handleRedeem()} disabled={redeeming}>
                    {redeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('professorDashboard.adPlans.redeemXp', 'Use XP for 1 free month')}
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/professor/advertisement-plans">
                    {t('professorDashboard.adPlans.viewPlans', 'View plans & upgrade')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.rewardsCard}>
            <h3 className={styles.rewardsTitle}>{t('professorDashboard.xp.howToEarn', 'How to earn XP')}</h3>
            <p className={styles.rewardsNote}>
              {t(
                'professorDashboard.xp.oneTimeNote',
                'Each activity below grants XP only once — editing the same item does not add more points.'
              )}
            </p>
            <div className={styles.rewardGrid}>
              {rewardRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.key} className={styles.rewardItem}>
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    <span className={styles.rewardLabel}>{row.label}</span>
                    <span className={styles.rewardValue}>+{row.value.toLocaleString(localeTag)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.activitySection}>
          <h3 className={styles.activityTitle}>{t('professorDashboard.xp.recentActivity', 'Recent XP activity')}</h3>
          {summary.recentEvents.length === 0 ? (
            <p className={styles.emptyActivity}>{t('professorDashboard.xp.noActivity', 'No XP activity yet.')}</p>
          ) : (
            <ul className={styles.activityList}>
              {summary.recentEvents.map((event) => (
                <li key={event.id} className={styles.activityItem}>
                  <div className={styles.activityMain}>
                    <p className={styles.activityReason}>{reasonLabel(event.reason, t)}</p>
                    <p className={styles.activityTime}>
                      {new Date(event.occurredAtUtc).toLocaleString(localeTag)}
                    </p>
                  </div>
                  <span
                    className={`${styles.activityAmount} ${
                      event.amount >= 0 ? styles.amountPositive : styles.amountNegative
                    }`}
                  >
                    {event.amount >= 0 ? `+${event.amount}` : event.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
