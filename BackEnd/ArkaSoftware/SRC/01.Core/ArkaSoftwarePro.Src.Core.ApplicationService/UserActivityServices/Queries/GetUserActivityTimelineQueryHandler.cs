using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.UserActivity;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.GetUserActivityTimeline;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserActivityServices.Queries;

public class GetUserActivityTimelineQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserActivityRepository activityRepository,
    IUserActivityBuffer activityBuffer,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetUserActivityTimelineQuery, UserActivityTimelineQri>(outer)
{
    public override async Task<QueryResult<UserActivityTimelineQri>> Handle(GetUserActivityTimelineQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var subjectKey = query.SubjectKey?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(subjectKey))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        DateTime? fromUtc = query.FromUtc;
        DateTime? toUtc = query.ToUtc;

        if (fromUtc == null && toUtc == null)
        {
            var lastBufferedDay = activityBuffer.GetLastActivityDayUtc(subjectKey);
            DateTime? lastDbDay = null;
            try
            {
                lastDbDay = await activityRepository.GetLastActivityDayUtcAsync(subjectKey);
            }
            catch
            {
                lastDbDay = null;
            }

            var lastDay = new[] { lastBufferedDay, lastDbDay }.Where(x => x.HasValue).Max();
            if (lastDay.HasValue)
            {
                fromUtc = lastDay.Value.Date;
                toUtc = fromUtc.Value.AddDays(1).AddTicks(-1);
            }
        }
        else if (fromUtc.HasValue && !toUtc.HasValue)
        {
            toUtc = fromUtc.Value.Date.AddDays(1).AddTicks(-1);
        }
        else if (!fromUtc.HasValue && toUtc.HasValue)
        {
            fromUtc = toUtc.Value.Date;
        }

        IReadOnlyList<UserActivityTimelineItemQri> dbItems;
        try
        {
            dbItems = await activityRepository.GetTimelineAsync(new GetUserActivityTimelineQuery
            {
                SubjectKey = subjectKey,
                FromUtc = fromUtc,
                ToUtc = toUtc,
            });
        }
        catch
        {
            dbItems = Array.Empty<UserActivityTimelineItemQri>();
        }

        var bufferedItems = activityBuffer
            .GetEventsForSubject(subjectKey, fromUtc, toUtc)
            .Select((x, index) => new UserActivityTimelineItemQri
            {
                Id = -(index + 1),
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
                IsBuffered = true,
            })
            .ToList();

        var merged = dbItems
            .Concat(bufferedItems)
            .OrderBy(x => x.OccurredAtUtc)
            .ToList();

        var displayName = merged.LastOrDefault()?.DisplayName
            ?? dbItems.LastOrDefault()?.DisplayName
            ?? bufferedItems.LastOrDefault()?.DisplayName
            ?? "کاربر ناشناس";

        var isAnonymous = subjectKey.StartsWith("anon-", StringComparison.OrdinalIgnoreCase);

        return await ResultAsync(new UserActivityTimelineQri
        {
            SubjectKey = subjectKey,
            DisplayName = displayName,
            IsAnonymous = isAnonymous,
            SelectedDayUtc = fromUtc?.Date,
            Items = merged,
        }, ApplicationServiceStatus.Ok);
    }
}
