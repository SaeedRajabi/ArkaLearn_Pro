using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.Hubs;

public class PlatformSupportTicketHub : Hub
{
    public static string TicketGroup(long ticketId) => $"platform-ticket-{ticketId}";

    public static string UserGroup(long userId) => $"platform-ticket-user-{userId}";

    public static string AdminGroup() => "platform-ticket-admins";

    public Task JoinTicket(long ticketId)
    {
        if (ticketId <= 0)
            return Task.CompletedTask;
        return Groups.AddToGroupAsync(Context.ConnectionId, TicketGroup(ticketId));
    }

    public Task LeaveTicket(long ticketId)
    {
        if (ticketId <= 0)
            return Task.CompletedTask;
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, TicketGroup(ticketId));
    }

    public Task JoinUser(long userId)
    {
        if (userId <= 0)
            return Task.CompletedTask;
        return Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId));
    }

    public Task LeaveUser(long userId)
    {
        if (userId <= 0)
            return Task.CompletedTask;
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, UserGroup(userId));
    }

    public Task JoinAdmins()
        => Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup());

    public Task LeaveAdmins()
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, AdminGroup());
}
