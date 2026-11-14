using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ValidateDesktopLicense;

public class ValidateDesktopLicenseQuery : IQuery<DesktopLicenseValidationQri?>
{
    public long UserId { get; set; }
    public string LicenseKey { get; set; } = string.Empty;
    public string? DeviceId { get; set; }
    public string? OsVersion { get; set; }
    public string? MachineName { get; set; }
}

public class DesktopLicenseValidationQri
{
    public long EnrollmentId { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string LicenseKey { get; set; } = string.Empty;
}
