using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

/// <summary>72-hour offline playback grant tied to an enrollment/course.</summary>
public class OfflinePlaybackGrant : AggregateRoot
{
    public const int DefaultTtlHours = 72;

    public long LicenseId { get; private set; }
    public long UserId { get; private set; }
    public long CourseId { get; private set; }
    public long? EnrollmentId { get; private set; }
    public string TokenJti { get; private set; } = string.Empty;
    public string TokenHash { get; private set; } = string.Empty;
    public DateTime IssuedAtUtc { get; private set; }
    public DateTime ExpiresAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }
    public string? DeviceId { get; private set; }

    private OfflinePlaybackGrant() { }

    public static OfflinePlaybackGrant Issue(
        long licenseId,
        long userId,
        long courseId,
        string tokenJti,
        string tokenHash,
        long? enrollmentId = null,
        string? deviceId = null,
        int ttlHours = DefaultTtlHours)
    {
        if (licenseId <= 0) throw new ArgumentException("License id is required.", nameof(licenseId));
        if (userId <= 0) throw new ArgumentException("User id is required.", nameof(userId));
        if (courseId <= 0) throw new ArgumentException("Course id is required.", nameof(courseId));
        if (string.IsNullOrWhiteSpace(tokenJti)) throw new ArgumentException("Token jti is required.", nameof(tokenJti));
        if (string.IsNullOrWhiteSpace(tokenHash)) throw new ArgumentException("Token hash is required.", nameof(tokenHash));

        var now = DateTime.UtcNow;
        return new OfflinePlaybackGrant
        {
            LicenseId = licenseId,
            UserId = userId,
            CourseId = courseId,
            EnrollmentId = enrollmentId,
            TokenJti = tokenJti.Trim(),
            TokenHash = tokenHash.Trim(),
            IssuedAtUtc = now,
            ExpiresAtUtc = now.AddHours(ttlHours <= 0 ? DefaultTtlHours : ttlHours),
            DeviceId = string.IsNullOrWhiteSpace(deviceId) ? null : deviceId.Trim(),
        };
    }

    public bool IsValid(DateTime utcNow) =>
        !IsDelete && !RevokedAtUtc.HasValue && utcNow < ExpiresAtUtc;

    public void Revoke()
    {
        if (RevokedAtUtc.HasValue) return;
        RevokedAtUtc = DateTime.UtcNow;
    }
}
