namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;

public class ManagedRoomStudentQueryModel
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
    public bool IsDelete { get; set; }
}
