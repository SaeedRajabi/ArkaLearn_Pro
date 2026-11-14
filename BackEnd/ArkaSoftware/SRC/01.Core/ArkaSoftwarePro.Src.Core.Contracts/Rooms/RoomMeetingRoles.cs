namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms;

/// <summary>Authoritative meeting role — never inferred from dashboard JWT alone.</summary>
public enum RoomMeetingRole
{
    Student = 0,
    /// <summary>Anonymous attendee admitted via guest join ticket.</summary>
    Guest = 3,
    /// <summary>Room owner / primary teacher — full moderation.</summary>
    Teacher = 1,
    /// <summary>Dashboard admin observing or co-moderating (not room owner).</summary>
    Moderator = 2,
}

public sealed class RoomJoinTicketClaims
{
    public long RoomId { get; init; }
    public string ParticipantKey { get; init; } = string.Empty;
    public RoomMeetingRole Role { get; init; }
    public long? SeatUserId { get; init; }
    public long? StaffUserId { get; init; }
    public DateTime ExpiresUtc { get; init; }
}
