using System.Collections.Concurrent;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Uploads;

public sealed class UserFileUploadSessionStore
{
    internal SemaphoreSlim UsageGate { get; } = new(1, 1);
    internal ConcurrentDictionary<string, UserFileChunkUploadSession> Sessions { get; } = new(StringComparer.Ordinal);
}

internal sealed class UserFileChunkUploadSession
{
    public required string UploadId { get; init; }
    public required long UserId { get; init; }
    public long? ParentId { get; init; }
    public required string OriginalFileName { get; init; }
    public required long FileSize { get; init; }
    public required int ChunkSize { get; init; }
    public required int TotalChunks { get; init; }
    public SemaphoreSlim Gate { get; } = new(1, 1);
    public bool Completed { get; set; }
    public bool Aborted { get; set; }
    public DateTime LastTouchedUtc { get; private set; } = DateTime.UtcNow;
    public ConcurrentDictionary<int, byte> ReceivedChunks { get; } = new();

    public bool IsExpired(DateTime utcNow) => utcNow - LastTouchedUtc > TimeSpan.FromHours(6);
    public void Touch() => LastTouchedUtc = DateTime.UtcNow;
}
