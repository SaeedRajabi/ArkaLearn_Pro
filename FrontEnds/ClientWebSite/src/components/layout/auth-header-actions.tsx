'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isProfessorRole, getDefaultDashboardPath } from '@/lib/auth/roles';
import { buildLoginHref } from '@/lib/auth/login-links';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useEffect, useRef, useState } from 'react';
import {
  HelpCircle,
  Laptop,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types';
import '@/components/layout/header-menu.css';
import { HeaderMenuPortal } from '@/components/layout/header-menu-portal';
import { NotificationBell } from '@/components/shared/notification-bell';
import { resolveUserProfileImageUrl } from '@/lib/utils/image-url';

function HeaderUserAvatar({
  profileImage,
  displayName,
  initial,
  className,
  imageClassName,
}: {
  profileImage: string | null;
  displayName: string;
  initial: string;
  className?: string;
  imageClassName?: string;
}) {
  const avatarSrc = resolveUserProfileImageUrl(profileImage);

  return (
    <Avatar className={cn('h-full w-full', className)}>
      <AvatarImage
        src={avatarSrc}
        alt={displayName || 'User'}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
      <AvatarFallback className="rounded-full bg-muted text-sm font-medium text-muted-foreground">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}

interface AuthHeaderActionsProps {
  loginLabel: string;
  registerLabel: string;
  accountLabel: string;
  dashboardLabel: string;
  logoutLabel: string;
  lang?: 'en' | 'fa';
  vertical?: boolean;
  dict?: Dictionary;
  onNavigate?: () => void;
}

const btnClass = 'w-full sm:w-auto';

export function AuthHeaderActions({
  loginLabel,
  registerLabel,
  accountLabel,
  dashboardLabel,
  logoutLabel,
  lang = 'en',
  vertical = false,
  dict,
  onNavigate,
}: AuthHeaderActionsProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const layout = vertical ? 'flex flex-col gap-2' : 'flex items-center gap-2';
  const loginHref = buildLoginHref(pathname);
  const isRtl = lang === 'fa';

  const handleNav = () => {
    onNavigate?.();
  };

  const handleLogout = () => {
    handleNav();
    setMenuOpen(false);
    void logout();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || menuPanelRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen]);

  if (!user) {
    return (
      <div className={layout}>
        <Button variant="ghost" size="sm" asChild className={btnClass}>
          <Link href={loginHref} onClick={handleNav}>
            {loginLabel}
          </Link>
        </Button>
        <Button size="sm" asChild className={btnClass}>
          <Link href="/register" onClick={handleNav}>
            {registerLabel}
          </Link>
        </Button>
      </div>
    );
  }

  const dashboardHref = getDefaultDashboardPath(user.role);
  const isProfessor = isProfessorRole(user.role);
  const displayName =
    user.fullName && user.fullName.trim() && user.fullName !== 'Not Name Not Family'
      ? user.fullName
      : user.userName || user.email || '';
  const initial = displayName
    ? String(displayName).trim().slice(0, 2).toUpperCase()
    : user.email
      ? user.email.slice(0, 2).toUpperCase()
      : '?';

  const labels = {
    edit: isRtl ? 'ویرایش پروفایل' : 'Edit profile',
    settings: isRtl ? 'تنظیمات' : 'Settings',
    support: isRtl ? 'پشتیبانی' : 'Support',
    light: isRtl ? 'روشن' : 'Light',
    dark: isRtl ? 'تیره' : 'Dark',
    auto: isRtl ? 'خودکار' : 'Auto',
  };

  const themeButtonClass = (value: 'light' | 'dark' | 'system') =>
    cn(value === theme && 'is-active');

  if (vertical) {
    const linkClass =
      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary';

    return (
      <div className={layout} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className={cn('mb-2 flex items-center gap-3 rounded-lg border bg-muted/40 p-3', isRtl && 'flex-row')}>
          <div className="header-user-panel__avatar">
            <HeaderUserAvatar
              profileImage={user.profileImage}
              displayName={displayName || accountLabel}
              initial={initial}
            />
          </div>
          <div className={cn('min-w-0 flex-1', isRtl ? 'text-right' : 'text-left')}>
            <p className="header-user-panel__name">{displayName || accountLabel}</p>
            <p className="header-user-panel__email">{user.email || user.userName || ''}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <Link href={dashboardHref} onClick={handleNav} className={linkClass}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>{dashboardLabel}</span>
          </Link>
          <Link
            href={isProfessor ? '/professor/profile' : '/account?view=profile'}
            onClick={handleNav}
            className={linkClass}
          >
            <UserRound className="h-4 w-4 shrink-0" />
            <span>{labels.edit}</span>
          </Link>
          <Link
            href={isProfessor ? '/professor/settings' : '/account?view=profile'}
            onClick={handleNav}
            className={linkClass}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>{labels.settings}</span>
          </Link>
          <Link href="/support" onClick={handleNav} className={linkClass}>
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>{labels.support}</span>
          </Link>
        </nav>

        <Button
          type="button"
          variant="outline"
          className={cn(btnClass, 'text-destructive hover:text-destructive')}
          onClick={() => void handleLogout()}
        >
          <LogOut className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
          {logoutLabel}
        </Button>
      </div>
    );
  }

  const menuItemClass = 'header-menu__item';

  return (
    <div className={layout} dir={isRtl ? 'rtl' : 'ltr'}>
      {dict && <NotificationBell dict={dict} lang={lang} />}
      <div ref={menuRef} className="header-menu">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted text-sm font-medium text-muted-foreground shadow-sm ring-1 ring-border transition-all hover:scale-105 hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={accountLabel}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <HeaderUserAvatar
            profileImage={user.profileImage}
            displayName={displayName || accountLabel}
            initial={initial}
          />
        </button>

        <HeaderMenuPortal
          open={menuOpen}
          anchorRef={menuRef}
          onPanelMount={(el) => {
            menuPanelRef.current = el;
          }}
          className="header-menu__panel header-user-panel"
        >
            <div className={cn('header-user-panel__profile', isRtl ? 'flex-row' : 'flex-row-reverse')}>
              <div className="header-user-panel__avatar">
                <HeaderUserAvatar
                  profileImage={user.profileImage}
                  displayName={displayName || accountLabel}
                  initial={initial}
                />
              </div>
              <div className={cn('min-w-0 flex-1', isRtl ? 'text-right' : 'text-left')}>
                <Link
                  href={dashboardHref}
                  className="header-user-panel__name block hover:text-primary"
                  onClick={() => {
                    setMenuOpen(false);
                    handleNav();
                  }}
                >
                  {displayName || accountLabel}
                </Link>
                <p className="header-user-panel__email">{user.email || user.userName || ''}</p>
              </div>
            </div>

            <div className="header-menu__separator" />

            <Link href={dashboardHref} className={menuItemClass} role="menuitem" onClick={() => { setMenuOpen(false); handleNav(); }}>
              <LayoutDashboard className="h-4 w-4" />
              <span>{dashboardLabel}</span>
            </Link>
            <Link href={isProfessor ? '/professor/profile' : '/account?view=profile'} className={menuItemClass} role="menuitem" onClick={() => { setMenuOpen(false); handleNav(); }}>
              <UserRound className="h-4 w-4" />
              <span>{labels.edit}</span>
            </Link>
            <Link href={isProfessor ? '/professor/profile' : '/account?view=profile'} className={menuItemClass} role="menuitem" onClick={() => { setMenuOpen(false); handleNav(); }}>
              <Settings className="h-4 w-4" />
              <span>{labels.settings}</span>
            </Link>
            <Link href="/support" className={menuItemClass} role="menuitem" onClick={() => { setMenuOpen(false); handleNav(); }}>
              <HelpCircle className="h-4 w-4" />
              <span>{labels.support}</span>
            </Link>
            <button type="button" className={cn(menuItemClass, 'text-destructive')} role="menuitem" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              <span>{logoutLabel}</span>
            </button>

            <div className="header-menu__separator" />

            <div className="header-theme-row">
              <button type="button" className={themeButtonClass('light')} onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4" />
                <span>{labels.light}</span>
              </button>
              <button type="button" className={themeButtonClass('dark')} onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4" />
                <span>{labels.dark}</span>
              </button>
              <button type="button" className={themeButtonClass('system')} onClick={() => setTheme('system')}>
                <Laptop className="h-4 w-4" />
                <span>{labels.auto}</span>
              </button>
            </div>
        </HeaderMenuPortal>
      </div>
    </div>
  );
}
