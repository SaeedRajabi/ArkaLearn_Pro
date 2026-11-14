using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes;

public class SignalRRemoteAssistNotifier(IHubContext<RemoteAssistHub> hubContext) : IRemoteAssistRealtimeNotifier
{
    public async Task NotifySessionRequestedAsync(RemoteAssistSessionChangedEvent payload)
    {
        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("SessionChanged", payload);

        await hubContext.Clients.Group(RemoteAssistHub.TeacherPoolGroup)
            .SendAsync("SessionChanged", payload);
    }

    public async Task NotifySessionAcceptedAsync(RemoteAssistSessionChangedEvent payload)
    {
        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("SessionChanged", payload);

        if (payload.AcceptedByTeacherUserId is > 0)
        {
            await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.AcceptedByTeacherUserId.Value))
                .SendAsync("SessionChanged", payload);
        }

        await hubContext.Clients.Group(RemoteAssistHub.SessionGroup(payload.SessionId))
            .SendAsync("SessionChanged", payload);
    }

    public async Task NotifySessionEndedAsync(RemoteAssistSessionChangedEvent payload)
    {
        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("SessionChanged", payload);

        if (payload.AcceptedByTeacherUserId is > 0)
        {
            await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.AcceptedByTeacherUserId.Value))
                .SendAsync("SessionChanged", payload);
        }

        await hubContext.Clients.Group(RemoteAssistHub.SessionGroup(payload.SessionId))
            .SendAsync("SessionChanged", payload);

        await hubContext.Clients.Group(RemoteAssistHub.TeacherPoolGroup)
            .SendAsync("SessionChanged", payload);
    }

    public async Task NotifyConsentRequiredAsync(RemoteAssistSessionChangedEvent payload)
    {
        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("ConsentRequired", payload);

        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("SessionChanged", payload);

        if (payload.AcceptedByTeacherUserId is > 0)
        {
            await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.AcceptedByTeacherUserId.Value))
                .SendAsync("SessionChanged", payload);
        }
    }

    public async Task NotifyConsentResolvedAsync(RemoteAssistSessionChangedEvent payload)
    {
        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("ConsentResolved", payload);

        await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.RequesterUserId))
            .SendAsync("SessionChanged", payload);

        if (payload.AcceptedByTeacherUserId is > 0)
        {
            await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.AcceptedByTeacherUserId.Value))
                .SendAsync("ConsentResolved", payload);

            await hubContext.Clients.Group(RemoteAssistHub.UserGroup(payload.AcceptedByTeacherUserId.Value))
                .SendAsync("SessionChanged", payload);
        }
    }
}
