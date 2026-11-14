using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.ForceEndRoomMeeting;

public class ForceEndRoomMeetingCommand : ICommand<bool>, IWebRequest
{
    public long RoomId { get; set; }
    public long RequestingUserId { get; set; }
    public string Path => "/api/Service/Room/ForceEndActiveMeeting";
}
