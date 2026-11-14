using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;

public class AddManagedRoomStudentCommand : ICommand<long>, IWebRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhotoUrl { get; set; }

    public string Path => "/api/Service/ManagedRoomStudent/Create";
}
