using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate;

/// <summary>
/// Admin-configurable installment reminder rules.
/// OffsetDays: negative = days before due, 0 = due day, positive = days after due.
/// </summary>
public sealed class EducationPlanInstallmentReminderRule
{
    [JsonPropertyName("offsetDays")]
    public int OffsetDays { get; set; }

    [JsonPropertyName("sendStudentSms")]
    public bool SendStudentSms { get; set; } = true;

    [JsonPropertyName("sendStudentEmail")]
    public bool SendStudentEmail { get; set; } = true;

    [JsonPropertyName("sendTeacherEmail")]
    public bool SendTeacherEmail { get; set; }
}

public static class EducationPlanInstallmentReminderSchedule
{
    public const string DefaultJson =
        "[{\"offsetDays\":-1,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":true}," +
        "{\"offsetDays\":0,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":false}]";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    public static IReadOnlyList<EducationPlanInstallmentReminderRule> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return Parse(DefaultJson);

        try
        {
            var rules = JsonSerializer.Deserialize<List<EducationPlanInstallmentReminderRule>>(json, JsonOptions);
            if (rules is null || rules.Count == 0)
                return Parse(DefaultJson);

            return rules
                .Where(r => r.SendStudentSms || r.SendStudentEmail || r.SendTeacherEmail)
                .GroupBy(r => r.OffsetDays)
                .Select(g => g.First())
                .OrderBy(r => r.OffsetDays)
                .ToList();
        }
        catch
        {
            return Parse(DefaultJson);
        }
    }

    public static string Serialize(IEnumerable<EducationPlanInstallmentReminderRule> rules)
    {
        var normalized = rules
            .Where(r => r.SendStudentSms || r.SendStudentEmail || r.SendTeacherEmail)
            .GroupBy(r => r.OffsetDays)
            .Select(g => g.First())
            .OrderBy(r => r.OffsetDays)
            .ToList();

        if (normalized.Count == 0)
            return DefaultJson;

        return JsonSerializer.Serialize(normalized, JsonOptions);
    }

    /// <summary>Due date (UTC date) that matches a rule for "today".</summary>
    public static DateTime TargetDueDateUtc(DateTime utcNow, int offsetDays)
        => utcNow.Date.AddDays(-offsetDays);
}
