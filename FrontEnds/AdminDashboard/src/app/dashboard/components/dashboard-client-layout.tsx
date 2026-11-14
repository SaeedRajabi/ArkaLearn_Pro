
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import {
  BarChart3,
  Bell,
  BookMarked,
  BookOpenCheck,
  ChevronDown,
  Calendar,
  CreditCard,
  FolderKanban,
  Download,
  GraduationCap,
  Banknote,
  ClipboardList,
  FilePlus2,
  Image,
  LayoutDashboard, Loader2,
  LayoutGrid,
  MessageSquare,
  MessageCircleQuestion,
  LifeBuoy,
  MonitorSmartphone,
  Newspaper,
  ReceiptText,
  Settings,
  ShieldCheck,
  Star,
  Megaphone,
  Users,
  Video,
  WalletCards,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLanguage } from '@/components/language-provider';
import { useAuth } from '@/components/auth-provider';
import { resolveUserAvatarUrl } from '@/lib/default-user-avatar';

import { useRouter } from 'next/navigation';

import {Suspense, useEffect, useState} from "react";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {Skeleton} from "@/components/ui/skeleton";
import LoadingFrameWithBrand from "@/components/loadings/loading-frame-with-brand";
import { NotificationBell } from '@/components/notification-bell';
//import { useRouter } from 'next/router';


type NavItemType = {
  href: string;
  icon: React.ElementType;
  labelKey: string;
  subItems?: { href: string; labelKey: string, icon?: React.ElementType }[];
};

