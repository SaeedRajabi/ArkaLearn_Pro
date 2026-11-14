using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;

public sealed class RoomSeatAdminNotifier(
    IHubContext<MeetingHub> hubContext,
    IRoomSeatLivePresence roomSeatLivePresence) : IRoomSeatAdminNotifier
{
    public async Task NotifySeatRemovedByAdminAsync(
        long roomId,
        long roomUserId,
        string action,
        CancellationToken cancellationToken = default)
    {
        if (!roomSeatLivePresence.TryGetSeatConnection(roomId, roomUserId, out var connectionId) ||
            string.IsNullOrWhiteSpace(connectionId))
            return;

        var wasBlocked = string.Equals(action, "blocked", StringComparison.OrdinalIgnoreCase);
        await hubContext.Clients.Client(connectionId)
            .SendAsync("AdminSeatRemoved", roomId.ToString(), action, wasBlocked, cancellationToken);
        roomSeatLivePresence.UnregisterSeat(roomId, roomUserId, connectionId);
    }
}
