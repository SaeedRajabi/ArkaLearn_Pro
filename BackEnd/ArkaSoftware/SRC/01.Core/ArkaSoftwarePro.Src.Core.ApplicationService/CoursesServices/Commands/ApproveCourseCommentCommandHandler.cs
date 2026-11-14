using ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ApproveCourseComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class ApproveCourseCommentCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ICourseCommandRepository courseCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    EngagementNotifier engagementNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ApproveCourseCommentCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(ApproveCourseCommentCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetCourseWithCommentsAsync(command.CourseId);
        if (course == null)
            return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

        if (!await CanManageCourseCommentsAsync(userId, course.TeacherId))
            return await ResultAsync("You are not allowed to manage comments for this course.", ApplicationServiceStatus.ValidationError);

        var targetComment = course.CourseComments.FirstOrDefault(c => c.Id == command.CommentId);
        if (targetComment == null)
            return await ResultAsync("Comment was not found.", ApplicationServiceStatus.NotFound);

        var wasApproved = targetComment.IsApproved;
        course.ApproveComment(command.CommentId, command.IsApproved);
        await courseCommandRepository.CommitAsync();

        if (command.IsApproved && !wasApproved && targetComment.UserId is > 0 && targetComment.ParentId is null)
        {
            var courseTitle = course.Title?.Value ?? "Course";
            await engagementNotifier.NotifyCourseReviewApprovedAsync(
                course.Id,
                targetComment.UserId.Value,
                courseTitle,
                command.CommentId);
        }

        return await OkAsync("Comment approval updated.");
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        userId = 0;
        var userIdClaim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier ||
            x.Type == "userId" ||
            x.Type == "nameid");

        return userIdClaim != null
            && !string.IsNullOrEmpty(userIdClaim.Value)
            && long.TryParse(userIdClaim.Value, out userId);
    }

    private async Task<bool> CanManageCourseCommentsAsync(long userId, long? courseTeacherId)
    {
        var roleClaim = httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (roleClaim is "3" or "Admin" or "Super Admin")
            return true;

        if (courseTeacherId is not > 0)
            return false;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        return teacherId.HasValue && teacherId.Value == courseTeacherId.Value;
    }
}
