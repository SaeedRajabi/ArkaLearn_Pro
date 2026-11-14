using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.VideoWatermark;

public sealed class VideoWatermarkBackgroundService(
    IServiceScopeFactory scopeFactory,
    IVideoWatermarkQueue queue,
    ILogger<VideoWatermarkBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var job = await queue.DequeueAsync(stoppingToken);
                if (job == null)
                    continue;

                await ProcessJobAsync(job, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Video watermark worker failed.");
            }
        }
    }

    private async Task ProcessJobAsync(VideoWatermarkJob job, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var processor = scope.ServiceProvider.GetRequiredService<IVideoWatermarkProcessor>();
        var watermarkedPath = await processor.CreateWatermarkedCopyAsync(job.SourceRelativePath, cancellationToken);
        if (string.IsNullOrWhiteSpace(watermarkedPath))
            return;

        switch (job.Kind)
        {
            case VideoWatermarkKind.PromotionalVideo:
            {
                var teacherRepository = scope.ServiceProvider.GetRequiredService<ITeacherCommandRepository>();
                var teacher = await teacherRepository.GetByPromotionalVideoIdAsync(job.EntityId);
                var video = teacher?.PromotionalVideos.FirstOrDefault(v => v.Id == job.EntityId);
                if (video == null || video.ApprovalStatus != TeacherApprovalStatus.Approved)
                    return;
                video.SetWatermarkedVideoUrl(watermarkedPath);
                await teacherRepository.CommitAsync();
                break;
            }
            case VideoWatermarkKind.LessonVideo:
            {
                if (!job.CourseId.HasValue || job.CourseId.Value <= 0)
                    return;
                var courseRepository = scope.ServiceProvider.GetRequiredService<ICourseCommandRepository>();
                var course = await courseRepository.GetCourseForEditAsync(job.CourseId.Value);
                var lesson = course?.FindLesson(job.EntityId);
                if (lesson == null || lesson.VideoModerationStatus != TeacherApprovalStatus.Approved)
                    return;
                lesson.SetWatermarkedVideoPath(watermarkedPath);
                await courseRepository.CommitAsync();
                break;
            }
        }
    }
}
