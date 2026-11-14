using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

[Authorize]
public sealed class ChatHub(IRoomAccessService roomAccess) : Hub
{
    private static readonly ConcurrentDictionary<(string Connection, string Room), string> Members = new();

    private string CallerId => Context.User?.FindFirstValue("roomSeatId")
        ?? Context.User?.FindFirstValue("userId") ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new HubException("Authentication required.");

    private async Task<string> RequireRoom(string roomId, bool manage = false, bool joined = true)
    {
        if (!long.TryParse(roomId, out var id) || id <= 0 ||
            !await roomAccess.CanAccessAsync(id, Context.User, manage, Context.ConnectionAborted))
            throw new HubException("Room access denied.");
        var normalized = id.ToString(System.Globalization.CultureInfo.InvariantCulture);
        if (joined && !Members.ContainsKey((Context.ConnectionId, normalized)))
            throw new HubException("Join this room first.");
        return normalized;
    }

    public async Task JoinRoom(string roomId)
    {
        var room = await RequireRoom(roomId, joined: false);
        await Groups.AddToGroupAsync(Context.ConnectionId, room);
        Members[(Context.ConnectionId, room)] = CallerId;
    }

    public async Task LeaveRoom(string roomId)
    {
        if (!long.TryParse(roomId, out var id)) return;
        var room = id.ToString(System.Globalization.CultureInfo.InvariantCulture);
        if (Members.TryRemove((Context.ConnectionId, room), out _))
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        foreach (var member in Members.Where(x => x.Key.Connection == Context.ConnectionId).ToArray())
            if (Members.TryRemove(member.Key, out var id))
                await Clients.Group(member.Key.Room).SendAsync("UserWentOffline", id);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task KickUser(string roomId, string targetUserId)
    {
        var room = await RequireRoom(roomId, manage: true);
        foreach (var member in Members.Where(x => x.Key.Room == room && x.Value == targetUserId).ToArray())
            if (Members.TryRemove(member.Key, out _))
            {
                await Groups.RemoveFromGroupAsync(member.Key.Connection, room);
                await Clients.Client(member.Key.Connection).SendAsync("ForceLeaveRoom");
            }
        await Clients.Group(room).SendAsync("UserKicked", targetUserId);
    }

    public async Task ToggleUserAudio(string roomId, string targetUserId, bool isMuted)
    {
        var room = await RequireRoom(roomId, manage: true);
        await Clients.Group(room).SendAsync("UserAudioToggled", new { userId = targetUserId, isMuted });
    }

    public async Task ChangeUserRole(string roomId, string targetUserId, string newRole)
    {
        var room = await RequireRoom(roomId, manage: true);
        if (newRole is not ("student" or "presenter")) throw new HubException("Invalid role.");
        await Clients.Group(room).SendAsync("UserRoleChanged", new { userId = targetUserId, role = newRole });
    }

    public async Task ShareScreen(string roomId, string userId, string screenData)
    {
        var room = await RequireRoom(roomId);
        if (string.IsNullOrEmpty(screenData) || screenData.Length > 1024 * 1024) throw new HubException("Invalid screen data.");
        await Clients.GroupExcept(room, Context.ConnectionId).SendAsync("ReceiveScreenShare", new { userId = CallerId, screenData });
    }

    public async Task SendMediaSignal(string roomId, string fromUserId, object signalData)
    {
        var room = await RequireRoom(roomId);
        if (signalData is null || JsonSerializer.Serialize(signalData).Length > 1024 * 1024) throw new HubException("Invalid signal.");
        await Clients.GroupExcept(room, Context.ConnectionId).SendAsync("ReceiveMediaSignal", new { fromUserId = CallerId, signalData });
    }
}
