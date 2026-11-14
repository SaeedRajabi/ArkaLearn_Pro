using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ReportDesktopPlaybackTelemetry;

public class ReportDesktopPlaybackTelemetryCommand : ICommand<string>
{
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public long LessonId { get; set; }
    public long? EnrollmentId { get; set; }
    public string? DeviceId { get; set; }
    public DesktopPlaybackEventKind Kind { get; set; }
    public int PositionSeconds { get; set; }
    public int WatchedDeltaSeconds { get; set; }
}
