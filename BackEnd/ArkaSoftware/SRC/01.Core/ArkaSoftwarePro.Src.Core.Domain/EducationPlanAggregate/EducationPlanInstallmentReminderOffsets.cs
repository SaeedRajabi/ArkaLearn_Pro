using System.Text.Json;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate;

/// <summary>Tracks which reminder offsetDays have already been sent for an installment.</summary>
public static class EducationPlanInstallmentReminderOffsets
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static IReadOnlySet<int> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new HashSet<int>();

        try
        {
            var list = JsonSerializer.Deserialize<List<int>>(json, JsonOptions);
            return list is null ? new HashSet<int>() : list.ToHashSet();
        }
        catch
        {
            return new HashSet<int>();
        }
    }

    public static string Serialize(IEnumerable<int> offsets)
        => JsonSerializer.Serialize(offsets.Distinct().OrderBy(x => x).ToList(), JsonOptions);

    public static bool Contains(string? json, int offsetDays)
        => Parse(json).Contains(offsetDays);

    public static string Add(string? json, int offsetDays)
    {
        var set = Parse(json).ToHashSet();
        set.Add(offsetDays);
        return Serialize(set);
    }
}
