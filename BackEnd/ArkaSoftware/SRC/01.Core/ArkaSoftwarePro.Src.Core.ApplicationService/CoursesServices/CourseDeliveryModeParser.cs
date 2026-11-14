using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public static class CourseDeliveryModeParser
{
    /// <summary>
    /// SpotPlayer is retired; legacy values are normalized to DesktopLicense (Arka).
    /// </summary>
    public static CourseDeliveryMode Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return CourseDeliveryMode.DirectDownload;

        var normalized = value.Trim().ToLowerInvariant();
        return normalized switch
        {
            // Legacy SpotPlayer → Arka desktop license
            "spotplayer" or "spotplayerlicense" or "1" => CourseDeliveryMode.DesktopLicense,
            "desktoplicense" or "desktop" or "desktop_license" or "2" => CourseDeliveryMode.DesktopLicense,
            _ => CourseDeliveryMode.DirectDownload,
        };
    }

    public static string ToApiValue(CourseDeliveryMode mode) =>
        mode switch
        {
            CourseDeliveryMode.DesktopLicense => "desktopLicense",
            // Never expose SpotPlayer to clients
            CourseDeliveryMode.SpotPlayerLicense => "desktopLicense",
            _ => "directDownload",
        };

    public static bool UsesArkaDesktopLicense(CourseDeliveryMode mode) =>
        mode is CourseDeliveryMode.DesktopLicense or CourseDeliveryMode.SpotPlayerLicense;
}
