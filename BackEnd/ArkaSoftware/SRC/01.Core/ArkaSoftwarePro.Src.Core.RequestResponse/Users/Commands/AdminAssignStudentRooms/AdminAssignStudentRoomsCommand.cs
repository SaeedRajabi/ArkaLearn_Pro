using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminAssignStudentRooms;

public class AdminAssignStudentRoomsCommand : ICommand<AdminAssignStudentRoomsResult>, IWebRequest
{
    public long PortalUserId { get; set; }
    public List<long> RoomIds { get; set; } = [];
    public string Path => "/api/Service/AdminUserManagement/AssignStudentRooms";
}

public class AdminAssignStudentRoomsResult
{
    public int AssignedRoomCount { get; set; }
}
