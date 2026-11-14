using System.Globalization;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CalendarEventServices;

public static class CalendarEventScheduleFormatter
{
    private static readonly CultureInfo PersianCulture = CultureInfo.GetCultureInfo("fa-IR");

    public static (string Date, string Time) Format(DateTime startUtc, bool isAllDay)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(
            startUtc,
            TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "Iran Standard Time" : "Asia/Tehran"));

        var date = local.ToString("yyyy/MM/dd", PersianCulture);
        var time = isAllDay ? "تمام روز" : local.ToString("HH:mm", PersianCulture);
        return (date, time);
    }
}
