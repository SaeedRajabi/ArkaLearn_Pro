using ArkaSoftwarePro.Src.Core.Contracts.UserActivity;
using ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.GetUserActivityTimeline;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.SearchUserActivitySubjects;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class UserActivityRepository(ArkaSoftwareCommandDbContext dbContext) : IUserActivityRepository
{
    private readonly ArkaSoftwareCommandDbContext _dbContext = dbContext;
    public async Task BulkInsertAsync(IReadOnlyList<UserActivityEvent> events, CancellationToken cancellationToken = default)
    {
        if (events.Count == 0)
            return;

        await _dbContext.Set<UserActivityEvent>().AddRangeAsync(events, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedData<UserActivitySubjectListItemQri>> SearchSubjectsAsync(
        SearchUserActivitySubjectsQuery query,
        CancellationToken cancellationToken = default)
    {
        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;
        var search = query.Search?.Trim();

        var baseQuery = _dbContext.Set<UserActivityEvent>()
            .AsNoTracking()
            .Where(x => !x.IsDelete);

        if (!string.IsNullOrWhiteSpace(search))
        {
            baseQuery = baseQuery.Where(x =>
                x.DisplayName.Contains(search)
                || x.SubjectKey.Contains(search)
                || (x.IpAddressV4 != null && x.IpAddressV4.Contains(search))
                || (x.IpAddressV6 != null && x.IpAddressV6.Contains(search)));
        }

        var grouped = await baseQuery
            .GroupBy(x => x.SubjectKey)
            .Select(g => new
            {
                SubjectKey = g.Key,
                LastActivityAtUtc = g.Max(x => x.OccurredAtUtc),
                EventCount = g.Count(),
            })
            .OrderByDescending(x => x.LastActivityAtUtc)
            .ToListAsync(cancellationToken);

        // Return all subjects — the query handler merges with the in-memory buffer and paginates.
        var items = new List<UserActivitySubjectListItemQri>();
        foreach (var row in grouped)
        {
            var last = await _dbContext.Set<UserActivityEvent>()
                .AsNoTracking()
                .Where(x => !x.IsDelete && x.SubjectKey == row.SubjectKey && x.OccurredAtUtc == row.LastActivityAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (last == null)
                continue;

            items.Add(new UserActivitySubjectListItemQri
            {
                SubjectKey = row.SubjectKey,
                UserId = last.UserId,
                VisitorKey = last.VisitorKey,
                DisplayName = last.DisplayName,
                IsAnonymous = last.UserId is not > 0,
                LatestIpAddressV4 = last.IpAddressV4,
                LatestIpAddressV6 = last.IpAddressV6,
                LatestBrowserName = last.BrowserName,
                LatestOperatingSystem = last.OperatingSystem,
                LatestDeviceType = last.DeviceType,
                LatestSiteSource = last.SiteSource,
                LastActivityAtUtc = last.OccurredAtUtc,
                EventCount = row.EventCount,
            });
        }

        return new PagedData<UserActivitySubjectListItemQri>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = items.Count,
            QueryResult = items,
        };
    }

    public async Task<IReadOnlyList<UserActivityTimelineItemQri>> GetTimelineAsync(
        GetUserActivityTimelineQuery query,
        CancellationToken cancellationToken = default)
    {
        var subjectKey = query.SubjectKey?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(subjectKey))
            return Array.Empty<UserActivityTimelineItemQri>();

        var eventsQuery = _dbContext.Set<UserActivityEvent>()
            .AsNoTracking()
            .Where(x => !x.IsDelete && x.SubjectKey == subjectKey);

        if (query.FromUtc.HasValue)
            eventsQuery = eventsQuery.Where(x => x.OccurredAtUtc >= query.FromUtc.Value);
        if (query.ToUtc.HasValue)
            eventsQuery = eventsQuery.Where(x => x.OccurredAtUtc <= query.ToUtc.Value);

        return await eventsQuery
            .OrderBy(x => x.OccurredAtUtc)
            .Select(x => new UserActivityTimelineItemQri
            {
                Id = x.Id,
                ActionType = x.ActionType,
                ActionTitle = x.ActionTitle,
                PagePath = x.PagePath,
                PageTitle = x.PageTitle,
                Referrer = x.Referrer,
                SiteSource = x.SiteSource,
                IpAddressV4 = x.IpAddressV4,
                IpAddressV6 = x.IpAddressV6,
                BrowserName = x.BrowserName,
                BrowserVersion = x.BrowserVersion,
                OperatingSystem = x.OperatingSystem,
                DeviceType = x.DeviceType,
                UserAgent = x.UserAgent,
                DisplayName = x.DisplayName,
                OccurredAtUtc = x.OccurredAtUtc,
                MetadataJson = x.MetadataJson,
                IsBuffered = false,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<DateTime?> GetLastActivityDayUtcAsync(string subjectKey, CancellationToken cancellationToken = default)
    {
        var last = await _dbContext.Set<UserActivityEvent>()
            .AsNoTracking()
            .Where(x => !x.IsDelete && x.SubjectKey == subjectKey)
            .OrderByDescending(x => x.OccurredAtUtc)
            .Select(x => x.OccurredAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return last == default ? null : last.Date;
    }
}
