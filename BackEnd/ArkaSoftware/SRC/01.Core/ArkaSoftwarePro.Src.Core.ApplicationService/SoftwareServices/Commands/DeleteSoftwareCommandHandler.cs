using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.DeleteSoftware;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Commands;

public class DeleteSoftwareCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeleteSoftwareCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteSoftwareCommand command)
    {
        if (command.SoftwareId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var item = await softwareRepository.GetWithTeacherAsync(command.SoftwareId);
        if (item == null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (item.IsPlatformOwned)
        {
            if (!TryGetUserId(out _))
                return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }
        else
        {
            if (!TryGetUserId(out var userId))
                return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
            var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userId);
            if (teacher == null || item.TeacherId != teacher.Id)
                return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        softwareRepository.Delete(command.SoftwareId);
        await softwareRepository.CommitAsync();
        return await OkAsync("deleted");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
