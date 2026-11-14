using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SessionAggregate.Entities;

public class RoomSession : AggregateRoot
{
    public long RoomId { get; private set; }
    public DateTime StartTime { get; private set; }
    public DateTime? EndTime { get; private set; }
    public TimeSpan? Duration => EndTime.HasValue ? EndTime.Value - StartTime : null;
    public string Status { get; private set; } // "Active", "Completed"
    public string? StartedByUserId { get; private set; }
    public bool IsIgnored { get; private set; }

    private RoomSession() { }

    public static RoomSession Start(long roomId, string? startedByUserId)
    {
        return new RoomSession
        {
            RoomId = roomId,
            StartTime = DateTime.UtcNow,
            Status = "Active",
            StartedByUserId = startedByUserId
        };
    }

    public void End()
    {
        if (Status != "Active") return;
        EndTime = DateTime.UtcNow;
        Status = "Completed";
    }

    public void SetIgnored(bool ignored) => IsIgnored = ignored;
}