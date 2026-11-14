using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class DesktopPlaybackEventQueryModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public long LessonId { get; set; }
    public long? EnrollmentId { get; set; }
    public string? DeviceId { get; set; }
    public DesktopPlaybackEventKind Kind { get; set; }
    public int PositionSeconds { get; set; }
    public int WatchedDeltaSeconds { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public bool IsDelete { get; set; }
}
