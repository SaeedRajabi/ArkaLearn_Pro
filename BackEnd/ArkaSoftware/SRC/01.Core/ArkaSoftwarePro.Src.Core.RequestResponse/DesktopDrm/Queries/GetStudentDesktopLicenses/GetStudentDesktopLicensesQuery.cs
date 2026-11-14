using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetStudentDesktopLicenses;

public class GetStudentDesktopLicensesQuery : IQuery<List<StudentDesktopLicenseQri>>
{
    public long RequestingUserId { get; set; }
    public long TargetUserId { get; set; }
    public long StudentId { get; set; }
}

public class StudentDesktopLicenseQri
{
    public long EnrollmentId { get; set; }
    public long UserId { get; set; }
    public long StudentId { get; set; }
    public string? StudentName { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public long? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public string? DesktopLicenseKey { get; set; }
    public bool IsEnrollmentActive { get; set; }
    public bool IsDesktopLicenseActive { get; set; }
    public DateTime? DesktopLicenseExpiresAtUtc { get; set; }
    public bool IsCurrentlyValid { get; set; }
    public string EnrollmentDateTime { get; set; } = string.Empty;
    public int MaxDevices { get; set; } = 1;
    public byte AllowedOs { get; set; } = 1;
    public byte ContentAccessMode { get; set; }
    public List<long> AllowedLessonIds { get; set; } = [];
    public int ActiveDeviceCount { get; set; }
}
