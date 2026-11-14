'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { headerNavItems, resolveNavLabel, type HeaderNavItem } from '@/lib/nav-config';
import { HeaderCategoriesMenu } from './header-categories-menu';
import { HeaderMegaMenu } from './header-mega-menu';
import { HeaderMenuPortal } from './header-menu-portal';
import { useHoverFlyout } from './use-hover-flyout';
import type { MegaMenuFeaturedMap } from '@/lib/header-mega-data';
import type { CategoryTreeItem } from '@/lib/api/categories';
import styles from './site-nav.module.css';

interface HeaderNavProps {
  lang: 'en' | 'fa';
  headerDic: Record<string, string | undefined>;
  categoryTree: CategoryTreeItem[];
  featuredByCategoryId: MegaMenuFeaturedMap;
}

function NavGroupDropdown({
  item,
  label,
  isRtl,
}: {
  item: Extract<HeaderNavItem, { type: 'group' }>;
  label: (key: string) => string;
  isRtl: boolean;
}) {
  const menuId = `nav-menu-${item.labelKey}`;
  const GroupIcon = item.icon;
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { open, openFlyout, closeFlyout, toggleFlyout } = useHoverFlyout();

  return (
    <div
      className={cn(styles.dropdown, open && styles.dropdownOpen)}
      data-nav-item
      onMouseEnter={openFlyout}
      onMouseLeave={closeFlyout}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(styles.dropdownTrigger, isRtl && styles.dropdownTriggerRtl)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggleFlyout}
      >
        <GroupIcon className={styles.navIcon} aria-hidden />
        <span>{label(item.labelKey)}</span>
        <ChevronDown className={styles.dropdownIcon} aria-hidden />
      </button>

      <HeaderMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="start"
        isRtl={isRtl}
        placement="below"
        className={styles.dropdownMenuPortal}
        role="presentation"
        onMouseEnter={openFlyout}
        onMouseLeave={closeFlyout}
      >
        <ul id={menuId} className={styles.dropdownMenuList} role="menu">
          {item.items.map((child) => {
            const ChildIcon = child.icon;
            return (
              <li key={child.href} role="none">
                <Link href={child.href} className={styles.dropdownItemLink} role="menuitem">
                  <ChildIcon className={styles.dropdownItemIcon} aria-hidden />
                  <span>{label(child.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </HeaderMenuPortal>
    </div>
  );
}

function NavItemRenderer({
  item,
  label,
  isRtl,
}: {
  item: HeaderNavItem;
  label: (key: string) => string;
  isRtl: boolean;
}) {
  if (item.type === 'link') {
    const Icon = item.icon;
    return (
      <Link href={item.href} className={styles.navLink} data-nav-item>
        <Icon className={styles.navIcon} aria-hidden />
        <span>{label(item.labelKey)}</span>
      </Link>
    );
  }

  return <NavGroupDropdown item={item} label={label} isRtl={isRtl} />;
}

export function HeaderNav({ lang, headerDic, categoryTree, featuredByCategoryId }: HeaderNavProps) {
  const isRtl = lang === 'fa';
  const label = React.useCallback(
    (key: string) => resolveNavLabel(headerDic, key, lang),
    [headerDic, lang]
  );

  const trackRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const overflowTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(headerNavItems.length);
  const { open: overflowOpen, openFlyout: openOverflow, closeFlyout: closeOverflow, toggleFlyout: toggleOverflow } =
    useHoverFlyout();

  const recomputeOverflow = React.useCallback(() => {
    const track = trackRef.current;
    const measure = measureRef.current;
    if (!track || !measure) return;

    const available = track.clientWidth;
    if (available <= 0) return;

    const items = Array.from(measure.querySelectorAll<HTMLElement>('[data-nav-item]'));
    if (items.length === 0) return;

    const moreButtonWidth = 44;
    let used = 0;
    let count = 0;

    for (const item of items) {
      const w = item.offsetWidth + 4;
      const needsMore = count < items.length - 1;
      const budget = needsMore ? available - moreButtonWidth : available;
      if (used + w > budget) break;
      used += w;
      count += 1;
    }

    setVisibleCount(Math.max(1, count));
  }, []);

  React.useEffect(() => {
    recomputeOverflow();
    const track = trackRef.current;
    if (!track) return;

    const observer = new ResizeObserver(() => recomputeOverflow());
    observer.observe(track);
    window.addEventListener('resize', recomputeOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recomputeOverflow);
    };
  }, [recomputeOverflow]);

  const visibleItems = headerNavItems.slice(0, visibleCount);
  const overflowItems = headerNavItems.slice(visibleCount);
  const moreLabel = headerDic.more ?? (isRtl ? 'بیشتر' : 'More');

  return (
    <nav className={styles.desktopNav} aria-label={isRtl ? 'منوی اصلی' : 'Main navigation'}>
      <HeaderCategoriesMenu
        lang={lang}
        headerDic={headerDic}
        categoryTree={categoryTree}
        featuredByCategoryId={featuredByCategoryId}
      />
      <HeaderMegaMenu
        lang={lang}
        headerDic={headerDic}
        categoryTree={categoryTree}
        featuredByCategoryId={featuredByCategoryId}
      />

      <div className={styles.navTrack} ref={trackRef}>
        {visibleItems.map((item) => (
          <NavItemRenderer key={item.type === 'link' ? item.href : item.labelKey} item={item} label={label} isRtl={isRtl} />
        ))}

        {overflowItems.length > 0 ? (
          <div
            className={cn(styles.dropdown, styles.overflowRoot, overflowOpen && styles.overflowRootOpen)}
            data-nav-item
            onMouseEnter={openOverflow}
            onMouseLeave={closeOverflow}
          >
            <button
              ref={overflowTriggerRef}
              type="button"
              className={styles.overflowTrigger}
              aria-haspopup="true"
              aria-expanded={overflowOpen}
              aria-label={moreLabel}
              onClick={toggleOverflow}
            >
              <MoreHorizontal className={styles.navIcon} aria-hidden />
            </button>

            <HeaderMenuPortal
              open={overflowOpen}
              anchorRef={overflowTriggerRef}
              align="start"
              isRtl={isRtl}
              placement="below"
              className={cn(styles.dropdownMenuPortal, styles.overflowMenuPortal)}
              role="presentation"
              onMouseEnter={openOverflow}
              onMouseLeave={closeOverflow}
            >
              <ul className={styles.dropdownMenuList} role="menu">
                {overflowItems.map((item) => {
                  if (item.type === 'link') {
                    const Icon = item.icon;
                    return (
                      <li key={item.href} role="none">
                        <Link href={item.href} className={styles.dropdownItemLink} role="menuitem">
                          <Icon className={styles.dropdownItemIcon} aria-hidden />
                          <span>{label(item.labelKey)}</span>
                        </Link>
                      </li>
                    );
                  }
                  return item.items.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <li key={child.href} role="none">
                        <Link href={child.href} className={styles.dropdownItemLink} role="menuitem">
                          <ChildIcon className={styles.dropdownItemIcon} aria-hidden />
                          <span>{label(child.labelKey)}</span>
                        </Link>
                      </li>
                    );
                  });
                })}
              </ul>
            </HeaderMenuPortal>
          </div>
        ) : null}
      </div>

      <div className={styles.navMeasure} ref={measureRef} aria-hidden>
        {headerNavItems.map((item) => (
          <NavItemRenderer key={`m-${item.type === 'link' ? item.href : item.labelKey}`} item={item} label={label} isRtl={isRtl} />
        ))}
      </div>
    </nav>
  );
}
