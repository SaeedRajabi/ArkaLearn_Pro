namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services;

/// <summary>
/// نشانگر درخواست لایسنس دسکتاپ در فیلد SpotPlayerLicense (بدون نیاز به مایگریشن).
/// </summary>
public static class DesktopLicenseRequestMarkers
{
    public const string Pending = "__DESKTOP_LICENSE_REQUESTED__";

    public static bool IsPending(string? spotPlayerLicense) =>
        string.Equals(spotPlayerLicense?.Trim(), Pending, StringComparison.Ordinal);
}
