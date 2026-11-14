namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Uploads;

public sealed record UploadFileInitRequest
{
    public long RoomId { get; init; }
    public int FileType { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string? Title { get; init; }
    public string? Description { get; init; }
    public long FileSize { get; init; }
    public int? ChunkSize { get; init; }
    public int? TotalChunks { get; init; }
}

public sealed record UploadFileChunkRequest<TContent>
{
    public string UploadId { get; init; } = string.Empty;
    public int ChunkIndex { get; init; }
    public TContent? Chunk { get; init; }
}

public sealed record UploadFileCompleteRequest
{
    public string UploadId { get; init; } = string.Empty;
}

public sealed record UploadFileAbortRequest
{
    public string UploadId { get; init; } = string.Empty;
}

public sealed record IssueGuestJoinTicketRequest
{
    public long RoomId { get; init; }
    public string DisplayName { get; init; } = string.Empty;
}

public sealed record RoomFileUpload<TContent>
{
    public long RoomId { get; init; }
    public int FileType { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public TContent? File { get; init; }
}
