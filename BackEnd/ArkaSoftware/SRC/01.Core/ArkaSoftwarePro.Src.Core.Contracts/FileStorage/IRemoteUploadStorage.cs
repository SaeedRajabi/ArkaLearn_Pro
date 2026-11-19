namespace ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

public sealed record DownloadStorageUsage(long CapacityBytes, long UsedBytes, DateTime MeasuredAtUtc)
{
    public long RemainingBytes => Math.Max(0, CapacityBytes - UsedBytes);
}

/// <summary>Upload data stays on the download host, including temporary parts.</summary>
public interface IRemoteUploadStorage : IFileStorage
{
    Task InitializeUploadAsync(string scope, string uploadId, CancellationToken cancellationToken = default);
    Task PutChunkAsync(string scope, string uploadId, int index, Stream content, long expectedSize, int chunkSize, long fileSize,
        CancellationToken cancellationToken = default);
    Task<int[]> GetMissingChunksAsync(string scope, string uploadId, int count, int chunkSize, long fileSize,
        CancellationToken cancellationToken = default);
    Task AssembleUploadAsync(string scope, string uploadId, string objectKey, int count, int chunkSize,
        long fileSize, CancellationToken cancellationToken = default);
    Task DeleteUploadAsync(string scope, string uploadId, CancellationToken cancellationToken = default);
    Task CleanupExpiredUploadsAsync(TimeSpan maxAge, CancellationToken cancellationToken = default);
    Task<DownloadStorageUsage> GetUsageAsync(CancellationToken cancellationToken = default);
}
