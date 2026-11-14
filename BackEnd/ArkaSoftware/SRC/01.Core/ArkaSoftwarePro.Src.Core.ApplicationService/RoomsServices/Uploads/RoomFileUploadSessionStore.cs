using System.Collections.Concurrent;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Uploads;

public sealed class RoomFileUploadSessionStore
{
    internal ConcurrentDictionary<string, ChunkUploadSession> Sessions { get; } = new(StringComparer.Ordinal);
}

internal sealed class ChunkUploadSession
{
    public required string UploadId { get; init; }
    public required long RoomId { get; init; }
    public required RoomFileType FileType { get; init; }
    public required string OriginalFileName { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public required long FileSize { get; init; }
    public required int ChunkSize { get; init; }
    public required int TotalChunks { get; init; }
    public SemaphoreSlim Gate { get; } = new(1, 1);
    public bool Completed { get; set; }
    public bool Aborted { get; set; }
    public string? UploadedByUserId { get; init; }
    public DateTime LastTouchedUtc { get; private set; } = DateTime.UtcNow;
    public ConcurrentDictionary<int, byte> ReceivedChunks { get; } = new();

    public bool IsExpired(DateTime utcNow) => utcNow - LastTouchedUtc > TimeSpan.FromHours(6);
    public void Touch() => LastTouchedUtc = DateTime.UtcNow;
}
