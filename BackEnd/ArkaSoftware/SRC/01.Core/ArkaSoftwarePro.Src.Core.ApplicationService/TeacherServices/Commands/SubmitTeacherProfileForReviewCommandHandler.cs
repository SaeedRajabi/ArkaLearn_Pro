using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SubmitTeacherProfileForReview;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SubmitTeacherProfileForReviewCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherProfileNotifier notifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SubmitTeacherProfileForReviewCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(SubmitTeacherProfileForReviewCommand command)
    {
        var userId = ResolveAuthenticatedUserId(command.UserId, httpContextAccessor);
        if (userId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId,
            userCommandRepository,
            teacherCommandRepository,
            studentCommandRepository);

        if (teacher is null)
        {
            var userName = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("name")?.Value;
            if (!string.IsNullOrWhiteSpace(userName))
            {
                teacher = await TeacherProfileProvisioner.EnsureTeacherRecordByUserNameAsync(
                    userName,
                    userCommandRepository,
                    teacherCommandRepository,
                    studentCommandRepository);
            }
        }

        if (teacher is null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId)
            ?? await teacherCommandRepository.GetByIdWithDetailsAsync(teacher.Id);
        if (teacher is null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        teacher.SubmitProfileForReview();
        await teacherCommandRepository.CommitAsync();

        var displayName = teacher.User?.UserFullName != null
            ? $"{teacher.User.UserFullName.FirstName} {teacher.User.UserFullName.LastName}".Trim()
            : "Teacher";
        await notifier.NotifyAdminsProfileSubmittedAsync(teacher.Id, displayName);

        return await ResultAsync("Profile submitted for review.", ApplicationServiceStatus.Ok);
    }

    private static long ResolveAuthenticatedUserId(long commandUserId, IHttpContextAccessor httpContextAccessor)
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier ||
            x.Type == "userId" ||
            x.Type == "nameid");

        if (claim != null && long.TryParse(claim.Value, out var authUserId) && authUserId > 0)
            return authUserId;

        return commandUserId;
    }
}
