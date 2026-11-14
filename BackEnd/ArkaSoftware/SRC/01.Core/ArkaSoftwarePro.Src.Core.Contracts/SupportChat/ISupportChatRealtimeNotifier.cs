using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

public interface ISupportChatRealtimeNotifier
{
    Task NotifyMessagePostedAsync(SupportChatMessagePostedEvent payload);
    Task NotifyMessageUpdatedAsync(SupportChatMessageUpdatedEvent payload);
    Task NotifyMessageDeletedAsync(SupportChatMessageDeletedEvent payload);
    Task NotifyConversationOpenedAsync(SupportChatConversationOpenedEvent payload);
    Task NotifyConversationUpdatedAsync(SupportChatConversationUpdatedEvent payload);
    Task NotifyConversationDeletedAsync(SupportChatConversationDeletedEvent payload);
    Task NotifyConversationStatusChangedAsync(SupportChatConversationStatusEvent payload);
    Task NotifyMessagesDeliveredAsync(SupportChatMessagesDeliveredEvent payload);
    Task NotifyMessagesReadAsync(SupportChatMessagesReadEvent payload);
    Task NotifyUserNotificationAsync(long userId);
}
