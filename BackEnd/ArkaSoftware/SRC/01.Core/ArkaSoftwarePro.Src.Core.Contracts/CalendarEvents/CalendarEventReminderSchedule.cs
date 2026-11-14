using System.Text.Json;

namespace ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents;

public static class CalendarEventReminderSchedule
{
    public const int MaxOffsets = 10;
    public const int MaxMinutesBefore = 10080; // 7 days
    public const int BackgroundIntervalSeconds = 30;
    public const string DefaultJson = "[60,30]";

    public static IReadOnlyList<int> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Parse(DefaultJson);

        try
        {
            var values = JsonSerializer.Deserialize<List<int>>(json) ?? [];
            return values
                .Where(x => x is > 0 and <= MaxMinutesBefore)
                .Distinct()
                .OrderByDescending(x => x)
                .Take(MaxOffsets)
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    public static string Serialize(IEnumerable<int> minutesBefore)
    {
        var normalized = minutesBefore
            .Where(x => x is > 0 and <= MaxMinutesBefore)
            .Distinct()
            .OrderByDescending(x => x)
            .Take(MaxOffsets)
            .ToList();

        return normalized.Count == 0 ? "[]" : JsonSerializer.Serialize(normalized);
    }
}
