namespace ArkaSoftwarePro.Src.Core.RequestResponse.Dashboard.Queries.GetDashboardOverview;

public class GetDashboardOverviewQri
{
    public List<DashboardSupportTicketQri> RecentSupportTickets { get; set; } = new();

    public List<DashboardAnnouncementQri> Announcements { get; set; } = new();

    public List<DashboardRecentArticleQri> RecentArticles { get; set; } = new();

    public List<DashboardMonthlyEnrollmentQri> MonthlyEnrollments { get; set; } = new();

    public List<DashboardMonthlySalesQri> MonthlySales { get; set; } = new();

    public List<DashboardTopInstructorQri> TopInstructors { get; set; } = new();

    public decimal SalesPeriodTotal { get; set; }

    public int EnrollmentPeriodTotal { get; set; }

    public int PendingProjectOrdersCount { get; set; }

    public List<DashboardProjectOrderQri> RecentProjectOrders { get; set; } = new();
}

public class DashboardProjectOrderQri
{
    public long Id { get; set; }
    public int RequestNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }
    public DateTime? CreatedDateTime { get; set; }
}

public class DashboardSupportTicketQri
{
    public long Id { get; set; }
    public int TicketNumber { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }
    public DateTime? CreatedDateTime { get; set; }
}

public class DashboardAnnouncementQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public byte Priority { get; set; }
    public DateTime? CreatedDateTime { get; set; }
}

public class DashboardRecentArticleQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CategoryTitle { get; set; } = string.Empty;
    public int ApprovedCommentCount { get; set; }
    public DateTime? PublishedAt { get; set; }
}

public class DashboardMonthlyEnrollmentQri
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int Count { get; set; }
}

public class DashboardMonthlySalesQri
{
    public int Year { get; set; }
    public int Month { get; set; }
    /// <summary>Sum of invoice paid amounts in that month.</summary>
    public decimal TotalPaid { get; set; }
}

public class DashboardTopInstructorQri
{
    public long TeacherId { get; set; }
    public long UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int PublishedCourseCount { get; set; }
    public double? AverageCourseRating { get; set; }
}