const navItems: NavItemType[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav_dashboard' },
  { href: '/dashboard/categories', icon: LayoutGrid, labelKey: 'nav_categories' },
  {
    href: '#',
    icon: BookMarked,
    labelKey: 'nav_courses',
    subItems: [
      { href: '/dashboard/courses', labelKey: 'nav_courses_all' },
      { href: '/dashboard/courses/moderation', labelKey: 'nav_courses_moderation', icon: ShieldCheck },
      { href: '/dashboard/courses/reviews', labelKey: 'nav_courses_reviews', icon: Star },
    ],
  },
  {
    href: '#',
    icon: Newspaper,
    labelKey: 'nav_articles',
    subItems: [
      { href: '/dashboard/articles', labelKey: 'nav_articles_all' },
      { href: '/dashboard/articles/comments', labelKey: 'nav_articles_comments', icon: MessageSquare },
    ],
  },
  {
    href: '#',
    icon: FolderKanban,
    labelKey: 'nav_projects',
    subItems: [
      { href: '/dashboard/projects', labelKey: 'nav_projects_all' },
      { href: '/dashboard/project-questions', labelKey: 'nav_project_questions', icon: MessageCircleQuestion },
      { href: '/dashboard/project-orders', labelKey: 'nav_project_orders', icon: FilePlus2 },
    ],
  },
  { href: '/dashboard/seminars', icon: BookOpenCheck, labelKey: 'nav_seminars' },
  { href: '/dashboard/software', icon: Download, labelKey: 'nav_software' },
  {
    href: '#',
    icon: BookMarked,
    labelKey: 'nav_arka_content',
    subItems: [
      { href: '/dashboard/arka-content', labelKey: 'nav_arka_content_hub' },
      { href: '/dashboard/arka-content/books', labelKey: 'nav_arka_content_books' },
      { href: '/dashboard/arka-content/videos', labelKey: 'nav_arka_content_videos' },
    ],
  },
  { href: '/dashboard/media', icon: Image, labelKey: 'nav_media' },
  { href: '/dashboard/calendar', icon: Calendar, labelKey: 'nav_calendar' },
  { href: '/dashboard/education-plans', icon: ClipboardList, labelKey: 'nav_education_plans' },
  {
    href: '#',
    icon: LifeBuoy,
    labelKey: 'nav_support_management',
    subItems: [
      { href: '/dashboard/support-management', labelKey: 'nav_support_student', icon: MessageSquare },
      { href: '/dashboard/support-tickets', labelKey: 'nav_support_tickets', icon: LifeBuoy },
      { href: '/dashboard/support-topics', labelKey: 'nav_support_topics', icon: BookOpenCheck },
      { href: '/dashboard/remote-assist', labelKey: 'nav_remote_assist', icon: MonitorSmartphone },
    ],
  },
  { href: '/dashboard/notifications', icon: Bell, labelKey: 'nav_notifications' },
  { href: '/dashboard/rooms', icon: Video, labelKey: 'nav_rooms' },
  {
    href: '#',
    icon: WalletCards,
    labelKey: 'nav_finance',
    subItems: [
      { href: '/dashboard/financial', labelKey: 'nav_finance_overview', icon: WalletCards },
      { href: '/dashboard/financial/reports', labelKey: 'nav_finance_reports', icon: BarChart3 },
      { href: '/dashboard/financial/invoices', labelKey: 'nav_finance_invoices', icon: ReceiptText },
      { href: '/dashboard/financial/payments', labelKey: 'nav_finance_payments', icon: CreditCard },
      { href: '/dashboard/financial/teacher-payouts', labelKey: 'nav_finance_teacher_payouts', icon: Banknote },
      { href: '/dashboard/financial/platform-payout-bank', labelKey: 'nav_finance_platform_payout_bank', icon: CreditCard },
      { href: '/dashboard/financial/payment-gateway', labelKey: 'nav_finance_payment_gateway', icon: CreditCard },
      { href: '/dashboard/financial/wallets', labelKey: 'nav_finance_wallets', icon: CreditCard },
    ],
  },
  {
    href: '#',
    icon: Users,
    labelKey: 'nav_users',
    subItems: [
      { href: '/dashboard/users/students', labelKey: 'nav_users_students' },
      { href: '/dashboard/users/teachers', labelKey: 'nav_users_teachers' },
      { href: '/dashboard/users/activity', labelKey: 'nav_users_activity' },
    ],
  },
  { href: '/dashboard/teacher-approvals', icon: GraduationCap, labelKey: 'nav_teacher_approvals' },
  { href: '/dashboard/teacher-content-moderation', icon: GraduationCap, labelKey: 'nav_teacher_content_moderation' },
  { href: '/dashboard/advertisement-tariffs', icon: Megaphone, labelKey: 'nav_advertisement_tariffs' },
  { href: '/dashboard/support-plans', icon: LifeBuoy, labelKey: 'nav_support_plans' },
  { href: '/dashboard/course-installments', icon: ReceiptText, labelKey: 'nav_course_installments' },
  {
    href: '#',
    icon: Settings,
    labelKey: 'nav_settings',
    subItems: [
      { href: '/dashboard/settings/profile', labelKey: 'nav_settings_profile' },
      { href: '/dashboard/settings/site', labelKey: 'nav_settings_site' },
      { href: '/dashboard/settings/announcement', labelKey: 'nav_settings_announcement' },
      { href: '/dashboard/settings/contact', labelKey: 'nav_settings_contact' },
      { href: '/dashboard/settings/notifications', labelKey: 'nav_settings_notifications' },
      { href: '/dashboard/settings/email', labelKey: 'nav_settings_email' },
      { href: '/dashboard/settings/google-auth', labelKey: 'nav_settings_google_auth' },
      { href: '/dashboard/settings/security', labelKey: 'nav_settings_security' },
      { href: '/dashboard/settings/media-upload', labelKey: 'nav_settings_media_upload' },
      { href: '/dashboard/settings/live-media', labelKey: 'nav_settings_live_media' },
      { href: '/dashboard/settings/database-connection', labelKey: 'nav_settings_database_connection' },
      { href: '/dashboard/settings/cache', labelKey: 'nav_settings_cache' },
      { href: '/dashboard/settings/desktop-app', labelKey: 'nav_settings_desktop_app' },
      { href: '/dashboard/settings/discount-codes', labelKey: 'nav_settings_discount_codes' },
      { href: '/dashboard/security/ip-blacklist', labelKey: 'nav_ip_blacklist' },
      { href: '/dashboard/settings/email-templates', labelKey: 'nav_settings_email_templates' },
      { href: '/dashboard/settings/dashboard', labelKey: 'nav_settings_dashboard' },
    ],
  },
];

