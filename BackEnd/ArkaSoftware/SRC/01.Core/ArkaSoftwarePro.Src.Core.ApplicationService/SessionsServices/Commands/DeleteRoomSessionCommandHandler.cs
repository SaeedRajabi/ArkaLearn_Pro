using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Sessions.SessionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SessionsServices.Commands;

public class DeleteRoomSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomSessionCommandRepository repository,
    IMeetingLifecycleService meetingLifecycle)
    : CommandHandler<DeleteRoomSessionCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(DeleteRoomSessionCommand command)
    {
        var session = await repository.GetSessionByIdAsync(command.SessionId, command.RoomId);
        if (session == null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        if (session.Status == "Active")
            await meetingLifecycle.EndRoomMeetingAsync(command.RoomId, "admin_delete_active_session");

        await repository.DeleteSessionAsync(session);
        await repository.CommitAsync();
        return await OkAsync(true);
    }
}
