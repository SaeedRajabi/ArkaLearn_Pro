namespace ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetManagedRoomStudentsPaged;

public class GetManagedRoomStudentsPagedQri
{
    public long Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Notes { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhotoUrl { get; set; }
}
