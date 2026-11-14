using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;

public class CourseLessonWatchProgress : Entity
{
    public long UserId { get; private set; }
    public long CourseId { get; private set; }
    public long LessonId { get; private set; }
    public int WatchedSeconds { get; private set; }
    public int DurationSeconds { get; private set; }
    public bool IsCompleted { get; private set; }
    public DateTime? CompletedAtUtc { get; private set; }
    public DateTime LastUpdatedUtc { get; private set; }

    private CourseLessonWatchProgress() { }

    public static CourseLessonWatchProgress Create(long userId, long courseId, long lessonId)
        => new()
        {
            UserId = userId,
            CourseId = courseId,
            LessonId = lessonId,
            LastUpdatedUtc = DateTime.UtcNow,
        };

    public void UpdateProgress(int watchedSeconds, int durationSeconds)
    {
        WatchedSeconds = Math.Max(WatchedSeconds, Math.Max(0, watchedSeconds));
        if (durationSeconds > 0)
            DurationSeconds = durationSeconds;

        var threshold = DurationSeconds > 0 ? DurationSeconds : WatchedSeconds;
        if (threshold > 0 && WatchedSeconds >= threshold * 0.9)
        {
            IsCompleted = true;
            CompletedAtUtc ??= DateTime.UtcNow;
        }

        LastUpdatedUtc = DateTime.UtcNow;
    }
}
