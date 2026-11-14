using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes;

public class SignalRPlatformSupportTicketNotifier(IHubContext<PlatformSupportTicketHub> hubContext)
    : IPlatformSupportTicketRealtimeNotifier
{
    public async Task NotifyTicketOpenedAsync(PlatformSupportTicketOpenedEvent payload)
    {
        await hubContext.Clients.Group(PlatformSupportTicketHub.AdminGroup())
            .SendAsync("TicketOpened", payload);
        await hubContext.Clients.Group(PlatformSupportTicketHub.UserGroup(payload.RequesterUserId))
            .SendAsync("TicketOpened", payload);
        await hubContext.Clients.Group(PlatformSupportTicketHub.TicketGroup(payload.TicketId))
            .SendAsync("TicketOpened", payload);
    }

    public async Task NotifyMessagePostedAsync(PlatformSupportTicketMessagePostedEvent payload)
    {
        await hubContext.Clients.Group(PlatformSupportTicketHub.TicketGroup(payload.TicketId))
            .SendAsync("MessagePosted", payload);
        await hubContext.Clients.Group(PlatformSupportTicketHub.UserGroup(payload.RequesterUserId))
            .SendAsync("MessagePosted", payload);
        await hubContext.Clients.Group(PlatformSupportTicketHub.AdminGroup())
            .SendAsync("MessagePosted", payload);
    }

    public async Task NotifyTicketStatusChangedAsync(PlatformSupportTicketStatusChangedEvent payload)
    {
        await hubContext.Clients.Group(PlatformSupportTicketHub.TicketGroup(payload.TicketId))
            .SendAsync("TicketStatusChanged", payload);
        await hubContext.Clients.Group(PlatformSupportTicketHub.UserGroup(payload.RequesterUserId))
            .SendAsync("TicketStatusChanged", payload);
        await hubContext.Clients.Group(PlatformSupportTicketHub.AdminGroup())
            .SendAsync("TicketStatusChanged", payload);
    }

    public Task NotifyAdminPulseAsync()
        => hubContext.Clients.Group(PlatformSupportTicketHub.AdminGroup())
            .SendAsync("NotificationPulse");

    public Task NotifyUserPulseAsync(long userId)
        => hubContext.Clients.Group(PlatformSupportTicketHub.UserGroup(userId))
            .SendAsync("NotificationPulse");
}
