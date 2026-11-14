using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class SupportChatCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : ISupportChatCommandRepository
{
    public async Task InsertConversationAsync(SupportConversation conversation, CancellationToken cancellationToken = default)
    {
        await dbContext.SupportConversations.AddAsync(conversation, cancellationToken);
    }

    public Task<SupportConversation?> GetConversationByIdAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        return dbContext.SupportConversations
            .FirstOrDefaultAsync(x => x.Id == conversationId && !x.IsDelete, cancellationToken);
    }

    public Task<SupportConversation?> GetConversationWithMessagesAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        return dbContext.SupportConversations
            .Include(x => x.Messages)
            .FirstOrDefaultAsync(x => x.Id == conversationId && !x.IsDelete, cancellationToken);
    }

    public async Task InsertSmsReminderAsync(SupportChatSmsReminder reminder, CancellationToken cancellationToken = default)
    {
        await dbContext.SupportChatSmsReminders.AddAsync(reminder, cancellationToken);
    }

    public async Task CancelPendingSmsRemindersAsync(long conversationId, long recipientUserId, CancellationToken cancellationToken = default)
    {
        var pending = await dbContext.SupportChatSmsReminders
            .Where(x =>
                x.ConversationId == conversationId &&
                x.RecipientUserId == recipientUserId &&
                x.SentAtUtc == null &&
                x.CancelledAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var item in pending)
            item.Cancel();
    }

    public Task<List<SupportChatSmsReminder>> GetDueSmsRemindersAsync(DateTime utcNow, int take, CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 200 ? take : 50;
        return dbContext.SupportChatSmsReminders
            .Where(x =>
                x.ScheduledAtUtc <= utcNow &&
                x.SentAtUtc == null &&
                x.CancelledAtUtc == null)
            .OrderBy(x => x.ScheduledAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task InsertRatingAsync(SupportConversationRating rating, CancellationToken cancellationToken = default)
    {
        await dbContext.SupportConversationRatings.AddAsync(rating, cancellationToken);
    }

    public Task<bool> HasRatingAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        return dbContext.SupportConversationRatings
            .AsNoTracking()
            .AnyAsync(x => x.ConversationId == conversationId, cancellationToken);
    }

    public async Task<List<long>> MarkMessagesDeliveredAsync(
        long conversationId,
        long recipientUserId,
        IReadOnlyCollection<long> messageIds,
        CancellationToken cancellationToken = default)
    {
        if (messageIds.Count == 0)
            return [];

        var messages = await dbContext.SupportMessages
            .Where(m =>
                m.ConversationId == conversationId &&
                messageIds.Contains(m.Id) &&
                m.SenderUserId != recipientUserId &&
                !m.IsDelete)
            .ToListAsync(cancellationToken);

        return MarkDeliveredMessages(messages);
    }

    public async Task<List<long>> MarkAllUndeliveredAsDeliveredAsync(
        long conversationId,
        long recipientUserId,
        CancellationToken cancellationToken = default)
    {
        var messages = await dbContext.SupportMessages
            .Where(m =>
                m.ConversationId == conversationId &&
                m.SenderUserId != recipientUserId &&
                m.DeliveredAtUtc == null &&
                !m.IsDelete)
            .ToListAsync(cancellationToken);

        return MarkDeliveredMessages(messages);
    }

    private static List<long> MarkDeliveredMessages(List<SupportMessage> messages)
    {
        var now = DateTime.UtcNow;
        var updated = new List<long>();
        foreach (var message in messages)
        {
            if (message.MarkDelivered(now))
                updated.Add(message.Id);
        }

        return updated;
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpsertDesktopPresenceAsync(
        long userId,
        string? connectionId,
        string? appVersion,
        string? deviceId,
        bool isOnline,
        CancellationToken cancellationToken = default)
    {
        var row = await dbContext.DesktopUserPresences
            .FirstOrDefaultAsync(x => x.UserId == userId && !x.IsDelete, cancellationToken);

        if (row is null)
        {
            row = DesktopUserPresence.Create(userId);
            await dbContext.DesktopUserPresences.AddAsync(row, cancellationToken);
        }

        if (isOnline)
            row.MarkOnline(connectionId ?? Guid.NewGuid().ToString("N"), appVersion, deviceId);
        else
            row.MarkOffline();
    }

    public async Task InsertStoryAsync(SupportTeacherStory story, CancellationToken cancellationToken = default)
    {
        await dbContext.SupportTeacherStories.AddAsync(story, cancellationToken);
    }

    public Task<SupportTeacherStory?> GetStoryByIdAsync(long storyId, CancellationToken cancellationToken = default)
    {
        return dbContext.SupportTeacherStories
            .FirstOrDefaultAsync(x => x.Id == storyId && !x.IsDelete, cancellationToken);
    }

    public Task<SupportTeacherStory?> GetStoryWithViewsAsync(long storyId, CancellationToken cancellationToken = default)
    {
        return dbContext.SupportTeacherStories
            .Include(x => x.Views)
            .FirstOrDefaultAsync(x => x.Id == storyId && !x.IsDelete, cancellationToken);
    }
}
