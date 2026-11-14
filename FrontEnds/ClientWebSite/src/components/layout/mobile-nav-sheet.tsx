'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeSwitcher } from '@/components/shared/theme-switcher';
import { AuthHeaderActions } from './auth-header-actions';
import { cn } from '@/lib/utils';
import { headerNavItems, resolveNavLabel } from '@/lib/nav-config';
import type { Dictionary } from '@/types';
import styles from './site-nav.module.css';
import { useSiteNavScrollLock } from './use-site-nav-scroll-lock';

interface MobileNavSheetProps {
  lang: 'en' | 'fa';
  dict: Dictionary;
  headerDic: Record<string, string | undefined>;
}

export function MobileNavSheet({ lang, dict, headerDic }: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isRtl = lang === 'fa';
  const label = (key: string) => resolveNavLabel(headerDic, key, lang);

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
            <div className={styles.mobileBackdrop} aria-hidden={false} onClick={closeMenu} />

            <aside
              id="mobile-site-nav"
              dir={isRtl ? 'rtl' : 'ltr'}
              className={cn(
                styles.mobilePanel,
                isRtl ? styles.mobilePanelFromRight : styles.mobilePanelFromLeft,
                styles.mobilePanelOpen
              )}
              role="dialog"
              aria-modal="true"
              aria-label={isRtl ? 'منوی موبایل' : 'Mobile menu'}
            >
              <div className={styles.mobileHeader}>
                <Logo className="shrink-0" onClick={closeMenu} />
                <button type="button" className={styles.mobileCloseBtn} onClick={closeMenu}>
                  <X className={styles.menuToggleIcon} aria-hidden />
                  <span className={styles.srOnly}>{isRtl ? 'بستن منو' : 'Close menu'}</span>
                </button>
              </div>

              <p className={styles.mobileMenuTitle}>{isRtl ? 'منوی اصلی' : 'Main menu'}</p>

              <nav className={styles.mobileNavList} aria-label={isRtl ? 'منوی اصلی' : 'Main navigation'}>
                {headerNavItems.map((item) => {
                  if (item.type === 'link') {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={styles.mobileTopLink}
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
              </nav>

              <div className={styles.mobileFooter}>
                <p className={styles.mobileFooterTitle}>{isRtl ? 'تنظیمات و حساب' : 'Settings & account'}</p>
                <div className={styles.mobileFooterTools}>
                  <LanguageSwitcher lang={lang} onLanguageChange={closeMenu} variant="inline" />
                  <ThemeSwitcher onThemeChange={closeMenu} variant="inline" />
                </div>
                <AuthHeaderActions
                  loginLabel={headerDic.login ?? (lang === 'fa' ? 'ورود' : 'Login')}
                  registerLabel={headerDic.register ?? (lang === 'fa' ? 'ثبت نام' : 'Register')}
                  accountLabel={headerDic.account ?? (lang === 'fa' ? 'حساب من' : 'My account')}
                  dashboardLabel={headerDic.dashboard ?? (lang === 'fa' ? 'داشبورد' : 'Dashboard')}
                  logoutLabel={headerDic.logout ?? (lang === 'fa' ? 'خروج' : 'Logout')}
                  lang={lang}
                  vertical
                  dict={dict}
                  onNavigate={closeMenu}
                />
              </div>
            </aside>
          </>,
          document.body
        )
      : null;

  return (
    <div className={styles.mobileNavWrap}>
      <button
        type="button"
        className={styles.menuToggle}
        aria-expanded={open}
        aria-controls="mobile-site-nav"
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
