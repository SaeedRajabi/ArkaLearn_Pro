
'use client';
import { useEffect, useState } from 'react';
import { SalesChart } from './components/sales-chart';
import { TicketsList } from './components/tickets-list';
import { ProjectOrdersList } from './components/project-orders-list';
import { AcademyInstructors } from './components/academy-instructors';
import { AnnouncementsFeed } from './components/announcements-feed';
import { useLanguage } from '@/components/language-provider';
import { RecentArticles } from './components/recent-articles';
import { EnrollmentChart } from './components/enrollment-chart';
import { SeminarQuickLinks } from './components/seminar-quick-links';
import {
  getDashboardStats,
  getDashboardOverview,
  type DashboardOverview,
  type DashboardStats,
} from '@/services/dashboard-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  GraduationCap,
  Presentation,
  MonitorPlay,
  Video,
  BookOpen,
  Library,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    getDashboardOverview(12)
      .then(setOverview)
      .catch(console.error)
      .finally(() => setOverviewLoading(false));
  }, []);

  const overviewSafe: DashboardOverview = overview ?? {
    recentSupportTickets: [],
    announcements: [],
    recentArticles: [],
    monthlyEnrollments: [],
    monthlySales: [],
    topInstructors: [],
    salesPeriodTotal: 0,
    enrollmentPeriodTotal: 0,
    pendingProjectOrdersCount: 0,
    recentProjectOrders: [],
  };

  const statCards = [
    {
      title: t('stats_total_teachers'),
      value: stats?.totalTeachers,
      icon: Presentation,
      color: 'text-blue-500',
    },
    {
      title: t('stats_total_students'),
      value: stats?.totalStudents,
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: t('stats_total_rooms'),
      value: stats?.totalRooms,
      icon: MonitorPlay,
      color: 'text-purple-500',
    },
    {
      title: t('stats_active_sessions'),
      value: stats?.activeSessions,
      icon: Video,
      color: 'text-red-500',
    },
    {
      title: t('stats_total_sessions'),
      value: stats?.totalSessionsHeld,
      icon: Library,
      color: 'text-orange-500',
    },
    {
      title: t('stats_total_courses'),
      value: stats?.totalCourses,
      icon: GraduationCap,
      color: 'text-indigo-500',
    },
    {
      title: t('stats_total_seminars'),
      value: stats?.totalSeminars,
      icon: BookOpen,
      color: 'text-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('dashboard_title')}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value?.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          <SalesChart
            monthlySales={overviewSafe.monthlySales}
            periodTotal={overviewSafe.salesPeriodTotal}
            loading={overviewLoading}
          />
        </div>
        <div className="flex flex-col gap-6">
          <SeminarQuickLinks />
          <ProjectOrdersList
            orders={overviewSafe.recentProjectOrders}
            pendingCount={overviewSafe.pendingProjectOrdersCount}
            loading={overviewLoading}
          />
          <TicketsList tickets={overviewSafe.recentSupportTickets} loading={overviewLoading} />
          <AnnouncementsFeed announcements={overviewSafe.announcements} loading={overviewLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentArticles articles={overviewSafe.recentArticles} loading={overviewLoading} />
        <EnrollmentChart
          monthlyEnrollments={overviewSafe.monthlyEnrollments}
          periodTotal={overviewSafe.enrollmentPeriodTotal}
          loading={overviewLoading}
        />
      </div>

      <AcademyInstructors instructors={overviewSafe.topInstructors} loading={overviewLoading} />
    </div>
  );
}
