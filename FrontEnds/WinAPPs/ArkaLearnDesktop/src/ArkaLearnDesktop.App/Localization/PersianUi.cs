namespace ArkaLearnDesktop.App.Localization;

internal static class PersianUi
{
    public static string TranslateRole(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return "—";

        return role.Trim().ToLowerInvariant() switch
        {
            "teacher" or "instructor" => "استاد",
            "student" => "دانشجو",
            "admin" or "administrator" => "مدیر",
            "user" => "کاربر",
            _ when role.Contains("teacher", StringComparison.OrdinalIgnoreCase) => "استاد",
            _ when role.Contains("استاد", StringComparison.Ordinal) => "استاد",
            _ when role.Contains("student", StringComparison.OrdinalIgnoreCase) => "دانشجو",
            _ when role.Contains("دانشجو", StringComparison.Ordinal) => "دانشجو",
            _ => role,
        };
    }

    public static string TranslateRemoteAssistStatus(string? status) =>
        status switch
        {
            "Pending" => "آماده / در انتظار اتصال",
            "AwaitingConsent" => "در انتظار تأیید دسترسی",
            "Active" => "فعال",
            "Ended" => "پایان‌یافته",
            "Expired" => "منقضی‌شده",
            "Rejected" => "ردشده",
            _ => status ?? "—",
        };
}
