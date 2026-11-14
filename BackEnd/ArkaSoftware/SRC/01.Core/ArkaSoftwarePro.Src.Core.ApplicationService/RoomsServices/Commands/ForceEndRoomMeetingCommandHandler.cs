using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.ForceEndRoomMeeting;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class ForceEndRoomMeetingCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomCommandRepository roomRepository,
    IMeetingLifecycleService meetingLifecycle)
    : CommandHandler<ForceEndRoomMeetingCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(ForceEndRoomMeetingCommand command)
    {
        var room = await roomRepository.GetWithRoomUsersAsync(command.RoomId);
        if (room == null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        await meetingLifecycle.EndRoomMeetingAsync(command.RoomId, "admin_force_end");
        return await OkAsync(true);
    }
}
