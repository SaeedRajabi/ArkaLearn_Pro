using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.IssueStaffRoomJoinTicket;

public class IssueStaffRoomJoinTicketCommand : ICommand<object>, IWebRequest
{
    public long RoomId { get; set; }
    public long RequestingUserId { get; set; }
    public bool RequestingIsDashboardAdmin { get; set; }
    public string Path => "/api/Service/Room/IssueStaffJoinTicket";
}
