using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopAppReleaseAggregate.Entities;

public class DesktopAppRelease : AggregateRoot
{
    public string Version { get; private set; } = string.Empty;
    public string InstallerUrl { get; private set; } = string.Empty;
    public string? ReleaseNotes { get; private set; }
    public bool IsMandatory { get; private set; }
    public string? MinSupportedVersion { get; private set; }
    public DateTime PublishedAtUtc { get; private set; }
    public bool IsPublished { get; private set; }
    public long? PublishedByAdminUserId { get; private set; }

    private DesktopAppRelease() { }

    public static DesktopAppRelease Create(
        string version,
        string installerUrl,
        string? releaseNotes,
        bool isMandatory,
        string? minSupportedVersion,
        long? publishedByAdminUserId)
    {
        if (string.IsNullOrWhiteSpace(version))
            throw new ArgumentException("Version is required.", nameof(version));
        if (string.IsNullOrWhiteSpace(installerUrl))
            throw new ArgumentException("Installer URL is required.", nameof(installerUrl));

        return new DesktopAppRelease
        {
            Version = version.Trim(),
            InstallerUrl = installerUrl.Trim(),
            ReleaseNotes = string.IsNullOrWhiteSpace(releaseNotes) ? null : releaseNotes.Trim(),
            IsMandatory = isMandatory,
            MinSupportedVersion = string.IsNullOrWhiteSpace(minSupportedVersion) ? null : minSupportedVersion.Trim(),
            PublishedAtUtc = DateTime.UtcNow,
            IsPublished = true,
            PublishedByAdminUserId = publishedByAdminUserId,
        };
    }

    public void Unpublish() => IsPublished = false;
}
