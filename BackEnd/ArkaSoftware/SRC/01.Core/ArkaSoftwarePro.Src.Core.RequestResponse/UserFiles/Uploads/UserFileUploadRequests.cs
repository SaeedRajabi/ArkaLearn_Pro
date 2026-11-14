namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Uploads;

public sealed record NotifyDownloadCompletedRequest
{
    public long FileId { get; init; }
}

public sealed record UploadFileInitRequest
{
    public long UserId { get; init; }
    public long? ParentId { get; init; }
    public string FileName { get; init; } = string.Empty;
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
