'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { headerNavItems, resolveNavLabel } from '@/lib/nav-config';
import { buildCategoryBrowseUrl, flattenCategoryNavRows } from '@/lib/category-browse';
import styles from './site-nav.module.css';
import { useSiteNavScrollLock } from './use-site-nav-scroll-lock';

import type { CategoryTreeItem } from '@/lib/api/categories';

interface TabletNavDropdownProps {
  lang: 'en' | 'fa';
  headerDic: Record<string, string | undefined>;
  categoryTree?: CategoryTreeItem[];
}

export function TabletNavDropdown({ lang, headerDic, categoryTree = [] }: TabletNavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isRtl = lang === 'fa';
  const label = (key: string) => resolveNavLabel(headerDic, key, lang);
  const categoryRows = flattenCategoryNavRows(categoryTree);

  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useSiteNavScrollLock(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeMenu]);

  const menuOverlay =
    mounted && open
      ? createPortal(
          <>
            <div className={styles.tabletBackdrop} aria-hidden={false} onClick={closeMenu} />

            <nav
              id="tablet-site-nav"
              dir={isRtl ? 'rtl' : 'ltr'}
              className={cn(styles.tabletPanel, styles.tabletPanelOpen)}
              aria-label={isRtl ? 'منوی اصلی' : 'Main navigation'}
            >
              <p className={styles.tabletMenuTitle}>{isRtl ? 'منوی اصلی' : 'Main menu'}</p>

              {categoryRows.length > 0 ? (
                <details className={cn(styles.mobileGroup, 'mb-3')} open>
                  <summary className={styles.mobileGroupSummary}>
                    <span className={styles.mobileGroupLabel}>
                      <span className={styles.mobileLinkText}>
                        {headerDic.categories ?? (isRtl ? 'دسته‌بندی' : 'Categories')}
                      </span>
                    </span>
                    <ChevronDown className={styles.mobileGroupIcon} aria-hidden />
                  </summary>
                  <ul className={styles.mobileSubList}>
                    {categoryRows.map(({ node, depth }) => (
                      <li key={node.id}>
                        <Link
                          href={buildCategoryBrowseUrl(node.id)}
                          onClick={closeMenu}
                          className={styles.mobileSubLink}
                          style={{ paddingInlineStart: `${0.5 + depth * 0.85}rem` }}
                        >
                          <span>
                            {depth > 0 ? '└ ' : ''}
                            {node.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <div className={styles.tabletNavList}>
                {headerNavItems.map((item) => {
                  if (item.type === 'link') {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={styles.tabletTopLink}
                      >
                        <Icon className={styles.mobileNavIcon} aria-hidden />
                        <span className={styles.mobileLinkText}>{label(item.labelKey)}</span>
                      </Link>
                    );
                  }

                  const GroupIcon = item.icon;

                  return (
                    <details key={item.labelKey} className={styles.mobileGroup}>
                      <summary className={styles.mobileGroupSummary}>
                        <span className={styles.mobileGroupLabel}>
                          <GroupIcon className={styles.mobileNavIcon} aria-hidden />
                          <span className={styles.mobileLinkText}>{label(item.labelKey)}</span>
                        </span>
                        <ChevronDown className={styles.mobileGroupIcon} aria-hidden />
                      </summary>
                      <ul className={styles.mobileSubList}>
                        {item.items.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <li key={child.href}>
                              <Link href={child.href} onClick={closeMenu} className={styles.mobileSubLink}>
                                <ChildIcon className={styles.mobileSubIcon} aria-hidden />
                                <span>{label(child.labelKey)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </nav>
          </>,
          document.body
        )
      : null;

  return (
    <div className={styles.tabletNavWrap}>
      <button
        type="button"
        className={styles.menuToggle}
        aria-expanded={open}
        aria-controls="tablet-site-nav"
        onClick={toggleMenu}
      >
        {open ? (
          <X className={styles.menuToggleIcon} aria-hidden />
        ) : (
          <Menu className={styles.menuToggleIcon} aria-hidden />
        )}
        <span className={styles.srOnly}>{isRtl ? 'باز کردن منو' : 'Open menu'}</span>
      </button>
      {menuOverlay}
    </div>
  );
}
