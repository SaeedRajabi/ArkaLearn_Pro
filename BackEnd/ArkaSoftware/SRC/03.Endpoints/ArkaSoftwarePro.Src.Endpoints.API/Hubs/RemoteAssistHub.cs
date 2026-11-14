using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

public class RemoteAssistHub : Hub
{
    private static readonly ConcurrentDictionary<string, long> ConnectionUsers = new(StringComparer.Ordinal);
    private static readonly ConcurrentDictionary<long, int> OnlineUserRefCounts = new();

    public static string UserGroup(long userId) => $"remote-assist-user-{userId}";

    public static string TeacherPoolGroup => "remote-assist-teachers";

    public static string SessionGroup(long sessionId) => $"remote-assist-session-{sessionId}";

    public async Task JoinUser(long userId)
    {
        if (userId <= 0) return;
        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));

        long? previousUserId = null;
        if (ConnectionUsers.TryGetValue(Context.ConnectionId, out var existing) && existing > 0)
            previousUserId = existing;

        if (previousUserId == userId)
            return;

        ConnectionUsers[Context.ConnectionId] = userId;

        if (previousUserId is > 0)
        {
            if (DecrementOnline(previousUserId.Value))
            {
                await Clients.Group(TeacherPoolGroup).SendAsync(
                    "UserPresenceChanged",
                    new { userId = previousUserId.Value, isOnline = false });
            }
        }

        var becameOnline = false;
        OnlineUserRefCounts.AddOrUpdate(
            userId,
            _ =>
            {
                becameOnline = true;
                return 1;
            },
            (_, count) =>
            {
                if (count <= 0)
                {
                    becameOnline = true;
                    return 1;
                }
                return count + 1;
            });

        if (becameOnline)
        {
            await Clients.Group(TeacherPoolGroup).SendAsync(
                "UserPresenceChanged",
                new { userId, isOnline = true });
        }
    }

    public Task LeaveUser(long userId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));

    public Task JoinTeacherPool() =>
        Groups.AddToGroupAsync(Context.ConnectionId, TeacherPoolGroup);

    public Task LeaveTeacherPool() =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, TeacherPoolGroup);

    public Task JoinSession(long sessionId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, SessionGroup(sessionId));

    public Task LeaveSession(long sessionId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, SessionGroup(sessionId));

    public async Task PushScreenFrame(long sessionId, string jpegBase64)
    {
        // Cap keeps frames under the SignalR receive limit after Base64 + JSON overhead.
        if (sessionId <= 0 || string.IsNullOrWhiteSpace(jpegBase64) || jpegBase64.Length > 1_800_000)
            return;

        await Clients.OthersInGroup(SessionGroup(sessionId))
            .SendAsync("ScreenFrame", new { sessionId, jpegBase64 });
    }

    public async Task RelayInput(long sessionId, string payloadJson)
    {
        if (sessionId <= 0 || string.IsNullOrWhiteSpace(payloadJson) || payloadJson.Length > 4096)
            return;

        await Clients.OthersInGroup(SessionGroup(sessionId))
            .SendAsync("InputRelay", new { sessionId, payloadJson });
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectionUsers.TryRemove(Context.ConnectionId, out var userId) && userId > 0)
        {
            if (DecrementOnline(userId))
            {
                await Clients.Group(TeacherPoolGroup).SendAsync(
                    "UserPresenceChanged",
                    new { userId, isOnline = false });
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    private static bool DecrementOnline(long userId)
    {
        var wentOffline = false;
        OnlineUserRefCounts.AddOrUpdate(
            userId,
            _ => 0,
            (_, count) =>
            {
                var next = Math.Max(0, count - 1);
                if (next == 0) wentOffline = true;
                return next;
            });

        if (wentOffline)
            OnlineUserRefCounts.TryRemove(userId, out _);

        return wentOffline;
    }
}
