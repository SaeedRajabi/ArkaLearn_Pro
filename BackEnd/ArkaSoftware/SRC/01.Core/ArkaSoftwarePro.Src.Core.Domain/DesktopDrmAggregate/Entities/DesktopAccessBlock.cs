using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

public class DesktopAccessBlock : AggregateRoot
{
    public long UserId { get; private set; }
    public DesktopBlockScope Scope { get; private set; }
    public string? Reason { get; private set; }
    public DateTime BlockedAtUtc { get; private set; }
    public DateTime? UnblockedAtUtc { get; private set; }
    public long? BlockedByAdminUserId { get; private set; }
    public bool IsActive => UnblockedAtUtc is null && !IsDelete;

    private DesktopAccessBlock() { }

    public static DesktopAccessBlock Create(
        long userId,
        DesktopBlockScope scope,
        string? reason,
        long? blockedByAdminUserId)
    {
        if (userId <= 0) throw new ArgumentException("User id is required.", nameof(userId));

        return new DesktopAccessBlock
        {
            UserId = userId,
            Scope = scope,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
            BlockedAtUtc = DateTime.UtcNow,
            BlockedByAdminUserId = blockedByAdminUserId,
        };
    }

    public void Unblock()
    {
        if (UnblockedAtUtc.HasValue) return;
        UnblockedAtUtc = DateTime.UtcNow;
    }
}

public enum DesktopBlockScope
{
    VideosOnly = 0,
    EntireDesktopApp = 1,
}
