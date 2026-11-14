using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.UserActivity;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.SearchUserActivitySubjects;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserActivityServices.Queries;

public class SearchUserActivitySubjectsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserActivityRepository activityRepository,
    IUserActivityBuffer activityBuffer,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchUserActivitySubjectsQuery, PagedData<UserActivitySubjectListItemQri>>(outer)
{
    public override async Task<QueryResult<PagedData<UserActivitySubjectListItemQri>>> Handle(SearchUserActivitySubjectsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
        var pageSize = query.PageSize is < 1 or > 100 ? 20 : query.PageSize;

        IReadOnlyList<UserActivitySubjectListItemQri> dbItems = Array.Empty<UserActivitySubjectListItemQri>();
        try
        {
            var dbResult = await activityRepository.SearchSubjectsAsync(query);
            dbItems = dbResult.QueryResult ?? new List<UserActivitySubjectListItemQri>();
        }
        catch
        {
            // Table/schema may be missing until migration is applied — still show buffered events.
            dbItems = Array.Empty<UserActivitySubjectListItemQri>();
        }

        var buffered = activityBuffer.SearchSubjects(query.Search, 1, int.MaxValue, out _);

        var merged = MergeSubjects(dbItems, buffered);
        var search = query.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            merged = merged
                .Where(x =>
                    x.DisplayName.Contains(search, StringComparison.OrdinalIgnoreCase)
                    || x.SubjectKey.Contains(search, StringComparison.OrdinalIgnoreCase)
                    || (x.LatestIpAddressV4?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (x.LatestIpAddressV6?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false))
                .ToList();
        }

        var total = merged.Count;
        var pageItems = merged
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var result = new PagedData<UserActivitySubjectListItemQri>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = total,
            QueryResult = pageItems,
        };

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }

    private static List<UserActivitySubjectListItemQri> MergeSubjects(
        IReadOnlyList<UserActivitySubjectListItemQri> dbItems,
        IReadOnlyList<UserActivitySubjectSummary> bufferedItems)
    {
        var map = new Dictionary<string, UserActivitySubjectListItemQri>(StringComparer.OrdinalIgnoreCase);

        foreach (var item in dbItems)
            map[item.SubjectKey] = item;

        foreach (var item in bufferedItems)
        {
            if (map.TryGetValue(item.SubjectKey, out var existing))
            {
                map[item.SubjectKey] = new UserActivitySubjectListItemQri
                {
                    SubjectKey = item.SubjectKey,
                    UserId = item.UserId ?? existing.UserId,
                    VisitorKey = string.IsNullOrWhiteSpace(item.VisitorKey) ? existing.VisitorKey : item.VisitorKey,
                    DisplayName = string.IsNullOrWhiteSpace(item.DisplayName) ? existing.DisplayName : item.DisplayName,
                    IsAnonymous = item.IsAnonymous,
                    LatestIpAddressV4 = item.LatestIpAddressV4 ?? existing.LatestIpAddressV4,
                    LatestIpAddressV6 = item.LatestIpAddressV6 ?? existing.LatestIpAddressV6,
                    LatestBrowserName = item.LatestBrowserName ?? existing.LatestBrowserName,
                    LatestOperatingSystem = item.LatestOperatingSystem ?? existing.LatestOperatingSystem,
                    LatestDeviceType = item.LatestDeviceType ?? existing.LatestDeviceType,
                    LatestSiteSource = item.LatestSiteSource ?? existing.LatestSiteSource,
                    LastActivityAtUtc = item.LastActivityAtUtc > existing.LastActivityAtUtc
                        ? item.LastActivityAtUtc
                        : existing.LastActivityAtUtc,
                    EventCount = existing.EventCount + item.EventCount,
                };
            }
            else
            {
                map[item.SubjectKey] = new UserActivitySubjectListItemQri
                {
                    SubjectKey = item.SubjectKey,
                    UserId = item.UserId,
                    VisitorKey = item.VisitorKey,
                    DisplayName = item.DisplayName,
                    IsAnonymous = item.IsAnonymous,
                    LatestIpAddressV4 = item.LatestIpAddressV4,
                    LatestIpAddressV6 = item.LatestIpAddressV6,
                    LatestBrowserName = item.LatestBrowserName,
                    LatestOperatingSystem = item.LatestOperatingSystem,
                    LatestDeviceType = item.LatestDeviceType,
                    LatestSiteSource = item.LatestSiteSource,
                    LastActivityAtUtc = item.LastActivityAtUtc,
                    EventCount = item.EventCount,
                };
            }
        }

        return map.Values
            .OrderByDescending(x => x.LastActivityAtUtc)
            .ToList();
    }
}
