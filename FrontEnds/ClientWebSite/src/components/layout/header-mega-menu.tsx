'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { headerNavItems, resolveNavLabel } from '@/lib/nav-config';
import type { CategoryTreeItem } from '@/lib/api/categories';
import type { MegaMenuFeaturedMap } from '@/lib/header-mega-data';
import { CategoryTreePanel } from './category-tree-panel';
import { UnderlineScribble } from '@/components/icons/underline-scribble';
import { AngularLogo } from '@/components/icons/angular-logo';
import { ReactLogo } from '@/components/icons/react-logo';
import { PythonLogo } from '@/components/icons/python-logo';
import { FigmaLogo } from '@/components/icons/figma-logo';
import { HeaderMenuPortal } from './header-menu-portal';
import { useHoverFlyout } from './use-hover-flyout';
import styles from './site-nav.module.css';

type Props = {
  lang: 'en' | 'fa';
  headerDic: Record<string, string | undefined>;
  categoryTree: CategoryTreeItem[];
  featuredByCategoryId: MegaMenuFeaturedMap;
};

const MEGA_DECOR_ICONS = [
  { src: '/images/clients/angular.svg', className: styles.megaFloatIcon1 },
  { src: '/images/clients/figma.svg', className: styles.megaFloatIcon2 },
  { src: '/images/elements/07.svg', className: styles.megaFloatIcon3 },
  { src: '/images/elements/30.svg', className: styles.megaFloatIcon4 },
  { src: '/images/elements/16.svg', className: styles.megaFloatIcon5 },
];

export function HeaderMegaMenu({
  lang,
  headerDic,
  categoryTree,
  featuredByCategoryId,
}: Props) {
  const isRtl = lang === 'fa';
  const label = (key: string) => resolveNavLabel(headerDic, key, lang);
  const megaLabel = headerDic.megaMenu ?? (isRtl ? 'مگامنو' : 'Mega menu');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { open, openFlyout, closeFlyout, toggleFlyout } = useHoverFlyout();

  const quickLinks = headerNavItems.flatMap((item) =>
    item.type === 'link'
      ? [{ href: item.href, label: label(item.labelKey), icon: item.icon }]
      : item.items.map((child) => ({
          href: child.href,
          label: label(child.labelKey),
          icon: child.icon,
        }))
  );

  return (
    <div
      className={cn(styles.megaRoot, open && styles.megaRootOpen)}
      onMouseEnter={openFlyout}
      onMouseLeave={closeFlyout}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(styles.dropdownTrigger, isRtl && styles.dropdownTriggerRtl)}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggleFlyout}
      >
        <Sparkles className={styles.navIcon} aria-hidden />
        <span>{megaLabel}</span>
        <ChevronDown className={styles.dropdownIcon} aria-hidden />
      </button>

      <HeaderMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="center"
        isRtl={isRtl}
        placement="below"
        className={styles.megaPanelPortal}
        role="menu"
        onMouseEnter={openFlyout}
        onMouseLeave={closeFlyout}
      >
        <div className={styles.megaPanelShell}>
          <div className={styles.megaDecorLayer} aria-hidden>
            <div className={styles.megaDecorGradient} />
            <div className={styles.megaDecorGrid} />
            <div className={styles.megaDecorLineA} />
            <div className={styles.megaDecorLineB} />
            <div className={styles.megaDecorLineC} />
            <UnderlineScribble className={styles.megaDecorScribble} />
            {MEGA_DECOR_ICONS.map((icon) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={icon.src} src={icon.src} alt="" className={icon.className} />
            ))}
            <div className={styles.megaLogoBadge1}>
              <ReactLogo className={styles.megaLogoIcon} />
            </div>
            <div className={styles.megaLogoBadge2}>
              <AngularLogo className={styles.megaLogoIcon} />
            </div>
            <div className={styles.megaLogoBadge3}>
              <PythonLogo className={styles.megaLogoIcon} />
            </div>
            <div className={styles.megaLogoBadge4}>
              <FigmaLogo className={styles.megaLogoIcon} />
            </div>
          </div>

          <div className={cn(styles.megaPanelLayout, isRtl && styles.megaPanelLayoutRtl)}>
            <aside className={styles.megaHero}>
              <div className={styles.megaHeroBadge}>
                <Sparkles className={styles.megaHeroBadgeIcon} aria-hidden />
                <span>{isRtl ? 'مسیر یادگیری' : 'Learning path'}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/elements/add-course.svg"
                alt=""
                className={styles.megaHeroImage}
              />
              <h3 className={styles.megaHeroTitle}>
                {headerDic.megaHeroTitle ??
                  (isRtl ? 'یادگیری حرفه‌ای برنامه‌نویسی' : 'Professional programming learning')}
              </h3>
              <p className={styles.megaHeroText}>
                {headerDic.megaHeroText ??
                  (isRtl
                    ? 'دسته‌بندی‌ها را مرور کنید و برترین محتوا را ببینید'
                    : 'Browse categories and discover top-rated content')}
              </p>
              <Link href="/courses" className={styles.megaHeroLink}>
                {headerDic.megaCta ?? (isRtl ? 'شروع یادگیری' : 'Start learning')}
              </Link>
            </aside>

            <div className={styles.megaMain}>
              <div className={styles.megaCategorySection}>
                <div className={styles.megaCategoryHeader}>
                  <h3 className={styles.megaHeading}>
                    {headerDic.browseCategories ?? (isRtl ? 'دسته‌بندی‌ها' : 'Categories')}
                  </h3>
                  <p className={styles.megaCategoryHint}>
                    {isRtl
                      ? 'روی هر دسته بمانید تا ۴ مورد برتر را ببینید'
                      : 'Hover a category to see 4 top items'}
                  </p>
                </div>
                <CategoryTreePanel
                  tree={categoryTree}
                  isRtl={isRtl}
                  featuredByCategoryId={featuredByCategoryId}
                  showFeatured
                  compactToolbar
                  emptyLabel={
                    headerDic.megaNoCategories ??
                    (isRtl ? 'دسته‌بندی ثبت‌شده‌ای نیست' : 'No categories yet')
                  }
                  featuredTitle={headerDic.categoryFeatured ?? (isRtl ? 'برترین‌ها' : 'Top picks')}
                />
              </div>

              <section className={styles.megaQuickSection}>
                <h3 className={styles.megaHeading}>
                  {headerDic.megaQuickLinks ?? (isRtl ? 'دسترسی سریع' : 'Quick links')}
                </h3>
                <ul className={styles.megaQuickGrid}>
                  {quickLinks.slice(0, 6).map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.href}>
                        <Link href={link.href} className={styles.megaLink}>
                          <Icon className={styles.dropdownItemIcon} aria-hidden />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className={styles.megaFooter}>
                <p className={styles.megaFooterText}>
                  {headerDic.megaFooter ??
                    (isRtl
                      ? 'یادگیری برنامه‌نویسی با دوره‌ها، مقالات، سمینارها، پروژه‌ها و کتاب‌های اساتید آرکا'
                      : 'Learn programming with courses, articles, seminars, projects, and books from Arka teachers.')}
                </p>
                <Link href="/courses" className={styles.megaFooterCta}>
                  {headerDic.megaExplore ?? (isRtl ? 'کاوش دوره‌ها' : 'Explore courses')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </HeaderMenuPortal>
    </div>
  );
}
