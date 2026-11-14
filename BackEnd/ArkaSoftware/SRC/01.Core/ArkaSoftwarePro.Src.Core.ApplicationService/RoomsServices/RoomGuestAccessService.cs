using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Uploads;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RoomsServices;

public sealed class RoomGuestAccessService(IRoomCommandRepository rooms, IRoomJoinTicketService tickets)
{
    public async Task<FileOperationResult> IssueGuestJoinTicket(IssueGuestJoinTicketRequest request)
    {
        if (request.RoomId <= 0)
            return FileOperationResult.Invalid(new { message = "Invalid room id." });

        var displayName = (request.DisplayName ?? string.Empty).Trim();
        if (displayName.Length < 2)
            return FileOperationResult.Invalid(new { message = "Guest display name is required." });

        var room = await rooms.GetWithRoomUsersAsync(request.RoomId);
        if (room == null)
            return FileOperationResult.Missing(new { message = "Room was not found." });

        if (!room.IsGuest || room.GuestQuantity <= 0)
            return FileOperationResult.Invalid(new { message = "Guest entry is disabled for this room." });

        var guestId = Guid.NewGuid().ToString("N");
        var joinTicket = tickets.CreateGuestTicket(request.RoomId, guestId);
        return FileOperationResult.Success(new
        {
            joinTicket,
            meetingRole = "guest",
            guestId,
            displayName
        });
    }
}
