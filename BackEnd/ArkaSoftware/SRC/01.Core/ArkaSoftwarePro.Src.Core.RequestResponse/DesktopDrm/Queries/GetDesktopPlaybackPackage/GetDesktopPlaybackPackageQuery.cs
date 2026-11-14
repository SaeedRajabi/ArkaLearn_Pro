using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopPlaybackPackage;

public class GetDesktopPlaybackPackageQuery : IQuery<DesktopPlaybackPackageQri>
{
    public long UserId { get; set; }
    public long MediaAssetId { get; set; }
    public string GrantToken { get; set; } = string.Empty;
    public long? CourseId { get; set; }
    public string? DeviceId { get; set; }
}

public class DesktopPlaybackPackageQri
{
    public long MediaAssetId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string EncryptedFileUrl { get; set; } = string.Empty;
    public string EncryptionAlgorithm { get; set; } = "AES-256-CBC";
    public string IvBase64 { get; set; } = string.Empty;
    public string WrappedContentKeyBase64 { get; set; } = string.Empty;
    public string? ContentChecksumSha256 { get; set; }
    public DateTime GrantExpiresAtUtc { get; set; }

    /// <summary>Internal — stripped before API response.</summary>
    public string ContentKeyId { get; set; } = string.Empty;
}
