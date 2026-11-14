using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ReportLessonWatchProgress;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class ReportLessonWatchProgressCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    ICourseQueriesRepository courseQueriesRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ReportLessonWatchProgressCommand, LessonWatchProgressQri>(outer)
{
    public override async Task<CommandResult<LessonWatchProgressQri>> Handle(ReportLessonWatchProgressCommand command)
    {
        var userId = ResolveUserId();
        if (userId <= 0 || command.LessonId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var lesson = await courseQueriesRepository.GetLessonVideoAccessAsync(command.LessonId);
        if (lesson == null || lesson.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await courseQueriesRepository.HasActiveEnrollmentAsync(userId, lesson.CourseId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        await courseCommandRepository.UpsertLessonWatchProgressAsync(
            userId,
            lesson.CourseId,
            command.LessonId,
            command.WatchedSeconds,
            command.DurationSeconds);

        await courseCommandRepository.CommitAsync();

        var duration = command.DurationSeconds;
        var watched = Math.Max(0, command.WatchedSeconds);
        var percent = duration > 0 ? Math.Min(100, (int)Math.Round(watched * 100.0 / duration)) : (watched > 0 ? 100 : 0);
        var completed = duration > 0 ? watched >= duration * 0.9 : false;

        return await ResultAsync(new LessonWatchProgressQri
        {
            LessonId = command.LessonId,
            WatchedSeconds = watched,
            DurationSeconds = duration,
            WatchedPercent = percent,
            IsCompleted = completed,
        }, ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
