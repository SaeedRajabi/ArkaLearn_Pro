using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices;

public static class SupportChatEventFactory
{
    public static SupportChatMessagePostedEvent BuildMessagePosted(
        SupportConversation conversation,
        SupportMessage message,
        string senderName,
        string? replyToSenderName = null,
        string? replyToContentPreview = null)
    {
        return new SupportChatMessagePostedEvent
        {
            ConversationId = conversation.Id,
            MessageId = message.Id,
            SenderUserId = message.SenderUserId,
            SenderName = senderName,
            ContentHtml = message.IsDelete ? string.Empty : message.ContentHtml,
            SentAtUtc = message.SentAtUtc.ToString("O"),
            Subject = conversation.Subject,
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
            ReplyToMessageId = message.ReplyToMessageId,
            ReplyToSenderName = replyToSenderName,
            ReplyToContentPreview = replyToContentPreview,
        };
    }

    public static string StripHtml(string html, int maxLen)
    {
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ").Trim();
        if (text.Length <= maxLen) return text;
        return text[..maxLen] + "...";
    }
}
