namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms;

public interface IRoomJoinTicketService
{
    string CreateStudentTicket(long roomId, long seatUserId);
    string CreateGuestTicket(long roomId, string guestKey);
    string CreateStaffTicket(long roomId, long staffUserId, RoomMeetingRole role);
    RoomJoinTicketClaims? Validate(string? ticket, long expectedRoomId);
}
