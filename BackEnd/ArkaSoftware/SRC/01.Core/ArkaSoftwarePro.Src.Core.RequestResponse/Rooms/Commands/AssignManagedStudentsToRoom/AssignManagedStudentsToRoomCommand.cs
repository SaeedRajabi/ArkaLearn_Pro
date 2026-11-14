using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AssignManagedStudentsToRoom;

public class AssignManagedStudentsToRoomCommand : ICommand<string>, IWebRequest
{
    public long RoomId { get; set; }
    public List<long> ManagedStudentIds { get; set; } = new();

    public string Path => "/api/Service/Room/AssignManagedStudents";
}
