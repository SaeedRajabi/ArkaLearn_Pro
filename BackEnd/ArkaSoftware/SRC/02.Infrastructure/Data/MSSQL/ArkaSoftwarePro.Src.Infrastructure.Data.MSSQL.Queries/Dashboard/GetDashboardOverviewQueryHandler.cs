using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Dashboard.Queries.GetDashboardOverview;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Dashboard;

public class GetDashboardOverviewQueryHandler : IQueryHandler<GetDashboardOverviewQuery, GetDashboardOverviewQri>
{
    private readonly ArkaSoftwareQueryDbContext _db;
    protected readonly QueryResult<GetDashboardOverviewQri> result = new();

    public GetDashboardOverviewQueryHandler(ArkaSoftwareCMPOutServices _, ArkaSoftwareQueryDbContext db)
    {
        _db = db;
    }

    public async Task<QueryResult<GetDashboardOverviewQri>> Handle(GetDashboardOverviewQuery query)
    {
        var months = Math.Clamp(query.Months, 1, 24);
        var endUtc = DateTime.UtcNow.Date;
        var startMonth = new DateTime(endUtc.Year, endUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-(months - 1));

        var tickets = await _db.SupportTickets.AsNoTracking()
            .Where(x => !x.IsDelete)
            .OrderByDescending(x => x.CreatedDateTime)
            .Take(10)
            .Select(x => new DashboardSupportTicketQri
            {
                Id = x.Id,
                TicketNumber = x.DisplayNumber,
                Subject = x.Subject,
                Status = x.Status,
                RequesterName = x.RequesterName,
                RequesterAvatarUrl = x.RequesterAvatarUrl,
                CreatedDateTime = x.CreatedDateTime,
            })
            .ToListAsync();

        var now = DateTime.UtcNow;
        var announcements = await _db.AdminAnnouncements.AsNoTracking()
            .Where(x => !x.IsDelete && x.IsActive && (x.ExpiresUtc == null || x.ExpiresUtc >= now))
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.CreatedDateTime)
            .Take(10)
            .Select(x => new DashboardAnnouncementQri
            {
                Id = x.Id,
                Title = x.Title,
                Body = x.Body,
                Priority = x.Priority,
                CreatedDateTime = x.CreatedDateTime,
            })
            .ToListAsync();

        var recentArticles = await _db.Articles.AsNoTracking()
            .OrderByDescending(a => a.PublishedAt ?? a.CreatedDateTime)
            .Take(5)
            .Select(a => new DashboardRecentArticleQri
            {
                Id = a.Id,
                Title = a.Title ?? "",
                CategoryTitle = a.Category != null ? a.Category.Title : "",
                ApprovedCommentCount = a.Comments.Count(c => c.IsApproved),
                PublishedAt = a.PublishedAt ?? a.CreatedDateTime,
            })
            .ToListAsync();

