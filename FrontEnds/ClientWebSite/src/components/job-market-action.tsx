import Image from 'next/image';
import Link from 'next/link';
import type { Dictionary } from '@/types';
import { cn } from '@/lib/utils';
import styles from './job-market-action.module.css';

const clientLogos = [
  { src: '/images/clients/android.svg', alt: 'Android' },
  { src: '/images/clients/envato.svg', alt: 'Envato' },
  { src: '/images/clients/microsoft.svg', alt: 'Microsoft' },
  { src: '/images/clients/netflix.svg', alt: 'Netflix' },
  { src: '/images/clients/google.svg', alt: 'Google' },
  { src: '/images/clients/linkedin.svg', alt: 'LinkedIn' },
];

export function JobMarketAction({ dict }: { dict: Dictionary }) {
  const isEnglish = dict.header.courses === 'Courses';
  const sectionDict = (dict.jobMarketSection ?? {}) as Record<string, string>;

  const t = (key: string, en: string, fa: string) =>
    sectionDict[key] ?? (isEnglish ? en : fa);

  const content = {
    title: t('title', 'Register to enter the job market', 'برای ورود به بازار کار ثبت‌نام کنید'),
    subtitle: t(
      'subtitle',
      'Learn practical skills, build your portfolio, and prepare for real job opportunities.',
      'مهارت‌های کاربردی یاد بگیرید، نمونه‌کار بسازید و برای فرصت‌های شغلی واقعی آماده شوید.'
    ),
    cta: t('cta', 'Get Started Now!', 'همین حالا شروع کنید'),
    partnersEyebrow: t('partnersEyebrow', 'Trusted ecosystem', 'اکوسیستم معتبر'),
    partnersTitle: t('partnersTitle', 'Learners & builders use industry-standard tools', 'ابزارهای استاندارد صنعت'),
    partnersSubtitle: t(
      'partnersSubtitle',
      'Technologies and platforms aligned with real-world careers.',
      'فناوری‌ها و پلتفرم‌هایی که با بازار کار واقعی هم‌راستا هستند.'
    ),
  };

  return (
    <section className={styles.section}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className={cn(styles.ctaWrap, 'relative z-10')}>
          <div className="pointer-events-none absolute bottom-0 start-3 z-10 hidden lg:block xl:start-12">
            <Image
              src="/images/elements/01.svg"
              alt=""
              width={230}
              height={230}
              className="max-h-56 w-auto object-contain"
            />
          </div>

          <Image
            src="/images/clients/pencil.svg"
            alt=""
            width={70}
            height={70}
            className="pointer-events-none absolute -top-6 end-8 z-20 hidden h-14 w-14 sm:block"
          />
          <Image
            src="/images/clients/graduated.svg"
            alt=""
            width={70}
            height={70}
            className="pointer-events-none absolute -bottom-7 start-1/2 z-20 hidden h-16 w-16 -translate-x-1/2 rotate-[74deg] sm:block"
          />

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-orange-400 p-6 shadow-xl sm:p-10 lg:ps-72">
            <svg
              aria-hidden="true"
              className="absolute start-0 top-3 h-48 w-[42rem] text-white/10"
              viewBox="0 0 818.6 235.1"
              fill="currentColor"
            >
              <path d="M735 226.3c-5.7.6-11.5 1.1-17.2 1.7-66.2 6.8-134.7 13.7-192.6-16.6-34.6-18.1-61.4-47.9-87.3-76.7-21.4-23.8-43.6-48.5-70.2-66.7-53.2-36.4-121.6-44.8-175.1-48-13.6-.8-27.5-1.4-40.9-1.9-46.9-1.9-95.4-3.9-141.2-16.5C8.3 1.2 6.2.6 4.2 0H0c3.3 1 6.6 2 10 3 46 12.5 94.5 14.6 141.5 16.5 13.4.6 27.3 1.1 40.8 1.9 53.4 3.2 121.5 11.5 174.5 47.7 26.5 18.1 48.6 42.7 70 66.5 26 28.9 52.9 58.8 87.7 76.9 58.3 30.5 127 23.5 193.3 16.7 5.8-.6 11.5-1.2 17.2-1.7 26.2-2.6 55-4.2 83.5-2.2v-1.2C790 222 761.2 223.7 735 226.3z" />
            </svg>
            <div className="absolute end-0 top-1/2 hidden h-72 w-72 -translate-y-1/2 rounded-full border-[18px] border-red-500/25 lg:block" />

            <div className="relative grid gap-6 text-center sm:text-start md:grid-cols-[1fr_auto] md:items-center md:gap-10">
              <div>
                <h2 className="font-headline text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {content.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
                  {content.subtitle}
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-white/95"
              >
                {content.cta}
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.partnersBlock} dir={isEnglish ? 'ltr' : 'rtl'}>
          <div className={styles.partnersPanel}>
            <div className={styles.partnersHeader}>
              <span className={styles.partnersEyebrow}>{content.partnersEyebrow}</span>
              <h3 className={styles.partnersTitle}>{content.partnersTitle}</h3>
              <p className={cn(styles.partnersSubtitle, !isEnglish && 'font-subtitle')}>
                {content.partnersSubtitle}
              </p>
            </div>

            <div className={styles.logoGrid}>
              {clientLogos.map((logo) => (
                <div key={logo.alt} className={styles.logoCell}>
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={150}
                    height={48}
                    className={styles.logoImage}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
