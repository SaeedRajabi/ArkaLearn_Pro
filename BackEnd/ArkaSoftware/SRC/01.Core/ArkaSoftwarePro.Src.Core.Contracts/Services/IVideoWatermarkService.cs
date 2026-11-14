namespace ArkaSoftwarePro.Src.Core.Contracts.Services;

public enum VideoWatermarkKind
{
    PromotionalVideo = 1,
    LessonVideo = 2,
}

public sealed class VideoWatermarkJob
{
    public VideoWatermarkKind Kind { get; init; }
    public long EntityId { get; init; }
    public long? CourseId { get; init; }
    public string SourceRelativePath { get; init; } = string.Empty;
}

public interface IVideoWatermarkQueue
{
    void Enqueue(VideoWatermarkJob job);
    ValueTask<VideoWatermarkJob?> DequeueAsync(CancellationToken cancellationToken);
}

public interface IVideoWatermarkProcessor
{
    Task<string?> CreateWatermarkedCopyAsync(string sourceRelativePath, CancellationToken cancellationToken = default);
}
