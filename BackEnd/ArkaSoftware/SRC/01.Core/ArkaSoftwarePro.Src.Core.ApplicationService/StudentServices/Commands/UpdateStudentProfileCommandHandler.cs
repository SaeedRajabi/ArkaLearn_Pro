using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Commands.UpdateStudentProfile;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices.Commands;

public class UpdateStudentProfileCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IStudentCommandRepository studentCommandRepository,
    IUserCommandRepository userCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpdateStudentProfileCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(UpdateStudentProfileCommand command)
    {
        var userId = ResolveAuthenticatedUserId(command.UserId, httpContextAccessor);
        if (userId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var student = await StudentProfileProvisioner.EnsureStudentRecordAsync(
            userId,
            userCommandRepository,
            studentCommandRepository);

        if (student is null)
        {
            var userName = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("name")?.Value;
            if (!string.IsNullOrWhiteSpace(userName))
            {
                student = await StudentProfileProvisioner.EnsureStudentRecordByUserNameAsync(
                    userName,
                    userCommandRepository,
                    studentCommandRepository);
            }
        }

        if (student is null)
            student = await StudentProfileProvisioner.FindExistingStudentAsync(
                command.UserId,
                studentCommandRepository);

        if (student is null)
            return await ResultAsync("Student not found.", ApplicationServiceStatus.NotFound);

        student.UpdateHeaderImageUrl(command.HeaderImageUrl);
        await studentCommandRepository.CommitAsync();
        return await ResultAsync("Student profile updated.", ApplicationServiceStatus.Ok);
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
