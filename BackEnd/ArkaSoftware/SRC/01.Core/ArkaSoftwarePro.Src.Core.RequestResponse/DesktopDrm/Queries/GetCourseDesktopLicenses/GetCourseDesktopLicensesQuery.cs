using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopLicenses;

public class GetCourseDesktopLicensesQuery : IQuery<List<CourseDesktopLicenseEnrollmentQri>>
{
    public long RequestingUserId { get; set; }
    public long CourseId { get; set; }
}

public class CourseDesktopLicenseEnrollmentQri
{
    public long EnrollmentId { get; set; }
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public string? StudentName { get; set; }
    public string? DesktopLicenseKey { get; set; }
    public bool IsDesktopLicenseActive { get; set; }
    public DateTime? DesktopLicenseExpiresAtUtc { get; set; }
    public bool IsCurrentlyValid { get; set; }
    public int MaxDevices { get; set; }
    public DesktopOsFamily AllowedOs { get; set; }
    public DesktopContentAccessMode ContentAccessMode { get; set; }
    public long[] AllowedLessonIds { get; set; } = [];
    public int ActiveDeviceCount { get; set; }
}
