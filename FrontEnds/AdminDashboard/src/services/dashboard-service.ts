import apiClient from '@/lib/apiClient';

const BASE = '/Dashboard';

export interface DashboardStats {
  totalTeachers: number;
  totalStudents: number;
  totalRooms: number;
  activeSessions: number;
  totalSessionsHeld: number;
  totalCourses: number;
  totalSeminars: number;
}

export interface DashboardSupportTicket {
  id: number;
  ticketNumber: number;
  subject: string;
  status: string;
  requesterName: string;
  requesterAvatarUrl?: string | null;
  createdDateTime?: string | null;
}

export interface DashboardAnnouncement {
  id: number;
  title: string;
  body: string;
  priority: number;
  createdDateTime?: string | null;
}

export interface DashboardRecentArticle {
  id: number;
  title: string;
  categoryTitle: string;
  approvedCommentCount: number;
  publishedAt?: string | null;
}

export interface DashboardMonthlyEnrollment {
  year: number;
  month: number;
  count: number;
}

export interface DashboardMonthlySales {
  year: number;
  month: number;
  totalPaid: number;
}

export interface DashboardTopInstructor {
  teacherId: number;
  userId: number;
  displayName: string;
  avatarUrl?: string | null;
  publishedCourseCount: number;
  averageCourseRating?: number | null;
}

export interface DashboardProjectOrder {
  id: number;
  requestNumber: number;
  title: string;
  status: string;
  requesterName: string;
  requesterAvatarUrl?: string | null;
  createdDateTime?: string | null;
}

export interface DashboardOverview {
  recentSupportTickets: DashboardSupportTicket[];
  announcements: DashboardAnnouncement[];
  recentArticles: DashboardRecentArticle[];
  monthlyEnrollments: DashboardMonthlyEnrollment[];
  monthlySales: DashboardMonthlySales[];
  topInstructors: DashboardTopInstructor[];
  salesPeriodTotal: number;
  enrollmentPeriodTotal: number;
  pendingProjectOrdersCount: number;
  recentProjectOrders: DashboardProjectOrder[];
}

function extractPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if ('recentSupportTickets' in obj || 'RecentSupportTickets' in obj || 'recentProjectOrders' in obj || 'RecentProjectOrders' in obj) return obj;
  if ('data' in obj && typeof obj.data === 'object' && obj.data !== null)
    return extractPayload(obj.data);
  return null;
}

function num(v: unknown, fb = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function arr(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as { $values?: unknown; data?: unknown; Data?: unknown };
    if (Array.isArray(obj.$values)) return obj.$values;
    if (obj.data) return arr(obj.data);
    if (obj.Data) return arr(obj.Data);
  }
  return [];
}

