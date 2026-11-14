using ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateUserStatus;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class UpdateUserStatusCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IRoomCommandRepository roomCommandRepository,
        IChatMessageHub chatMessageHub,
        IRoomSeatLivePresence roomSeatLivePresence,
        IRoomSeatAdminNotifier seatAdminNotifier,
        IHttpContextAccessor contextAccessor,
        IRoomAccessService roomAccess)
        : CommandHandler<UpdateUserStatusCommand, bool>(mafiaOuterServices)
    {
        public override async Task<CommandResult<bool>> Handle(UpdateUserStatusCommand command)
        {
            try
            {
                var principal = contextAccessor.HttpContext?.User;
                var ownSeat = principal?.FindFirst("identityScope")?.Value == "room-seat" &&
                    principal.FindFirst("roomSeatId")?.Value == command.UserId.ToString(System.Globalization.CultureInfo.InvariantCulture);
                if (!await roomAccess.CanAccessAsync(command.RoomId, principal, requireManagement: !ownSeat))
                    return await ResultAsync(false, ApplicationServiceStatus.ValidationError);
                var roomExist = await roomCommandRepository.GetGraphAsync(command.RoomId);
                if (roomExist == null!)
                    return await ResultAsync(false, ApplicationServiceStatus.NotFound);
                var roomUser = roomExist.RoomUsers.FirstOrDefault(x => x.Id == command.UserId);
                if (roomUser! == null!)
                    return await ResultAsync(false, ApplicationServiceStatus.NotFound);

                if (command.IsOnline)
                    return await ResultAsync(false, ApplicationServiceStatus.InvalidDomainState);

                var wasLive = roomSeatLivePresence.IsSeatLive(command.RoomId, command.UserId);
                roomUser.UpdateUserStatus(false);
                await roomCommandRepository.CommitAsync();

                if (wasLive)
                    await seatAdminNotifier.NotifySeatRemovedByAdminAsync(command.RoomId, command.UserId, "offline");

                await chatMessageHub.NotifyUserLeft(
                    command.RoomId,
                    roomUser.Id,
                    $"{roomUser.Name!.FirstName} {roomUser.Name.LastName}");

                return await ResultAsync(true, ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(false, ApplicationServiceStatus.Exception);
            }
        }
    }
}
