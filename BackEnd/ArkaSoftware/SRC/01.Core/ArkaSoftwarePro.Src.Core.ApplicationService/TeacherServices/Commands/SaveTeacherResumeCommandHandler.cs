using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherResume;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SaveTeacherResumeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SaveTeacherResumeCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SaveTeacherResumeCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var blockedReason = TeacherAccountGuard.GetContentManagementBlockReason(teacher);
        if (blockedReason != null)
        {
            result.AddMessage(blockedReason);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (string.IsNullOrWhiteSpace(command.Title))
        {
            result.AddMessage("Title is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (string.IsNullOrWhiteSpace(command.PdfFileUrl))
        {
            result.AddMessage("Resume PDF is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        teacher.UpsertResume(
            command.Title,
            command.Description ?? string.Empty,
            command.PdfFileUrl,
            command.PdfFileName);

        await teacherCommandRepository.CommitAsync();
        return await OkAsync("Resume submitted for review.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
