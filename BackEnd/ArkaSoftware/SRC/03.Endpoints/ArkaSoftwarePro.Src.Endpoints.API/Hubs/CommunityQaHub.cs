using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

public class CommunityQaHub : Hub
{
    public const string ListGroup = "community-qa-list";

    public static string ThreadGroup(long threadId) => $"thread-{threadId}";

    public static string UserGroup(long userId) => $"user-{userId}";

    public Task JoinList() => Groups.AddToGroupAsync(Context.ConnectionId, ListGroup);

    public Task LeaveList() => Groups.RemoveFromGroupAsync(Context.ConnectionId, ListGroup);

    public Task JoinThread(long threadId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, ThreadGroup(threadId));

    public Task LeaveThread(long threadId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, ThreadGroup(threadId));

    public Task JoinUser(long userId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));

    public Task LeaveUser(long userId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));
}
