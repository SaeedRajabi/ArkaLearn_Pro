using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;

/// <summary>Admin-visible announcement banner content for the dashboard.</summary>
public class AdminAnnouncement : AggregateRoot
{
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    /// <summary>0 = normal, 1 = notable, 2 = critical</summary>
    public byte Priority { get; private set; }

    public bool IsActive { get; private set; }
    public DateTime? ExpiresUtc { get; private set; }

    private AdminAnnouncement() { }

    public static AdminAnnouncement Create(string title, string body, byte priority = 0, DateTime? expiresUtc = null)
    {
        return new AdminAnnouncement
        {
            Title = title ?? string.Empty,
            Body = body ?? string.Empty,
            Priority = priority,
            IsActive = true,
            ExpiresUtc = expiresUtc,
        };
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}
