using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

public enum DesktopPlaybackEventKind : byte
{
    Play = 1,
    Pause = 2,
    Seek = 3,
    Heartbeat = 4,
    Complete = 5,
    Download = 6,
}

/// <summary>Desktop playback telemetry for teacher analytics.</summary>
public class DesktopPlaybackEvent : AggregateRoot
{
    public long UserId { get; private set; }
    public long CourseId { get; private set; }
    public long LessonId { get; private set; }
    public long? EnrollmentId { get; private set; }
    public string? DeviceId { get; private set; }
    public DesktopPlaybackEventKind Kind { get; private set; }
    public int PositionSeconds { get; private set; }
    public int WatchedDeltaSeconds { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private DesktopPlaybackEvent() { }

    public static DesktopPlaybackEvent Create(
        long userId,
        long courseId,
        long lessonId,
        long? enrollmentId,
        string? deviceId,
        DesktopPlaybackEventKind kind,
        int positionSeconds,
        int watchedDeltaSeconds)
    {
        return new DesktopPlaybackEvent
        {
            UserId = userId,
            CourseId = courseId,
            LessonId = lessonId,
            EnrollmentId = enrollmentId,
            DeviceId = string.IsNullOrWhiteSpace(deviceId) ? null : deviceId.Trim(),
            Kind = kind,
            PositionSeconds = Math.Max(0, positionSeconds),
            WatchedDeltaSeconds = Math.Max(0, watchedDeltaSeconds),
            CreatedAtUtc = DateTime.UtcNow,
        };
    }
}
