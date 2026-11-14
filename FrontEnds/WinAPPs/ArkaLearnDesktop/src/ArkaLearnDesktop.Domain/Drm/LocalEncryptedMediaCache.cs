namespace ArkaLearnDesktop.Domain.Drm;

public sealed class LocalEncryptedMediaCache
{
    public long Id { get; set; }
    public long MediaAssetId { get; set; }
    public long? CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string LocalEncryptedPath { get; set; } = string.Empty;
    public string IvBase64 { get; set; } = string.Empty;
    public string? ContentChecksumSha256 { get; set; }
    public string MimeType { get; set; } = "video/mp4";
    public long FileSizeBytes { get; set; }
    public DateTime DownloadedAtUtc { get; set; }
}
