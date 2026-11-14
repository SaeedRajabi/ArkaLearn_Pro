using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopEncryptedMedia;

public class GetDesktopEncryptedMediaQuery : IQuery<List<DesktopEncryptedMediaQri>>
{
    public long UserId { get; set; }
    public string? DeviceId { get; set; }
}

public class DesktopEncryptedMediaQri
{
    public long MediaAssetId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? EncryptedFileUrl { get; set; }
    public string? ContentKeyId { get; set; }
    public string? EncryptionIvBase64 { get; set; }
    public string? ContentChecksumSha256 { get; set; }
    public long? CourseId { get; set; }
    public string? CourseTitle { get; set; }
}
