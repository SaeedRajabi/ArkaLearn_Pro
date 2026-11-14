using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;

public class UserActivityEvent : Entity
{
    public long? UserId { get; private set; }
    public string VisitorKey { get; private set; } = string.Empty;
    public string SubjectKey { get; private set; } = string.Empty;
    public string ActionType { get; private set; } = "PageView";
    public string ActionTitle { get; private set; } = string.Empty;
    public string PagePath { get; private set; } = string.Empty;
    public string? PageTitle { get; private set; }
    public string? Referrer { get; private set; }
    public string SiteSource { get; private set; } = "client";
    public string? IpAddressV4 { get; private set; }
    public string? IpAddressV6 { get; private set; }
    public string? UserAgent { get; private set; }
    public string? BrowserName { get; private set; }
    public string? BrowserVersion { get; private set; }
    public string? OperatingSystem { get; private set; }
    public string? DeviceType { get; private set; }
    public string DisplayName { get; private set; } = "کاربر ناشناس";
    public DateTime OccurredAtUtc { get; private set; }
    public string? MetadataJson { get; private set; }

    private UserActivityEvent() { }

    public static UserActivityEvent Create(
        long? userId,
        string visitorKey,
        string subjectKey,
        string actionType,
        string actionTitle,
        string pagePath,
        string? pageTitle,
        string? referrer,
        string siteSource,
        string? ipAddressV4,
        string? ipAddressV6,
        string? userAgent,
        string? browserName,
        string? browserVersion,
        string? operatingSystem,
        string? deviceType,
        string displayName,
        DateTime occurredAtUtc,
        string? metadataJson)
    {
        return new UserActivityEvent
        {
            UserId = userId,
            VisitorKey = visitorKey?.Trim() ?? string.Empty,
            SubjectKey = subjectKey?.Trim() ?? string.Empty,
            ActionType = string.IsNullOrWhiteSpace(actionType) ? "PageView" : actionType.Trim(),
            ActionTitle = actionTitle?.Trim() ?? string.Empty,
            PagePath = pagePath?.Trim() ?? string.Empty,
            PageTitle = pageTitle?.Trim(),
            Referrer = referrer?.Trim(),
            SiteSource = string.IsNullOrWhiteSpace(siteSource) ? "client" : siteSource.Trim(),
            IpAddressV4 = ipAddressV4?.Trim(),
            IpAddressV6 = ipAddressV6?.Trim(),
            UserAgent = userAgent?.Trim(),
            BrowserName = browserName?.Trim(),
            BrowserVersion = browserVersion?.Trim(),
            OperatingSystem = operatingSystem?.Trim(),
            DeviceType = deviceType?.Trim(),
            DisplayName = string.IsNullOrWhiteSpace(displayName) ? "کاربر ناشناس" : displayName.Trim(),
            OccurredAtUtc = occurredAtUtc,
            MetadataJson = metadataJson,
        };
    }
}
