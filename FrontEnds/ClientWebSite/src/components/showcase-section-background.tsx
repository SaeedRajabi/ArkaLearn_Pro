import { cn } from '@/lib/utils';
import styles from './showcase-section.module.css';

const WAVE_PATH =
  'M752.5 51.9c-4.5 3.9-8.9 7.8-13.4 11.8-51.5 45.3-104.8 92.2-171.7 101.4-39.9 5.5-80.2-3.4-119.2-12.1-32.3-7.2-65.6-14.6-98.9-13.9-66.5 1.3-128.9 35.2-175.7 64.6-11.9 7.5-23.9 15.3-35.5 22.8-40.5 26.4-82.5 53.8-128.4 70.7-2.1.8-4.2 1.5-6.2 2.2L0 301.9';

interface ShowcaseSectionBackgroundProps {
  variant?: 'default' | 'articles' | 'courses';
}

export function ShowcaseSectionBackground({ variant = 'default' }: ShowcaseSectionBackgroundProps) {
  return (
    <>
      <div
        className={cn(
          styles.bgBase,
          variant === 'articles' && styles.bgArticles,
          variant === 'courses' && styles.bgCourses
        )}
        aria-hidden
      />
      <div className={styles.bgGrid} aria-hidden />
      <div
        className={cn(
          styles.bgOrb1,
          variant === 'articles' && styles.orbArticles1,
          variant === 'courses' && styles.orbCourses1
        )}
        aria-hidden
      />
      <div
        className={cn(
          styles.bgOrb2,
          variant === 'articles' && styles.orbArticles2,
          variant === 'courses' && styles.orbCourses2
        )}
        aria-hidden
      />

      <svg className={styles.waveTop} viewBox="0 0 822.2 301.9" fill="none" aria-hidden>
        <path d={WAVE_PATH} stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg className={styles.waveBottom} viewBox="0 0 822.2 301.9" fill="none" aria-hidden>
        <path d={WAVE_PATH} stroke="currentColor" strokeWidth="2" />
      </svg>
    </>
  );
}
