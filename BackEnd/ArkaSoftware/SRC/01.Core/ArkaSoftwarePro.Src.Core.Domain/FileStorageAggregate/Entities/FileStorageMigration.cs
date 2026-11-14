using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.FileStorageAggregate.Entities;

public class FileStorageMigration : AggregateRoot
{
    public string SourcePath { get; private set; } = string.Empty;
    public string ObjectKey { get; private set; } = string.Empty;
    public string AccessTier { get; private set; } = "public";
    public string Status { get; private set; } = "Pending";
    public long Bytes { get; private set; }
    public string? Error { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private FileStorageMigration() { }

    public static FileStorageMigration Create(string sourcePath, string objectKey, string accessTier)
    {
        return new FileStorageMigration
        {
            SourcePath = sourcePath.Replace('\\', '/').Trim(),
            ObjectKey = objectKey.Replace('\\', '/').Trim().TrimStart('/'),
            AccessTier = accessTier,
            Status = "Pending",
            Bytes = 0,
            CreatedAtUtc = DateTime.UtcNow,
        };
    }

    public void MarkRunning()
    {
        Status = "Running";
        Error = null;
    }

    public void MarkCompleted(long bytes)
    {
        Status = "Completed";
        Bytes = Math.Max(0, bytes);
        Error = null;
        CompletedAtUtc = DateTime.UtcNow;
    }

    public void MarkFailed(string error)
    {
        Status = "Failed";
        Error = string.IsNullOrWhiteSpace(error) ? "Unknown error" : error.Trim();
        if (Error.Length > 2000)
            Error = Error[..2000];
    }
}
