namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Queries.GetRoomSessionsByRoomId;

public class GetRoomSessionsByRoomIdQri
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public TimeSpan? Duration { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? StartedByUserId { get; set; }
    public bool IsIgnored { get; set; }
}