/** Normalize ASP.NET / axios payload into typed overview. */
export function normalizeDashboardOverview(payload: Record<string, unknown>): DashboardOverview {
  const ticketsRaw = arr(payload.recentSupportTickets ?? payload.RecentSupportTickets);
  const annRaw = arr(payload.announcements ?? payload.Announcements);
  const artsRaw = arr(payload.recentArticles ?? payload.RecentArticles);
  const enrollRaw = arr(payload.monthlyEnrollments ?? payload.MonthlyEnrollments);
  const salesRaw = arr(payload.monthlySales ?? payload.MonthlySales);
  const instRaw = arr(payload.topInstructors ?? payload.TopInstructors);
  const ordersRaw = arr(payload.recentProjectOrders ?? payload.RecentProjectOrders);

  return {
    recentSupportTickets: ticketsRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: num(o.id ?? o.Id),
        ticketNumber: num(o.ticketNumber ?? o.TicketNumber),
        subject: String(o.subject ?? o.Subject ?? ''),
        status: String(o.status ?? o.Status ?? ''),
        requesterName: String(o.requesterName ?? o.RequesterName ?? ''),
        requesterAvatarUrl: (o.requesterAvatarUrl ?? o.RequesterAvatarUrl ?? null) as string | null,
        createdDateTime: (o.createdDateTime ?? o.CreatedDateTime ?? null) as string | null,
      };
    }),
    announcements: annRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: num(o.id ?? o.Id),
        title: String(o.title ?? o.Title ?? ''),
        body: String(o.body ?? o.Body ?? ''),
        priority: num(o.priority ?? o.Priority),
        createdDateTime: (o.createdDateTime ?? o.CreatedDateTime ?? null) as string | null,
      };
    }),
    recentArticles: artsRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: num(o.id ?? o.Id),
        title: String(o.title ?? o.Title ?? ''),
        categoryTitle: String(o.categoryTitle ?? o.CategoryTitle ?? ''),
        approvedCommentCount: num(o.approvedCommentCount ?? o.ApprovedCommentCount),
        publishedAt: (o.publishedAt ?? o.PublishedAt ?? null) as string | null,
      };
    }),
    monthlyEnrollments: enrollRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        year: num(o.year ?? o.Year),
        month: num(o.month ?? o.Month),
        count: num(o.count ?? o.Count),
      };
    }),
    monthlySales: salesRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        year: num(o.year ?? o.Year),
        month: num(o.month ?? o.Month),
        totalPaid: num(o.totalPaid ?? o.TotalPaid ?? o.total ?? o.Total),
      };
    }),
    topInstructors: instRaw.map((x) => {
      const o = x as Record<string, unknown>;
      const ar = o.averageCourseRating ?? o.AverageCourseRating;
      return {
        teacherId: num(o.teacherId ?? o.TeacherId),
        userId: num(o.userId ?? o.UserId),
        displayName: String(o.displayName ?? o.DisplayName ?? ''),
        avatarUrl: (o.avatarUrl ?? o.AvatarUrl ?? null) as string | null,
        publishedCourseCount: num(o.publishedCourseCount ?? o.PublishedCourseCount),
        averageCourseRating: ar == null ? null : num(ar),
      };
    }),
    salesPeriodTotal: num(payload.salesPeriodTotal ?? payload.SalesPeriodTotal),
    enrollmentPeriodTotal: num(payload.enrollmentPeriodTotal ?? payload.EnrollmentPeriodTotal),
    pendingProjectOrdersCount: num(payload.pendingProjectOrdersCount ?? payload.PendingProjectOrdersCount),
    recentProjectOrders: ordersRaw.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        id: num(o.id ?? o.Id),
        requestNumber: num(o.requestNumber ?? o.RequestNumber),
        title: String(o.title ?? o.Title ?? ''),
        status: String(o.status ?? o.Status ?? ''),
        requesterName: String(o.requesterName ?? o.RequesterName ?? ''),
        requesterAvatarUrl: (o.requesterAvatarUrl ?? o.RequesterAvatarUrl ?? null) as string | null,
        createdDateTime: (o.createdDateTime ?? o.CreatedDateTime ?? null) as string | null,
      };
    }),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<unknown>(`${BASE}/GetStats`);
  const raw = res.data as unknown;

  const extract = (data: unknown): DashboardStats | null => {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    if ('totalTeachers' in obj || 'TotalTeachers' in obj) {
      return {
        totalTeachers: Number(obj.totalTeachers ?? obj.TotalTeachers ?? 0),
        totalStudents: Number(obj.totalStudents ?? obj.TotalStudents ?? 0),
        totalRooms: Number(obj.totalRooms ?? obj.TotalRooms ?? 0),
        activeSessions: Number(obj.activeSessions ?? obj.ActiveSessions ?? 0),
        totalSessionsHeld: Number(obj.totalSessionsHeld ?? obj.TotalSessionsHeld ?? 0),
        totalCourses: Number(obj.totalCourses ?? obj.TotalCourses ?? 0),
        totalSeminars: Number(obj.totalSeminars ?? obj.TotalSeminars ?? 0),
      };
    }
    return null;
  };

  const direct = extract(raw);
  if (direct) return direct;

  if (raw && typeof raw === 'object' && 'data' in raw) {
    const nested = extract((raw as { data: unknown }).data);
    if (nested) return nested;
  }

  return {
    totalTeachers: 0,
    totalStudents: 0,
    totalRooms: 0,
    activeSessions: 0,
    totalSessionsHeld: 0,
    totalCourses: 0,
    totalSeminars: 0,
  };
}

export async function getDashboardOverview(months = 12): Promise<DashboardOverview> {
  try {
    const res = await apiClient.get<unknown>(`${BASE}/GetOverview`, { params: { months } });
    const raw = res.data as unknown;
    if (raw == null || (typeof raw === 'object' && raw !== null && Object.keys(raw as object).length === 0)) {
      return emptyOverview();
    }
    const direct = extractPayload(raw);
    if (direct) return normalizeDashboardOverview(direct);
  } catch {
    /* 204 No Content or network */
  }
  return emptyOverview();
}

function emptyOverview(): DashboardOverview {
  return {
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
}
