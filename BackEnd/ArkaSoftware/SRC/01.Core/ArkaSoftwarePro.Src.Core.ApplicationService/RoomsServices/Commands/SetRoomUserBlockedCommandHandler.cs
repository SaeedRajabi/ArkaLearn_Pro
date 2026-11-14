using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.SetRoomUserBlocked;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class SetRoomUserBlockedCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomCommandRepository roomRepository,
    IRoomSeatLivePresence roomSeatLivePresence,
    IRoomSeatAdminNotifier seatAdminNotifier)
    : CommandHandler<SetRoomUserBlockedCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SetRoomUserBlockedCommand command)
    {
        var room = await roomRepository.GetWithRoomUsersAsync(command.RoomId);
        if (room == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        room.SetRoomSeatBlocked(command.RoomUserId, command.Blocked);
        await roomRepository.CommitAsync();

        if (command.Blocked && roomSeatLivePresence.IsSeatLive(command.RoomId, command.RoomUserId))
            await seatAdminNotifier.NotifySeatRemovedByAdminAsync(command.RoomId, command.RoomUserId, "blocked");

        return await OkAsync(command.Blocked ? "Blocked" : "Unblocked");
    }
}
