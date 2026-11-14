using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.SetUserStatus;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class SetUserStatusCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserCommandRepository userRepository)
    : CommandHandler<SetUserStatusCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SetUserStatusCommand command)
    {
        var user = await userRepository.GetGraphAsync(command.UserId);
        if (user == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        user.SetBlocked(command.Blocked);
        if (command.Blocked)
            user.Logout();

        await userRepository.CommitAsync();
        return await OkAsync(command.Blocked ? "Blocked" : "Active");
    }
}
