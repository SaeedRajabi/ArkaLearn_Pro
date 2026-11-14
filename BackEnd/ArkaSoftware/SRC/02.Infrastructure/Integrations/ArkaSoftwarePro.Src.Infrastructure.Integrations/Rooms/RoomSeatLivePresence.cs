using System.Collections.Concurrent;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;

public sealed class RoomSeatLivePresence : IRoomSeatLivePresence
{
    private readonly ConcurrentDictionary<long, ConcurrentDictionary<long, string>> _seatsByRoom = new();

    public bool IsSeatLive(long roomId, long seatUserId)
    {
        return _seatsByRoom.TryGetValue(roomId, out var map) && map.ContainsKey(seatUserId);
    }

    public bool TryGetSeatConnection(long roomId, long seatUserId, out string? connectionId)
    {
        connectionId = null;
        if (!_seatsByRoom.TryGetValue(roomId, out var map))
            return false;
        if (!map.TryGetValue(seatUserId, out var conn))
            return false;
        connectionId = conn;
        return true;
    }

    public bool RegisterSeat(long roomId, long seatUserId, string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            return false;

        var map = _seatsByRoom.GetOrAdd(roomId, _ => new ConcurrentDictionary<long, string>());
        return map.TryAdd(seatUserId, connectionId) ||
            (map.TryGetValue(seatUserId, out var existing) && string.Equals(existing, connectionId, StringComparison.Ordinal));
    }

    public string? TakeOverSeat(long roomId, long seatUserId, string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            return null;

        var map = _seatsByRoom.GetOrAdd(roomId, _ => new ConcurrentDictionary<long, string>());
        while (true)
        {
            if (map.TryGetValue(seatUserId, out var existing))
            {
                if (string.Equals(existing, connectionId, StringComparison.Ordinal))
                    return null;
                if (map.TryUpdate(seatUserId, connectionId, existing))
                    return existing;
                continue;
            }

            if (map.TryAdd(seatUserId, connectionId))
                return null;
        }
    }

    public void UnregisterSeat(long roomId, long seatUserId, string connectionId)
    {
        if (!_seatsByRoom.TryGetValue(roomId, out var map))
            return;

        ((ICollection<KeyValuePair<long, string>>)map).Remove(new(seatUserId, connectionId));
        // Retain the room map: removing an empty map can race with a concurrent registration.
    }
}
