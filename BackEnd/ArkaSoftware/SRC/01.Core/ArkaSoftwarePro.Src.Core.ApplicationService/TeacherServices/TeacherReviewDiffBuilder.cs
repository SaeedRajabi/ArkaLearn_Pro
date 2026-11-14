using System.Text.Json;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherReviewChanges;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public static class TeacherReviewDiffBuilder
{
    public static TeacherReviewChangesQri Build(
        string reviewType,
        long teacherId,
        long contentId,
        string? approvedSnapshotJson,
        IReadOnlyList<(string Key, string Label, string? Current)> currentFields)
    {
        var baseline = TeacherReviewSnapshotService.ParseSnapshot(approvedSnapshotJson);
        var changes = new List<TeacherReviewFieldChangeQri>();

        foreach (var (key, label, current) in currentFields)
        {
            var previous = baseline != null && baseline.TryGetValue(key, out var element)
                ? FormatJsonElement(element)
                : null;

            var normalizedPrevious = Normalize(previous);
            var normalizedCurrent = Normalize(current);

            if (normalizedPrevious == normalizedCurrent)
                continue;

            changes.Add(new TeacherReviewFieldChangeQri
            {
                FieldKey = key,
                FieldLabel = label,
                PreviousText = string.IsNullOrWhiteSpace(previous) ? null : previous,
                CurrentText = string.IsNullOrWhiteSpace(current) ? null : current,
                ChangeKind = baseline == null || string.IsNullOrWhiteSpace(previous)
                    ? "added"
                    : string.IsNullOrWhiteSpace(current)
                        ? "removed"
                        : "modified",
            });
        }

        return new TeacherReviewChangesQri
        {
            ReviewType = reviewType,
            TeacherId = teacherId,
            ContentId = contentId,
            HasApprovedBaseline = baseline != null,
            Changes = changes,
        };
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string FormatJsonElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? string.Empty,
            JsonValueKind.Number => element.ToString(),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.Null => string.Empty,
            _ => element.GetRawText(),
        };
    }
}
