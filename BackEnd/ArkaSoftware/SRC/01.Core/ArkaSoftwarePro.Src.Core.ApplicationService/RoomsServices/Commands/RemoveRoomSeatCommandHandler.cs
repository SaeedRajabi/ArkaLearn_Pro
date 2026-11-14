using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.RemoveRoomSeat;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class RemoveRoomSeatCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomCommandRepository roomRepository,
    IRoomSeatLivePresence roomSeatLivePresence,
    IRoomSeatAdminNotifier seatAdminNotifier)
    : CommandHandler<RemoveRoomSeatCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(RemoveRoomSeatCommand command)
    {
        var room = await roomRepository.GetWithRoomUsersAsync(command.RoomId);
        if (room == null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        if (roomSeatLivePresence.IsSeatLive(command.RoomId, command.RoomUserId))
            await seatAdminNotifier.NotifySeatRemovedByAdminAsync(command.RoomId, command.RoomUserId, "removed");

        room.RemoveRoomSeat(command.RoomUserId);
        await roomRepository.CommitAsync();
        return await OkAsync(true);
    }
}