        var enrollmentGroups = await _db.Enrollments.AsNoTracking()
            .Where(e => e.EnrollmentDateTime >= startMonth)
            .GroupBy(e => new { e.EnrollmentDateTime.Year, e.EnrollmentDateTime.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .ToListAsync();

        var salesGroups = await _db.Invoices.AsNoTracking()
            .Where(i => i.InvoiceDate >= startMonth)
            .GroupBy(i => new { i.InvoiceDate.Year, i.InvoiceDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, TotalPaid = g.Sum(x => x.PaidAmount) })
            .ToListAsync();

        var enrollmentDict = enrollmentGroups.ToDictionary(x => (x.Year, x.Month), x => x.Count);
        var salesDict = salesGroups.ToDictionary(x => (x.Year, x.Month), x => x.TotalPaid);

        var monthlyEnrollments = new List<DashboardMonthlyEnrollmentQri>();
        var monthlySales = new List<DashboardMonthlySalesQri>();
        var cursor = startMonth;
        var endMonth = new DateTime(endUtc.Year, endUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        while (cursor <= endMonth)
        {
            var key = (cursor.Year, cursor.Month);
            enrollmentDict.TryGetValue(key, out var ec);
            salesDict.TryGetValue(key, out var sp);
            monthlyEnrollments.Add(new DashboardMonthlyEnrollmentQri { Year = cursor.Year, Month = cursor.Month, Count = ec });
            monthlySales.Add(new DashboardMonthlySalesQri { Year = cursor.Year, Month = cursor.Month, TotalPaid = sp });
            cursor = cursor.AddMonths(1);
        }

        var enrollmentPeriodTotal = monthlyEnrollments.Sum(x => x.Count);
        var salesPeriodTotal = monthlySales.Sum(x => x.TotalPaid);

        var topInstructors = await _db.Teachers.AsNoTracking()
            .Select(t => new
            {
                t.Id,
                t.UserId,
                FirstName = t.User.FirstName,
                LastName = t.User.LastName,
                UserName = t.User.UserName,
                Email = t.User.Email,
                Avatar = t.User.ProfileImage,
                PublishedCourseCount = t.Courses.Count(c => c.IsPublish),
                AverageCourseRating = t.Courses.Where(c => c.IsPublish).Average(c => (double?)c.AverageRateValue),
            })
            .OrderByDescending(x => x.PublishedCourseCount)
            .Take(5)
            .ToListAsync();

        var instructorQri = topInstructors.Select(x =>
        {
            var fn = x.FirstName?.Trim() ?? "";
            var ln = x.LastName?.Trim() ?? "";
            var dn = $"{fn} {ln}".Trim();
            if (string.IsNullOrEmpty(dn))
                dn = x.UserName?.Trim() ?? x.Email?.Trim() ?? "";
            return new DashboardTopInstructorQri
            {
                TeacherId = x.Id,
                UserId = x.UserId,
                DisplayName = dn,
                AvatarUrl = x.Avatar,
                PublishedCourseCount = x.PublishedCourseCount,
                AverageCourseRating = x.AverageCourseRating,
            };
        }).ToList();

        var pendingProjectOrdersCount = await _db.ProjectOrders.AsNoTracking()
            .CountAsync(x => !x.IsDelete && x.Status == ProjectOrderStatus.Submitted);

        var recentProjectOrderRows = await _db.ProjectOrders.AsNoTracking()
            .Include(x => x.User)
            .Where(x => !x.IsDelete)
            .OrderByDescending(x => x.CreatedDateTime)
            .Take(10)
            .ToListAsync();

        var recentProjectOrders = recentProjectOrderRows.Select(x =>
        {
            var fn = x.User?.FirstName?.Trim() ?? x.FirstName?.Trim() ?? "";
            var ln = x.User?.LastName?.Trim() ?? x.LastName?.Trim() ?? "";
            var dn = $"{fn} {ln}".Trim();
            if (string.IsNullOrEmpty(dn))
                dn = x.User?.UserName?.Trim() ?? x.User?.Email?.Trim() ?? "";
            return new DashboardProjectOrderQri
            {
                Id = x.Id,
                RequestNumber = x.RequestNumber,
                Title = x.Title,
                Status = x.Status.ToString(),
                RequesterName = dn,
                RequesterAvatarUrl = x.User?.ProfileImage,
                CreatedDateTime = x.CreatedDateTime,
            };
        }).ToList();

        result._data = new GetDashboardOverviewQri
        {
            RecentSupportTickets = tickets,
            Announcements = announcements,
            RecentArticles = recentArticles,
            MonthlyEnrollments = monthlyEnrollments,
            MonthlySales = monthlySales,
            TopInstructors = instructorQri,
            EnrollmentPeriodTotal = enrollmentPeriodTotal,
            SalesPeriodTotal = salesPeriodTotal,
            PendingProjectOrdersCount = pendingProjectOrdersCount,
            RecentProjectOrders = recentProjectOrders,
        };
        result.Status = ApplicationServiceStatus.Ok;
        return result;
    }
}
