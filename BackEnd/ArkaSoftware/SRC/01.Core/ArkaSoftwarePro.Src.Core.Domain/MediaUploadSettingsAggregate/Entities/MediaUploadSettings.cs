using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities;

/// <summary>Singleton site-wide limits for course intro and promotional video duration.</summary>
public class MediaUploadSettings : AggregateRoot
{
    public const int DefaultCourseIntroMaxDurationMinutes = 5;
    public const int DefaultPromotionalVideoMaxDurationMinutes = 5;
    public const int MinDurationMinutes = 1;
    public const int MaxDurationMinutes = 120;

    public int CourseIntroMaxDurationMinutes { get; private set; } = DefaultCourseIntroMaxDurationMinutes;
    public int PromotionalVideoMaxDurationMinutes { get; private set; } = DefaultPromotionalVideoMaxDurationMinutes;

    private MediaUploadSettings()
    {
    }

    public MediaUploadSettings(int courseIntroMaxDurationMinutes, int promotionalVideoMaxDurationMinutes)
    {
        Update(courseIntroMaxDurationMinutes, promotionalVideoMaxDurationMinutes);
    }

    public void Update(int courseIntroMaxDurationMinutes, int promotionalVideoMaxDurationMinutes)
    {
        CourseIntroMaxDurationMinutes = ClampMinutes(
            courseIntroMaxDurationMinutes,
            DefaultCourseIntroMaxDurationMinutes);
        PromotionalVideoMaxDurationMinutes = ClampMinutes(
            promotionalVideoMaxDurationMinutes,
            DefaultPromotionalVideoMaxDurationMinutes);
    }

    public int CourseIntroMaxDurationSeconds => CourseIntroMaxDurationMinutes * 60;
    public int PromotionalVideoMaxDurationSeconds => PromotionalVideoMaxDurationMinutes * 60;

    private static int ClampMinutes(int value, int fallback)
        => value is < MinDurationMinutes or > MaxDurationMinutes ? fallback : value;
}
