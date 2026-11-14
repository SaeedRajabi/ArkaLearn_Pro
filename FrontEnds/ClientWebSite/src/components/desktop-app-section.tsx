'use client';

import * as React from 'react';
import { Download, Loader2, Monitor, Shield, Video } from 'lucide-react';
import type { Dictionary } from '@/types';
import { checkDesktopAppUpdate } from '@/lib/api/desktop-app';
import { cn } from '@/lib/utils';
import styles from './desktop-app-section.module.css';

export function DesktopAppSection({ dict }: { dict: Dictionary }) {
  const isEnglish = dict.header?.courses === 'Courses';
  const section = (dict.desktopAppSection ?? {}) as Record<string, string>;

  const t = (key: string, en: string, fa: string) => section[key] ?? (isEnglish ? en : fa);

  const content = {
    eyebrow: t('eyebrow', 'ArkaSoftware Desktop', 'اپلیکیشن دسکتاپ آرکا نرم‌افزار'),
    title: t(
      'title',
      'Learn with the Windows app built for real courses',
      'با اپلیکیشن ویندوز، یادگیری واقعی را تجربه کنید'
    ),
    subtitle: t(
      'subtitle',
      'Secure video playback, desktop licenses, and remote assist — the core strength of ArkaSoftware education.',
      'پخش امن ویدیو، لایسنس دسکتاپ و کمک از راه دور؛ نقطه قوت سیستم آموزش آرکا نرم‌افزار.'
    ),
    cta: t('cta', 'Download for Windows', 'دانلود برای ویندوز'),
    loading: t('loading', 'Fetching download…', 'در حال دریافت لینک…'),
    unavailable: t(
      'unavailable',
      'Installer is not published yet. Check back soon.',
      'نصب‌کننده هنوز منتشر نشده است. به‌زودی در دسترس خواهد بود.'
    ),
    version: t('version', 'Latest version', 'آخرین نسخه'),
    features: [
      {
        icon: Video,
        title: t('featureSecureTitle', 'Secure playback', 'پخش امن'),
        text: t(
          'featureSecureText',
          'Protected course videos designed for licensed desktop learning.',
          'ویدیوهای دوره‌ها با حفاظت لایسنس روی دسکتاپ پخش می‌شوند.'
        ),
      },
      {
        icon: Shield,
        title: t('featureLicenseTitle', 'Desktop license', 'لایسنس دسکتاپ'),
        text: t(
          'featureLicenseText',
          'Activate enrolled courses with your personal desktop license key.',
          'دوره‌های ثبت‌نام‌شده را با لایسنس شخصی خود فعال کنید.'
        ),
      },
      {
        icon: Monitor,
        title: t('featureAssistTitle', 'Remote assist', 'کمک از راه دور'),
        text: t(
          'featureAssistText',
          'Students and teachers connect for guided help on the same Windows app.',
          'دانشجو و استاد برای راهنمایی مستقیم روی همان اپ ویندوز متصل می‌شوند.'
        ),
      },
    ],
  };

  const [loading, setLoading] = React.useState(true);
  const [installerUrl, setInstallerUrl] = React.useState<string | null>(null);
  const [latestVersion, setLatestVersion] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const info = await checkDesktopAppUpdate('0.0.0');
      if (cancelled) return;
      setInstallerUrl(info?.installerUrl ?? null);
      setLatestVersion(info?.latestVersion ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.section} dir={isEnglish ? 'ltr' : 'rtl'} aria-labelledby="desktop-app-heading">
      <div className="container mx-auto px-4 sm:px-6">
        <div className={styles.panel}>
          <div className={styles.glow} aria-hidden />
          <div className={styles.grid}>
            <div className={styles.copy}>
              <span className={styles.eyebrow}>{content.eyebrow}</span>
              <h2 id="desktop-app-heading" className={styles.title}>
                {content.title}
              </h2>
              <p className={cn(styles.subtitle, !isEnglish && 'font-subtitle')}>{content.subtitle}</p>

              <div className={styles.ctaRow}>
                {loading ? (
                  <span className={styles.loading}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {content.loading}
                  </span>
                ) : installerUrl ? (
                  <a
                    href={installerUrl}
                    rel="noreferrer"
                    className={styles.cta}
                    download={
                      latestVersion
                        ? `ArkaSoftwareDesktop-${latestVersion}.msi`
                        : 'ArkaSoftwareDesktop.msi'
                    }
                  >
                    <Download className="h-4 w-4" />
                    {content.cta}
                  </a>
                ) : (
                  <span className={styles.unavailable}>{content.unavailable}</span>
                )}
                {latestVersion ? (
                  <span className={styles.version} dir="ltr">
                    {content.version} {latestVersion}
                  </span>
                ) : null}
              </div>
            </div>

            <ul className={styles.features}>
              {content.features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.title} className={styles.featureItem}>
                    <span className={styles.featureIcon}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className={styles.featureTitle}>{feature.title}</h3>
                      <p className={styles.featureText}>{feature.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
