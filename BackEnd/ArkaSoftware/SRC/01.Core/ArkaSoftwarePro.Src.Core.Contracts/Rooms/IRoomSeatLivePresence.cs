namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms;

/// <summary>Tracks active SignalR connections per room seat (in-memory, per API instance).</summary>
public interface IRoomSeatLivePresence
{
    bool IsSeatLive(long roomId, long seatUserId);

    bool TryGetSeatConnection(long roomId, long seatUserId, out string? connectionId);

    /// <returns>false if another connection already holds this seat.</returns>
    bool RegisterSeat(long roomId, long seatUserId, string connectionId);

    /// <summary>
    /// Atomically assigns the seat to <paramref name="connectionId"/>.
    /// Returns the previous connection id when a different connection held the seat; otherwise null.
    /// </summary>
    string? TakeOverSeat(long roomId, long seatUserId, string connectionId);

    void UnregisterSeat(long roomId, long seatUserId, string connectionId);
}
