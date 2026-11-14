using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;

public class DeleteManagedRoomStudentCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }

    public string Path => "/api/Service/ManagedRoomStudent/Delete";
}
