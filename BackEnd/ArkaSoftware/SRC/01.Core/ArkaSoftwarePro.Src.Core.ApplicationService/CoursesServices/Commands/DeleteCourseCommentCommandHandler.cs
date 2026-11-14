using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourseComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class DeleteCourseCommentCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ICourseCommandRepository courseCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeleteCourseCommentCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(DeleteCourseCommentCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(command.CourseId);
        if (course == null)
            return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defined.", ApplicationServiceStatus.NotFound);

        if (!await CanManageCourseCommentsAsync(userId, course.TeacherId))
            return await ResultAsync("You are not allowed to manage comments for this course.", ApplicationServiceStatus.ValidationError);

        var deleted = await courseCommandRepository.DeleteCommentAsync(command.CourseId, command.CommentId);
        if (!deleted)
            return await ResultAsync("Comment was not found.", ApplicationServiceStatus.NotFound);

        await courseCommandRepository.CommitAsync();
        return await OkAsync("Comment deleted successfully.");
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
