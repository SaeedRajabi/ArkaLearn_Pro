using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands.UpsertPortalStudentRoomProfile;

public class UpsertPortalStudentRoomProfileCommand : ICommand<long>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long PortalUserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string RoomUserName { get; set; } = string.Empty;
    /// <summary>When null or empty on update, password is left unchanged.</summary>
    public string? Password { get; set; }
    public string Path => "/api/Service/ManagedRoomStudent/UpsertPortalRoomProfile";
}
