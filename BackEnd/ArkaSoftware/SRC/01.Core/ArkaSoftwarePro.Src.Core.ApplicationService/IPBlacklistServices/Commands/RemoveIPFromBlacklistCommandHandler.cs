using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Commands.RemoveIPFromBlacklist;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.IPBlacklistServices.Commands;

public class RemoveIPFromBlacklistCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IIPBlacklistCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RemoveIPFromBlacklistCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RemoveIPFromBlacklistCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var entry = await repository.GetAsync(command.Id);
        if (entry is null || entry.IsDelete)
        {
            AddMessage("IP blacklist entry not found.");
            return await ResultAsync("IP blacklist entry not found.", ApplicationServiceStatus.NotFound);
        }

        entry.RemoveFromBlacklist();
        await repository.CommitAsync();
        return await OkAsync("IP removed from blacklist.");
    }
}
