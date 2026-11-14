namespace ArkaLearnDesktop.Domain.Drm;

public sealed class OfflineLicenseCache
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public string GrantToken { get; set; } = string.Empty;
    public DateTime IssuedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public string DeviceId { get; set; } = string.Empty;

    public bool IsValid(DateTime utcNow) =>
        !string.IsNullOrWhiteSpace(GrantToken) && utcNow < ExpiresAtUtc;
}
