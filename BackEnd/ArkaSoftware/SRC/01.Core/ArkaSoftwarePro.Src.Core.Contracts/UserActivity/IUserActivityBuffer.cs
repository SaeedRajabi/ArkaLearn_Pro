using ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.UserActivity;

public sealed class UserActivityBufferEvent
{
    public long? UserId { get; init; }
    public string VisitorKey { get; init; } = string.Empty;
    public string SubjectKey { get; init; } = string.Empty;
    public string ActionType { get; init; } = "PageView";
    public string ActionTitle { get; init; } = string.Empty;
    public string PagePath { get; init; } = string.Empty;
    public string? PageTitle { get; init; }
    public string? Referrer { get; init; }
    public string SiteSource { get; init; } = "client";
    public string? IpAddressV4 { get; init; }
    public string? IpAddressV6 { get; init; }
    public string? UserAgent { get; init; }
    public string? BrowserName { get; init; }
    public string? BrowserVersion { get; init; }
    public string? OperatingSystem { get; init; }
    public string? DeviceType { get; init; }
    public string DisplayName { get; init; } = "کاربر ناشناس";
    public DateTime OccurredAtUtc { get; init; }
    public string? MetadataJson { get; init; }
}

public sealed class UserActivitySubjectSummary
{
    public string SubjectKey { get; init; } = string.Empty;
    public long? UserId { get; init; }
    public string VisitorKey { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public bool IsAnonymous { get; init; }
    public string? LatestIpAddressV4 { get; init; }
    public string? LatestIpAddressV6 { get; init; }
    public string? LatestBrowserName { get; init; }
    public string? LatestOperatingSystem { get; init; }
    public string? LatestDeviceType { get; init; }
    public string? LatestSiteSource { get; init; }
    public DateTime LastActivityAtUtc { get; init; }
    public int EventCount { get; init; }
}

public interface IUserActivityBuffer
{
    void Add(UserActivityBufferEvent activityEvent);
    IReadOnlyList<UserActivityBufferEvent> GetEventsForSubject(string subjectKey, DateTime? fromUtc, DateTime? toUtc);
    IReadOnlyList<UserActivitySubjectSummary> SearchSubjects(string? search, int pageNumber, int pageSize, out int totalCount);
    DateTime? GetLastActivityDayUtc(string subjectKey);
    IReadOnlyList<UserActivityEvent> DrainAllForPersistence();
    /// <summary>Re-queue events after a failed DB flush so data is not lost.</summary>
    void Restore(IReadOnlyList<UserActivityEvent> events);
    int BufferedEventCount { get; }
}
