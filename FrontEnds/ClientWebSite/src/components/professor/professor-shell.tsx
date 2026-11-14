'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { PhoneVerifyBanner } from '@/components/auth/phone-verify-banner';

const navItems = [
  { href: '/professor', icon: LayoutDashboard, labelKey: 'professorDashboard.menu.overview' },
  { href: '/professor/profile', icon: Settings, labelKey: 'professorDashboard.menu.profile' },
  { href: '/professor/videos', icon: Video, labelKey: 'professorDashboard.menu.videos' },
  { href: '/professor/books', icon: BookOpen, labelKey: 'professorDashboard.menu.books' },
  { href: '/professor/articles', icon: FileText, labelKey: 'professorDashboard.menu.articles' },
] as const;

export function ProfessorSidebar({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="space-y-1 rounded-xl border bg-card p-2 shadow-sm">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted hover:text-primary'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{getDictValue(dict, item.labelKey, item.href.split('/').pop() ?? '')}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{getDictValue(dict, 'dashboard.menu.logout', 'Log out')}</span>
      </button>
    </nav>
  );
}

export function ProfessorShell({
  dict,
  title,
  subtitle,
  children,
}: {
  dict: Dictionary;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-gradient-to-b from-muted/40 to-background pb-6 pt-8 sm:pb-8 sm:pt-12">
        <div className="container px-4 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="mb-3 text-2xl font-bold font-headline tracking-tight sm:text-4xl">{title}</h1>
          {subtitle ? (
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-lg">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="container px-4 py-5 sm:py-8">
        <PhoneVerifyBanner dict={dict} href="/professor/profile" className="mb-4" />
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="hidden w-full shrink-0 lg:block lg:w-64">
            <ProfessorSidebar dict={dict} />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
