using ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SessionsServices.Commands;

public class SetRoomSessionIgnoredCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomSessionCommandRepository repository)
    : CommandHandler<SetRoomSessionIgnoredCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(SetRoomSessionIgnoredCommand command)
    {
        var session = await repository.GetSessionByIdAsync(command.SessionId, command.RoomId);
        if (session == null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        session.SetIgnored(command.Ignored);
        await repository.CommitAsync();
        return await OkAsync(true);
    }
}
