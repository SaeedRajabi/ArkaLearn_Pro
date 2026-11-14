using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetPortalStudentRoomProfile;

public class GetPortalStudentRoomProfileQuery : IQuery<GetPortalStudentRoomProfileQri>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long PortalUserId { get; set; }
    public string Path => "/api/Service/ManagedRoomStudent/GetPortalRoomProfile";
}

public class GetPortalStudentRoomProfileQri
{
    public long PortalUserId { get; set; }
    public long? ManagedRoomStudentId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? RoomUserName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
}
