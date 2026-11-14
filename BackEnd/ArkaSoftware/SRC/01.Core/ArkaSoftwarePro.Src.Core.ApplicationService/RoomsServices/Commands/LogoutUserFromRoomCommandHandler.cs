using ArkaSoftwarePro.Src.Core.Contracts.Messages.IHubs;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LogoutUserFromRoom;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;
using Framework.Src.Core.RequestResponse.Common;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands
{
    public class LogoutUserFromRoomCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IHttpContextAccessor contextAccessor,
        IRoomCommandRepository roomCommandRepository,
        IChatMessageHub chatMessageHub,
        IRoomAccessService roomAccess
        ) : CommandHandler<LogoutUserFromRoomCommand , object>(mafiaOuterServices)
    {
        public override async Task<CommandResult<object>> Handle(LogoutUserFromRoomCommand command)
        {
            var principal = contextAccessor.HttpContext?.User;
            var ownSeat = principal?.FindFirst("identityScope")?.Value == "room-seat" &&
                principal.FindFirst("roomSeatId")?.Value == command.UserId.ToString(System.Globalization.CultureInfo.InvariantCulture);
            if (!await roomAccess.CanAccessAsync(command.RoomId, principal, requireManagement: !ownSeat))
                return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
            var roomQueryResult = await roomCommandRepository.GetGraphAsync(command.RoomId);
            if (roomQueryResult == null!) return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            var x = roomQueryResult.RoomUsers.FirstOrDefault(x => x.Id == command.UserId);
            if (x == null!) return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            _mafiaOuterService.CurrentUserContext.SetUserId(command.UserId.ToString());
            roomQueryResult.UpdateRoomUserStatus(command.UserId, false);
            await roomCommandRepository.CommitAsync();
            if (contextAccessor.HttpContext.Request.Cookies["authToken"] != null)
            {
                contextAccessor.HttpContext.Response.Cookies.Delete("authToken", new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None
                });
            }
            await contextAccessor.HttpContext.SignOutAsync();
            await chatMessageHub.NotifyUserLeft(command.RoomId, command.UserId, $"{x!.UserName}");
            return await OkAsync(new { message = "Logout successful" });
        }
    }
}
