using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public static class CourseLifecycleDateParser
{
    public static DateTime? ParseUtc(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (DateTime.TryParse(value, out var parsed))
        {
            return parsed.Kind switch
            {
                DateTimeKind.Utc => parsed,
                DateTimeKind.Local => parsed.ToUniversalTime(),
                _ => DateTime.SpecifyKind(parsed, DateTimeKind.Utc),
            };
        }

        return null;
    }

    public static CourseLifecyclePhase ParsePhase(string? value) => CourseLifecycleRules.Parse(value);
}
