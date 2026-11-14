using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.DeleteRoom;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class DeleteRoomCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEntityPermanentDeletionService permanentDeletionService)
    : CommandHandler<DeleteRoomCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteRoomCommand command)
    {
        var deleted = await permanentDeletionService.PermanentlyDeleteRoomAsync(command.RoomId);
        if (!deleted)
            return await ResultAsync("Room not found.", ApplicationServiceStatus.NotFound);

        return await OkAsync("Room permanently deleted.");
    }
}
