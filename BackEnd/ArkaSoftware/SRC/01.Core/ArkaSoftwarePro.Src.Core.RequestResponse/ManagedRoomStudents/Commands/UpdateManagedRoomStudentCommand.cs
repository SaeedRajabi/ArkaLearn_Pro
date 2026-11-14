using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Commands;

public class UpdateManagedRoomStudentCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    /// <summary>When null or empty, password is left unchanged.</summary>
    public string? Password { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    /// <summary>When null, photo unchanged. Empty string clears photo.</summary>
    public string? PhotoUrl { get; set; }

    public string Path => "/api/Service/ManagedRoomStudent/Update";
}
