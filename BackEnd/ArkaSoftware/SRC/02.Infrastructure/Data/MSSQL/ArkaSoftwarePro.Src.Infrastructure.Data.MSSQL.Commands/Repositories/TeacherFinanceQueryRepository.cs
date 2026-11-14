using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherCourseSales;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsChart;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherEarningsSummary;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyTeacherPayouts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutQueue;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class TeacherFinanceQueryRepository(ArkaSoftwareCommandDbContext dbContext)
    : ITeacherFinanceQueryRepository
{
    public async Task<MyTeacherEarningsSummaryQri?> GetSummaryAsync(long teacherId, CancellationToken cancellationToken = default)
    {
        var wallet = await dbContext.TeacherWallets.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TeacherId == teacherId, cancellationToken);
        var settings = await dbContext.PlatformFinanceSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken)
            ?? PlatformFinanceSettings.CreateDefault();

        var now = DateTime.UtcNow;
        var startOfDay = now.Date;
        var startOfWeek = startOfDay.AddDays(-(int)now.DayOfWeek);
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfYear = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var sales = await dbContext.TeacherCourseSales.AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .ToListAsync(cancellationToken);

        var period = (DateTime from) => sales.Where(s => s.SoldAtUtc >= from).ToList();

        var today = period(startOfDay);
        var week = period(startOfWeek);
        var month = period(startOfMonth);
        var year = period(startOfYear);

        static (long gross, long net, long tax, int count) Aggregate(IEnumerable<Core.Domain.FinanceAggregate.Entities.TeacherCourseSale> items)
        {
            var list = items.ToList();
            return (
                list.Sum(x => x.GrossAmountToman),
                list.Sum(x => x.NetAmountToman),
                list.Sum(x => x.TaxAmountToman),
                list.Count);
        }

        var todayAgg = Aggregate(today);
        var weekAgg = Aggregate(week);
        var monthAgg = Aggregate(month);
        var yearAgg = Aggregate(year);

        var canRequest = wallet != null && wallet.AvailableBalanceToman > 0;
        DateTime? nextEligible = null;
        if (wallet?.LastPayoutRequestedAtUtc != null)
        {
            nextEligible = wallet.LastPayoutRequestedAtUtc.Value.AddHours(settings.PayoutCooldownHours);
            if (nextEligible > now)
                canRequest = false;
        }

        var teacher = await dbContext.Teachers.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == teacherId, cancellationToken);
        var hasBankInfo = !string.IsNullOrWhiteSpace(teacher?.PayoutSheba)
            && !string.IsNullOrWhiteSpace(teacher?.PayoutCardNumber);
        var platformConfigured = settings.IsPayoutGatewayConfigured();

        return new MyTeacherEarningsSummaryQri
        {
            AvailableBalanceToman = wallet?.AvailableBalanceToman ?? 0,
            ReservedBalanceToman = wallet?.ReservedBalanceToman ?? 0,
            TotalGrossSalesToman = wallet?.TotalGrossSalesToman ?? 0,
            TotalTaxWithheldToman = wallet?.TotalTaxWithheldToman ?? 0,
            TotalPlatformFeeToman = wallet?.TotalPlatformFeeToman ?? 0,
            TotalNetEarnedToman = wallet?.TotalNetEarnedToman ?? 0,
            TotalWithdrawnToman = wallet?.TotalWithdrawnToman ?? 0,
            TotalSaleCount = wallet?.TotalSaleCount ?? 0,
            IncomeTaxPercent = settings.IncomeTaxPercent,
            PayoutCooldownHours = settings.PayoutCooldownHours,
            HasPayoutBankInfo = hasBankInfo,
            CanRequestPayout = canRequest && (wallet?.AvailableBalanceToman ?? 0) > 0 && hasBankInfo && platformConfigured,
            NextPayoutEligibleAtUtc = nextEligible > now ? nextEligible : null,
            SalesTodayGrossToman = todayAgg.gross,
            SalesWeekGrossToman = weekAgg.gross,
            SalesMonthGrossToman = monthAgg.gross,
            SalesYearGrossToman = yearAgg.gross,
            NetTodayToman = todayAgg.net,
            NetWeekToman = weekAgg.net,
            NetMonthToman = monthAgg.net,
            NetYearToman = yearAgg.net,
            TaxTodayToman = todayAgg.tax,
            TaxWeekToman = weekAgg.tax,
            TaxMonthToman = monthAgg.tax,
            TaxYearToman = yearAgg.tax,
            SalesCountToday = todayAgg.count,
            SalesCountWeek = weekAgg.count,
            SalesCountMonth = monthAgg.count,
            SalesCountYear = yearAgg.count,
        };
    }

    public async Task<List<TeacherEarningsChartPointQri>> GetChartAsync(
        long teacherId,
        string period,
        CancellationToken cancellationToken = default)
    {
        var sales = await dbContext.TeacherCourseSales.AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .OrderBy(x => x.SoldAtUtc)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        period = (period ?? "month").Trim().ToLowerInvariant();

        if (period == "day")
        {
            var from = now.Date;
            return Enumerable.Range(0, 24)
                .Select(hour =>
                {
                    var bucketStart = from.AddHours(hour);
                    var bucketEnd = bucketStart.AddHours(1);
                    var bucket = sales.Where(s => s.SoldAtUtc >= bucketStart && s.SoldAtUtc < bucketEnd).ToList();
                    return new TeacherEarningsChartPointQri
                    {
                        Label = $"{hour:00}:00",
                        GrossToman = bucket.Sum(x => x.GrossAmountToman),
                        NetToman = bucket.Sum(x => x.NetAmountToman),
                        TaxToman = bucket.Sum(x => x.TaxAmountToman),
                        SaleCount = bucket.Count,
                    };
                })
                .ToList();
        }

        if (period == "week")
        {
            var from = now.Date.AddDays(-6);
            return Enumerable.Range(0, 7)
                .Select(offset =>
                {
                    var day = from.AddDays(offset);
                    var next = day.AddDays(1);
                    var bucket = sales.Where(s => s.SoldAtUtc >= day && s.SoldAtUtc < next).ToList();
                    return new TeacherEarningsChartPointQri
                    {
                        Label = day.ToString("MM/dd"),
                        GrossToman = bucket.Sum(x => x.GrossAmountToman),
                        NetToman = bucket.Sum(x => x.NetAmountToman),
                        TaxToman = bucket.Sum(x => x.TaxAmountToman),
                        SaleCount = bucket.Count,
                    };
                })
                .ToList();
        }

        if (period == "year")
        {
            return Enumerable.Range(1, 12)
                .Select(month =>
                {
                    var bucket = sales.Where(s => s.SoldAtUtc.Year == now.Year && s.SoldAtUtc.Month == month).ToList();
                    return new TeacherEarningsChartPointQri
                    {
                        Label = month.ToString("00"),
                        GrossToman = bucket.Sum(x => x.GrossAmountToman),
                        NetToman = bucket.Sum(x => x.NetAmountToman),
                        TaxToman = bucket.Sum(x => x.TaxAmountToman),
                        SaleCount = bucket.Count,
                    };
                })
                .ToList();
        }

        // month: last 30 days
        var monthFrom = now.Date.AddDays(-29);
        return Enumerable.Range(0, 30)
            .Select(offset =>
            {
                var day = monthFrom.AddDays(offset);
                var next = day.AddDays(1);
                var bucket = sales.Where(s => s.SoldAtUtc >= day && s.SoldAtUtc < next).ToList();
                return new TeacherEarningsChartPointQri
                {
                    Label = day.ToString("MM/dd"),
                    GrossToman = bucket.Sum(x => x.GrossAmountToman),
                    NetToman = bucket.Sum(x => x.NetAmountToman),
                    TaxToman = bucket.Sum(x => x.TaxAmountToman),
                    SaleCount = bucket.Count,
                };
            })
            .ToList();
    }

    public async Task<List<TeacherCourseSaleQri>> GetRecentSalesAsync(
        long teacherId,
        int take,
        CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 200 ? take : 50;
        return await dbContext.TeacherCourseSales.AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .OrderByDescending(x => x.SoldAtUtc)
            .Take(take)
            .Select(x => new TeacherCourseSaleQri
            {
                Id = x.Id,
                CourseId = x.CourseId,
                CourseTitle = x.CourseTitle,
                Quantity = x.Quantity,
                GrossAmountToman = x.GrossAmountToman,
                TaxAmountToman = x.TaxAmountToman,
                NetAmountToman = x.NetAmountToman,
                InvoiceId = x.InvoiceId,
                OrderId = x.OrderId,
                SoldAtUtc = x.SoldAtUtc,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TeacherPayoutQri>> GetPayoutsAsync(
        long teacherId,
        int take,
        CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 100 ? take : 20;
        var rows = await dbContext.TeacherPayoutRequests.AsNoTracking()
            .Where(x => x.TeacherId == teacherId)
            .OrderByDescending(x => x.RequestedAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);

        return rows.Select(x => new TeacherPayoutQri
        {
            Id = x.Id,
            AmountToman = x.AmountToman,
            Status = x.Status.ToString().ToLowerInvariant(),
            RequestedAtUtc = x.RequestedAtUtc,
            ProcessedAtUtc = x.ProcessedAtUtc,
            TeacherNote = x.TeacherNote,
            AdminNote = x.AdminNote,
            TransferReference = x.TransferReference,
        }).ToList();
    }

    public async Task<List<AdminTeacherPayoutQri>> GetAdminPayoutQueueAsync(
        string? status,
        int take,
        CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 200 ? take : 50;

        var query = dbContext.TeacherPayoutRequests.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<TeacherPayoutStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(x => x.Status == parsedStatus);
        }

        var rows = await query
            .OrderByDescending(x => x.RequestedAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);

        var teacherIds = rows.Select(x => x.TeacherId).Distinct().ToList();
        var teachers = await dbContext.Teachers.AsNoTracking()
            .Where(t => teacherIds.Contains(t.Id))
            .ToListAsync(cancellationToken);

        var userIds = teachers.Where(t => t.UserId.HasValue).Select(t => t.UserId!.Value).Distinct().ToList();
        var users = await dbContext.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        var teacherById = teachers.ToDictionary(t => t.Id);
        var userById = users.ToDictionary(u => u.Id);

        return rows.Select(x =>
        {
            teacherById.TryGetValue(x.TeacherId, out var teacher);
            User? user = null;
            if (teacher?.UserId is long uid)
                userById.TryGetValue(uid, out user);

            var name = user?.UserFullName == null
                ? $"Teacher #{x.TeacherId}"
                : $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim();

            return new AdminTeacherPayoutQri
            {
                Id = x.Id,
                TeacherId = x.TeacherId,
                TeacherName = string.IsNullOrWhiteSpace(name) ? $"Teacher #{x.TeacherId}" : name,
                TeacherEmail = user?.EmailValue ?? string.Empty,
                AmountToman = x.AmountToman,
                Status = x.Status.ToString().ToLowerInvariant(),
                RequestedAtUtc = x.RequestedAtUtc,
                ProcessedAtUtc = x.ProcessedAtUtc,
                TeacherNote = x.TeacherNote,
                AdminNote = x.AdminNote,
                TransferReference = x.TransferReference,
            };
        }).ToList();
    }
}
