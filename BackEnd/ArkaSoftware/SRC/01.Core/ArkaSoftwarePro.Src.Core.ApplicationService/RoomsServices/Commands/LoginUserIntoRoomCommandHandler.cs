using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LoginUserIntoRoom;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class LoginUserIntoRoomCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IRoomCommandRepository roomCommandRepository,
    ISeminarCommandRepository seminarCommandRepository,
    IRoomSeatLivePresence roomSeatLivePresence,
    IRoomJoinTicketService joinTicketService,
    IJwtGenerator jwtGenerate)
    : CommandHandler<LoginUserIntoRoomCommand, object>(mafiaOuterServices)
{
    public override async Task<CommandResult<object>> Handle(LoginUserIntoRoomCommand command)
    {
        var roomExist = await roomCommandRepository.GetWithRoomUsersAsync(command.RoomId);
        if (roomExist! == null!)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var loginKey = (command.UserName ?? string.Empty).Trim();

        var assignedSeat = roomExist.FindRoomUserForLogin(loginKey);

        if (assignedSeat! != null!)
        {
            var seatLive = roomSeatLivePresence.IsSeatLive(command.RoomId, assignedSeat.Id);
            if (!seatLive && assignedSeat.IsRoomUserOnline())
                roomExist.UpdateRoomUserStatus(assignedSeat.Id, false);

        }

        if (assignedSeat! == null!)
        {
            var seminarGate = await seminarCommandRepository.GetRoomAccessGateAsync(command.RoomId, loginKey);
            if (seminarGate.HasLinkedSeminar)
            {
                if (!seminarGate.HasRegisteredSeminar)
                    return await ResultAsync(
                        "Room login: you must register for this seminar before entering the online room.",
                        ApplicationServiceStatus.NotFound);

                if (!seminarGate.IsFree && !seminarGate.HasPaid)
                    return await ResultAsync(
                        "Room login: payment is required before entering this seminar room.",
                        ApplicationServiceStatus.NotFound);

                if (seminarGate.EndTime.HasValue && IsSeminarExpired(seminarGate.EndTime.Value))
                    return await ResultAsync(
                        "Room login: this seminar and its online room have expired.",
                        ApplicationServiceStatus.NotFound);
            }
        }

        try
        {
            roomExist.LoginIntoRoom(loginKey, command.Password ?? string.Empty);
        }
        catch (InvalidEntityStateException ex)
        {
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        var user = roomExist.FindRoomUserForLogin(loginKey)!;
        _mafiaOuterService.CurrentUserContext.SetUserId(user.Id.ToString());

        // Live "online" is set when the student joins the main SignalR group (or is admitted from the waiting lobby).
        await roomCommandRepository.CommitAsync();

        var token = jwtGenerate.GenerateJwtToken(user);
        var joinTicket = joinTicketService.CreateStudentTicket(command.RoomId, user.Id);

        return await OkAsync(new
        {
            userData = new
            {
                token,
                joinTicket,
                meetingRole = "student",
                userId = user.Id.ToString(),
                Role = "student",
                userName = user.UserName!.Value,
                displayName = $"{user.Name?.FirstName} {user.Name?.LastName}".Trim(),
                avatarUrl = string.IsNullOrWhiteSpace(user.PhotoUrl) ? (string?)null : user.PhotoUrl,
            }
        });
    }

    private static bool IsSeminarExpired(DateTime endTime)
    {
        var now = endTime.Kind == DateTimeKind.Utc ? DateTime.UtcNow : DateTime.Now;
        return now > endTime;
    }
}
