using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

public class SupportChatHub(ISupportChatPresence presence) : Hub
{
    public static string ConversationGroup(long conversationId) => $"support-conversation-{conversationId}";

    public static string UserGroup(long userId) => $"user-{userId}";

    public static string PresenceWatchGroup(long userId) => $"support-presence-{userId}";

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = presence.Unregister(Context.ConnectionId);
        if (userId.HasValue && !presence.IsOnline(userId.Value))
        {
            await Clients
                .Group(PresenceWatchGroup(userId.Value))
                .SendAsync("UserPresenceChanged", new { userId = userId.Value, isOnline = false });
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinConversation(long conversationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ConversationGroup(conversationId));
    }

    public Task LeaveConversation(long conversationId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, ConversationGroup(conversationId));
    }

    public async Task JoinUser(long userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));

        var wasOnline = presence.IsOnline(userId);
        presence.Register(userId, Context.ConnectionId);

        if (!wasOnline)
        {
            await Clients
                .Group(PresenceWatchGroup(userId))
                .SendAsync("UserPresenceChanged", new { userId, isOnline = true });
        }
    }

    public Task LeaveUser(long userId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));
    }

    public async Task WatchUserPresence(long userId)
    {
        if (userId <= 0)
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, PresenceWatchGroup(userId));
        await Clients.Caller.SendAsync(
            "UserPresenceChanged",
            new { userId, isOnline = presence.IsOnline(userId) });
    }

    public Task UnwatchUserPresence(long userId)
    {
        if (userId <= 0)
            return Task.CompletedTask;

        return Groups.RemoveFromGroupAsync(Context.ConnectionId, PresenceWatchGroup(userId));
    }
}
