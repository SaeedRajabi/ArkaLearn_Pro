namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Queries.SearchPortalStudents;

public class PortalStudentQri
{
    public long UserId { get; set; }
    public long StudentId { get; set; }
    /// <summary>Linked ManagedRoomStudent.Id when room credentials exist (for shared file manager).</summary>
    public long? ManagedRoomStudentId { get; set; }
    public string? FullName { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CourseEnrollmentCount { get; set; }
    public string RegisteredAt { get; set; } = string.Empty;
}
