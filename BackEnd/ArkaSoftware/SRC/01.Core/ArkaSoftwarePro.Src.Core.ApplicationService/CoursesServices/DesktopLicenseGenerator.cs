using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

/// <summary>Compatibility alias — prefer Domain.EnrollmentAggregate.Services.DesktopLicenseGenerator.</summary>
public static class DesktopLicenseGenerator
{
    public static string Generate() =>
        ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services.DesktopLicenseGenerator.Generate();
}
