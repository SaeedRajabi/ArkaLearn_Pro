using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ManageStudentDesktopLicense;

public class CreateStudentDesktopLicenseCommand : ICommand<StudentDesktopLicenseResultQri>
{
    public long RequestingUserId { get; set; }
    public long TargetUserId { get; set; }
    public long CourseId { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    /// <summary>
    /// When false, creating a second license for the same student+course is rejected.
    /// When true, the existing key is replaced (old key becomes invalid).
    /// </summary>
    public bool ReplaceExisting { get; set; }
}

public class RevokeStudentDesktopLicenseCommand : ICommand<StudentDesktopLicenseResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
}

public class RenewStudentDesktopLicenseCommand : ICommand<StudentDesktopLicenseResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}

public class RegenerateStudentDesktopLicenseCommand : ICommand<StudentDesktopLicenseResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}

public class DeleteStudentDesktopLicenseCommand : ICommand<StudentDesktopLicenseResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
}

public class StudentDesktopLicenseResultQri
{
    public long EnrollmentId { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string? DesktopLicenseKey { get; set; }
    public bool IsDesktopLicenseActive { get; set; }
    public DateTime? DesktopLicenseExpiresAtUtc { get; set; }
    public bool IsCurrentlyValid { get; set; }
}
