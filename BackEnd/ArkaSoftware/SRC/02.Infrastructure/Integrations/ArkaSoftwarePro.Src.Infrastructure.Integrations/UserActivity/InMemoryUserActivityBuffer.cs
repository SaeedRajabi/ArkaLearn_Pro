using ArkaSoftwarePro.Src.Core.Contracts.UserActivity;
using ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.UserActivity;

public sealed class InMemoryUserActivityBuffer : IUserActivityBuffer
{
    private readonly object _sync = new();
    private readonly List<UserActivityBufferEvent> _events = [];

    public int BufferedEventCount
    {
        get
        {
            lock (_sync)
                return _events.Count;
        }
    }

    public void Add(UserActivityBufferEvent activityEvent)
    {
        lock (_sync)
            _events.Add(activityEvent);
    }

    public IReadOnlyList<UserActivityBufferEvent> GetEventsForSubject(
        string subjectKey,
        DateTime? fromUtc,
        DateTime? toUtc)
    {
        lock (_sync)
        {
            return _events
                .Where(x => string.Equals(x.SubjectKey, subjectKey, StringComparison.OrdinalIgnoreCase))
                .Where(x => !fromUtc.HasValue || x.OccurredAtUtc >= fromUtc.Value)
                .Where(x => !toUtc.HasValue || x.OccurredAtUtc <= toUtc.Value)
                .OrderBy(x => x.OccurredAtUtc)
                .ToList();
        }
    }

    public IReadOnlyList<UserActivitySubjectSummary> SearchSubjects(
        string? search,
        int pageNumber,
        int pageSize,
        out int totalCount)
    {
        lock (_sync)
        {
            var grouped = _events
                .GroupBy(x => x.SubjectKey, StringComparer.OrdinalIgnoreCase)
                .Select(g =>
                {
                    var latest = g.OrderByDescending(x => x.OccurredAtUtc).First();
                    return new UserActivitySubjectSummary
                    {
                        SubjectKey = g.Key,
                        UserId = latest.UserId,
                        VisitorKey = latest.VisitorKey,
                        DisplayName = latest.DisplayName,
                        IsAnonymous = latest.UserId is not > 0,
                        LatestIpAddressV4 = latest.IpAddressV4,
                        LatestIpAddressV6 = latest.IpAddressV6,
                        LatestBrowserName = latest.BrowserName,
                        LatestOperatingSystem = latest.OperatingSystem,
                        LatestDeviceType = latest.DeviceType,
                        LatestSiteSource = latest.SiteSource,
                        LastActivityAtUtc = latest.OccurredAtUtc,
                        EventCount = g.Count(),
                    };
                })
                .OrderByDescending(x => x.LastActivityAtUtc)
                .ToList();

            if (!string.IsNullOrWhiteSpace(search))
            {
                grouped = grouped
                    .Where(x =>
                        x.DisplayName.Contains(search, StringComparison.OrdinalIgnoreCase)
                        || x.SubjectKey.Contains(search, StringComparison.OrdinalIgnoreCase)
                        || (x.LatestIpAddressV4?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false)
                        || (x.LatestIpAddressV6?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false))
                    .ToList();
            }

            totalCount = grouped.Count;
            return grouped
                .Skip((Math.Max(pageNumber, 1) - 1) * Math.Max(pageSize, 1))
                .Take(Math.Max(pageSize, 1))
                .ToList();
        }
    }

    public DateTime? GetLastActivityDayUtc(string subjectKey)
    {
        lock (_sync)
        {
            var last = _events
                .Where(x => string.Equals(x.SubjectKey, subjectKey, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(x => x.OccurredAtUtc)
                .FirstOrDefault();
            return last?.OccurredAtUtc.Date;
        }
    }

    public IReadOnlyList<UserActivityEvent> DrainAllForPersistence()
    {
        lock (_sync)
        {
            if (_events.Count == 0)
                return Array.Empty<UserActivityEvent>();

            var drained = _events
                .Select(x => UserActivityEvent.Create(
                    x.UserId,
                    x.VisitorKey,
                    x.SubjectKey,
                    x.ActionType,
                    x.ActionTitle,
                    x.PagePath,
                    x.PageTitle,
                    x.Referrer,
                    x.SiteSource,
                    x.IpAddressV4,
                    x.IpAddressV6,
                    x.UserAgent,
                    x.BrowserName,
                    x.BrowserVersion,
                    x.OperatingSystem,
                    x.DeviceType,
                    x.DisplayName,
                    x.OccurredAtUtc,
                    x.MetadataJson))
                .ToList();

            _events.Clear();
            return drained;
        }
    }

    public void Restore(IReadOnlyList<UserActivityEvent> events)
    {
        if (events.Count == 0)
            return;

        lock (_sync)
        {
            foreach (var x in events)
            {
                _events.Add(new UserActivityBufferEvent
                {
                    UserId = x.UserId,
                    VisitorKey = x.VisitorKey,
                    SubjectKey = x.SubjectKey,
                    ActionType = x.ActionType,
                    ActionTitle = x.ActionTitle,
                    PagePath = x.PagePath,
                    PageTitle = x.PageTitle,
                    Referrer = x.Referrer,
                    SiteSource = x.SiteSource,
                    IpAddressV4 = x.IpAddressV4,
                    IpAddressV6 = x.IpAddressV6,
                    UserAgent = x.UserAgent,
                    BrowserName = x.BrowserName,
                    BrowserVersion = x.BrowserVersion,
                    OperatingSystem = x.OperatingSystem,
                    DeviceType = x.DeviceType,
                    DisplayName = x.DisplayName,
                    OccurredAtUtc = x.OccurredAtUtc,
                    MetadataJson = x.MetadataJson,
                });
            }
        }
    }
}