function NavItem({ item, pathname, t , handleLinkClick}: {
  item: NavItemType;
  pathname: string;
  t: (key: string) => string,
  handleLinkClick: (href: string) => void
}) {
  const { state } = useSidebar();
  const isSubMenuActive = item.subItems?.some((sub) => pathname.startsWith(sub.href)) ?? false;
  const isExpanded = state === 'expanded';

  const handleLinkClickInternal = (href: string) => {
    // استفاده از تابع پاس داده شده از DashboardClientLayout
    handleLinkClick(href);
  };


  if (!item.subItems) {
    const isActive = item.href === '/dashboard' 
      ? pathname === item.href 
      : pathname.startsWith(item.href);

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          isActive={isActive}
          tooltip={t(item.labelKey)}
          className="text-base"
          onClick={() => handleLinkClickInternal(item.href)}
        >
          <Link href={item.href}>
            <item.icon />
            <span className="group-data-[state=collapsed]:hidden">{t(item.labelKey)}</span>

          </Link>
        </SidebarMenuButton>




      </SidebarMenuItem>
    );
  }

  if (!isExpanded) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              isActive={isSubMenuActive}
              tooltip={t(item.labelKey)}
              className="w-full justify-start text-base"
            >
              <item.icon />
              <span className="group-data-[state=collapsed]:hidden">{t(item.labelKey)}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="ms-2">
            <DropdownMenuLabel>{t(item.labelKey)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {item.subItems.map((subItem) => (
              <DropdownMenuItem key={subItem.href} asChild>
                <Link
                  href={subItem.href}
                  className="flex items-center gap-2"
                  onClick={() => handleLinkClickInternal(subItem.href)}
                >
                  {subItem.icon && <subItem.icon className="h-4 w-4 text-muted-foreground" />}
                  {t(subItem.labelKey)}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={isSubMenuActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            size="lg"
            isActive={isSubMenuActive}
            className="w-full justify-start text-base"
          >
            <item.icon />
            <span className="group-data-[state=collapsed]:hidden">{t(item.labelKey)}</span>
            <ChevronDown className="ms-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=collapsed]:hidden group-data-[state=open]:rotate-180" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === subItem.href}
                  className="h-9 justify-start"
                  onClick={() => handleLinkClickInternal(subItem.href)}
                >
                  <Link href={subItem.href} className='flex items-center gap-2'>
                    {subItem.icon && <subItem.icon className="h-4 w-4 text-muted-foreground" />}
                    {t(subItem.labelKey)}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const router = useRouter();

  // ایجاد استیت برای مدیریت لودینگ
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // 2. اصلاح تابع کلیک
  const handleLinkClick = (href: string) => {
    setLoading(true);
    // فقط اگر مقصد با آدرس فعلی متفاوت است لودینگ را روشن کن
    if (pathname !== href) {
      setLoading(true);
    }

    // نکته مهم: خط زیر را پاک کنید!
    // router.push(href);

    // دلیل: شما در کامپوننت NavItem از تگ <Link> استفاده کرده‌اید.
    // تگ Link خودش نویگیشن را انجام می‌دهد. اگر اینجا router.push بزنید،
    // نویگیشن دوبار انجام می‌شود و پرفرمنس پایین می‌آید.
  };




  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="p-2 group-data-[state=collapsed]:px-1">
            <BrandLogo
              linked
              href="/dashboard"
              variant="sidebar"
              wordmark={t('app_name')}
              className="group-data-[state=collapsed]:justify-center"
            />
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent className="p-4">
          <SidebarMenu>
            {navItems.map((item) => (
              <NavItem
                  key={item.href + item.labelKey}
                  item={item}
                  pathname={pathname}
                  t={t}
                  handleLinkClick={(href: string) => handleLinkClick(href)}
              />
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-md p-2 group-data-[state=collapsed]:p-1 group-data-[state=collapsed]:justify-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src={resolveUserAvatarUrl(user?.avatarUrl)} alt={user?.name} />
              <AvatarFallback>{user?.initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[state=collapsed]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user?.name}
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                {user?.email}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:gap-4 sm:px-4 md:px-6">
          <SidebarTrigger className="flex" />
          <div className="w-full flex-1">
            {/* Can add a search bar here later */}
          </div>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolveUserAvatarUrl(user?.avatarUrl)} alt={user?.name} />
                  <AvatarFallback>{user?.initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">{t('user_menu_toggle')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('user_menu_my_account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>{t('user_menu_settings')}</DropdownMenuItem>
              <DropdownMenuItem>{t('user_menu_support')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  void logout();
                }}
              >
                {t('user_menu_logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">

          {loading ? (
              <LoadingFrameWithBrand title={t('app_name')}/>

          ) : (
              <Suspense fallback={<LoadingFrameWithBrand title={t('app_name')}/>}>
                {children}
              </Suspense>
          )}

        </main>


      </SidebarInset>
    </SidebarProvider>
  );
}
