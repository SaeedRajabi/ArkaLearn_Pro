using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.HeartbeatDesktopPresence;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class HeartbeatDesktopPresenceCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository)
    : CommandHandler<HeartbeatDesktopPresenceCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(HeartbeatDesktopPresenceCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        await chatRepository.UpsertDesktopPresenceAsync(
            command.UserId,
            command.ConnectionId,
            command.AppVersion,
            command.DeviceId,
            command.IsOnline);

        await chatRepository.CommitAsync();
        return await OkAsync("ok");
    }
}
