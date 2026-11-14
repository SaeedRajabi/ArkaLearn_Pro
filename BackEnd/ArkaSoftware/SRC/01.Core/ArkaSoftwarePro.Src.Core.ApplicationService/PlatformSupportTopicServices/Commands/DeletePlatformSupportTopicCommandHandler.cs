using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Commands.DeletePlatformSupportTopic;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.PlatformSupportTopicServices.Commands;

public class DeletePlatformSupportTopicCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPlatformSupportTopicCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeletePlatformSupportTopicCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeletePlatformSupportTopicCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        if (command.Id <= 0)
            return await ResultAsync("Topic id is required.", ApplicationServiceStatus.ValidationError);

        var topic = await repository.GetByIdAsync(command.Id);
        if (topic == null || topic.IsDelete)
            return await ResultAsync("Topic not found.", ApplicationServiceStatus.NotFound);

        topic.SoftDelete();
        await repository.CommitAsync();
        return await OkAsync("Topic deleted.");
    }
}
