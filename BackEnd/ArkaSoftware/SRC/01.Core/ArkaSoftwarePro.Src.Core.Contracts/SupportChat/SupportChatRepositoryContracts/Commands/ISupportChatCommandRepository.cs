using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;



namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;



public interface ISupportChatCommandRepository

{

    Task InsertConversationAsync(SupportConversation conversation, CancellationToken cancellationToken = default);

    Task<SupportConversation?> GetConversationByIdAsync(long conversationId, CancellationToken cancellationToken = default);

    Task<SupportConversation?> GetConversationWithMessagesAsync(long conversationId, CancellationToken cancellationToken = default);

    Task InsertSmsReminderAsync(SupportChatSmsReminder reminder, CancellationToken cancellationToken = default);

    Task CancelPendingSmsRemindersAsync(long conversationId, long recipientUserId, CancellationToken cancellationToken = default);

    Task<List<SupportChatSmsReminder>> GetDueSmsRemindersAsync(DateTime utcNow, int take, CancellationToken cancellationToken = default);

    Task InsertRatingAsync(SupportConversationRating rating, CancellationToken cancellationToken = default);

    Task<bool> HasRatingAsync(long conversationId, CancellationToken cancellationToken = default);

    Task<List<long>> MarkMessagesDeliveredAsync(
        long conversationId,
        long recipientUserId,
        IReadOnlyCollection<long> messageIds,
        CancellationToken cancellationToken = default);

    Task<List<long>> MarkAllUndeliveredAsDeliveredAsync(
        long conversationId,
        long recipientUserId,
        CancellationToken cancellationToken = default);

    Task CommitAsync(CancellationToken cancellationToken = default);

    Task UpsertDesktopPresenceAsync(
        long userId,
        string? connectionId,
        string? appVersion,
        string? deviceId,
        bool isOnline,
        CancellationToken cancellationToken = default);

    Task InsertStoryAsync(SupportTeacherStory story, CancellationToken cancellationToken = default);

    Task<SupportTeacherStory?> GetStoryByIdAsync(long storyId, CancellationToken cancellationToken = default);

    Task<SupportTeacherStory?> GetStoryWithViewsAsync(long storyId, CancellationToken cancellationToken = default);

}

