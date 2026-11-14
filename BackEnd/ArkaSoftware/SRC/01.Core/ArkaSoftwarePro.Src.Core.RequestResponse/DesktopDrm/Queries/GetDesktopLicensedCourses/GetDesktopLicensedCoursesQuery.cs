using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopLicensedCourses;

public class GetDesktopLicensedCoursesQuery : IQuery<List<DesktopLicensedCourseQri>>
{
    public long UserId { get; set; }
}

public class DesktopLicensedCourseQri
{
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string? DesktopLicenseKey { get; set; }
    public bool IsActive { get; set; }
    public long TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
}
