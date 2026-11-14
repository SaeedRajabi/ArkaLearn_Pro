using ArkaSoftwarePro.Src.Core.Contracts.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaServices;

public static class VideoWatermarkEnqueueExtensions
{
    public static void EnqueuePromotionalVideoWatermark(
        this IVideoWatermarkQueue queue,
        long videoId,
        string? sourceRelativePath)
    {
        if (videoId <= 0 || string.IsNullOrWhiteSpace(sourceRelativePath))
            return;

        queue.Enqueue(new VideoWatermarkJob
        {
            Kind = VideoWatermarkKind.PromotionalVideo,
            EntityId = videoId,
            SourceRelativePath = sourceRelativePath,
        });
    }

    public static void EnqueueLessonVideoWatermark(
        this IVideoWatermarkQueue queue,
        long courseId,
        long lessonId,
        string? sourceRelativePath)
    {
        if (courseId <= 0 || lessonId <= 0 || string.IsNullOrWhiteSpace(sourceRelativePath))
            return;

        queue.Enqueue(new VideoWatermarkJob
        {
            Kind = VideoWatermarkKind.LessonVideo,
            EntityId = lessonId,
            CourseId = courseId,
            SourceRelativePath = sourceRelativePath,
        });
    }
}
