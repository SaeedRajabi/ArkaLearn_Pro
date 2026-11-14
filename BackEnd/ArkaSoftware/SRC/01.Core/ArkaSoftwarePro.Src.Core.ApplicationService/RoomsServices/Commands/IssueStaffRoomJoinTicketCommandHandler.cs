using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.IssueStaffRoomJoinTicket;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices.Commands;

public class IssueStaffRoomJoinTicketCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IRoomCommandRepository roomRepository,
    IRoomJoinTicketService joinTicketService)
    : CommandHandler<IssueStaffRoomJoinTicketCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(IssueStaffRoomJoinTicketCommand command)
    {
        var room = await roomRepository.GetWithRoomUsersAsync(command.RoomId);
        if (room == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var isOwner = room.UserId == command.RequestingUserId;
        if (!isOwner && !command.RequestingIsDashboardAdmin)
            return await ResultAsync(
                "Only the room owner or a dashboard admin can issue a staff meeting ticket.",
                ApplicationServiceStatus.ValidationError);

        var role = isOwner ? RoomMeetingRole.Teacher : RoomMeetingRole.Moderator;
        var ticket = joinTicketService.CreateStaffTicket(command.RoomId, command.RequestingUserId, role);

        return await OkAsync(new
        {
            joinTicket = ticket,
            meetingRole = role.ToString().ToLowerInvariant(),
            roomId = command.RoomId,
        });
    }
}
