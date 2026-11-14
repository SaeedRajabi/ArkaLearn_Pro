namespace ArkaSoftwarePro.Src.Core.Contracts.SupportTickets;

public record PlatformSupportTicketMessagePostedEvent(
    long TicketId,
    long MessageId,
    long SenderUserId,
    string SenderName,
    string ContentHtml,
    DateTime SentAtUtc,
    bool IsStaffMessage,
    long RequesterUserId,
    string Status,
    string Subject,
    long? ReplyToMessageId,
    string? ReplyToSenderName,
    string? ReplyToContentPreview);

public record PlatformSupportTicketOpenedEvent(
    long TicketId,
    int DisplayNumber,
    string DisplayCode,
    string Subject,
    string Department,
    string Status,
    long RequesterUserId,
    string RequesterName,
    string? LastMessagePreview);

public record PlatformSupportTicketStatusChangedEvent(
    long TicketId,
    string Status,
    long RequesterUserId);

public interface IPlatformSupportTicketRealtimeNotifier
{
    Task NotifyTicketOpenedAsync(PlatformSupportTicketOpenedEvent payload);
    Task NotifyMessagePostedAsync(PlatformSupportTicketMessagePostedEvent payload);
    Task NotifyTicketStatusChangedAsync(PlatformSupportTicketStatusChangedEvent payload);
    Task NotifyAdminPulseAsync();
    Task NotifyUserPulseAsync(long userId);
}
