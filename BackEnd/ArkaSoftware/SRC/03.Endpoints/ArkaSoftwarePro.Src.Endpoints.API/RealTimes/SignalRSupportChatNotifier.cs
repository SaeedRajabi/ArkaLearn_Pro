using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

using ArkaSoftwarePro.Src.Endpoints.API.Hubs;

using Microsoft.AspNetCore.SignalR;



namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes;



public class SignalRSupportChatNotifier(IHubContext<SupportChatHub> hubContext) : ISupportChatRealtimeNotifier

{

    public async Task NotifyMessagePostedAsync(SupportChatMessagePostedEvent payload)

    {

        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))

            .SendAsync("MessagePosted", payload);



        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))

            .SendAsync("MessagePosted", payload);



        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))

            .SendAsync("MessagePosted", payload);

    }



    public async Task NotifyConversationOpenedAsync(SupportChatConversationOpenedEvent payload)

    {

        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))

            .SendAsync("ConversationOpened", payload);

        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))

            .SendAsync("ConversationOpened", payload);



        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))

            .SendAsync("ConversationOpened", payload);



        await NotifyUserNotificationAsync(payload.TeacherUserId);

        await NotifyUserNotificationAsync(payload.StudentUserId);

    }



    public async Task NotifyConversationStatusChangedAsync(SupportChatConversationStatusEvent payload)

    {

        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))

            .SendAsync("ConversationStatusChanged", payload);



        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))

            .SendAsync("ConversationStatusChanged", payload);



        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))

            .SendAsync("ConversationStatusChanged", payload);

    }



    public Task NotifyUserNotificationAsync(long userId)

    {

        return hubContext.Clients.Group(SupportChatHub.UserGroup(userId))

            .SendAsync("NotificationPulse");

    }

    public async Task NotifyMessageUpdatedAsync(SupportChatMessageUpdatedEvent payload)
    {
        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))
            .SendAsync("MessageUpdated", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))
            .SendAsync("MessageUpdated", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))
            .SendAsync("MessageUpdated", payload);
    }

    public async Task NotifyMessageDeletedAsync(SupportChatMessageDeletedEvent payload)
    {
        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))
            .SendAsync("MessageDeleted", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))
            .SendAsync("MessageDeleted", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))
            .SendAsync("MessageDeleted", payload);
    }

    public async Task NotifyConversationUpdatedAsync(SupportChatConversationUpdatedEvent payload)
    {
        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))
            .SendAsync("ConversationUpdated", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))
            .SendAsync("ConversationUpdated", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))
            .SendAsync("ConversationUpdated", payload);
    }

    public async Task NotifyConversationDeletedAsync(SupportChatConversationDeletedEvent payload)
    {
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))
            .SendAsync("ConversationDeleted", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))
            .SendAsync("ConversationDeleted", payload);
    }

    public async Task NotifyMessagesDeliveredAsync(SupportChatMessagesDeliveredEvent payload)
    {
        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))
            .SendAsync("MessagesDelivered", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))
            .SendAsync("MessagesDelivered", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))
            .SendAsync("MessagesDelivered", payload);
    }

    public async Task NotifyMessagesReadAsync(SupportChatMessagesReadEvent payload)
    {
        await hubContext.Clients.Group(SupportChatHub.ConversationGroup(payload.ConversationId))
            .SendAsync("MessagesRead", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.StudentUserId))
            .SendAsync("MessagesRead", payload);
        await hubContext.Clients.Group(SupportChatHub.UserGroup(payload.TeacherUserId))
            .SendAsync("MessagesRead", payload);
    }

}

