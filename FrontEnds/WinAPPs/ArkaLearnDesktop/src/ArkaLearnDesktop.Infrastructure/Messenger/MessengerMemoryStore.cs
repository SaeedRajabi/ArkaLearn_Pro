using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Messenger;

/// <summary>In-memory UI cache. SQL Server is source of truth via SupportChat API.</summary>
public sealed class MessengerMemoryStore
{
    private readonly ConcurrentDictionary<long, DesktopChatThread> _threads = new();
    private readonly ConcurrentDictionary<long, List<DesktopChatMessage>> _messages = new();

    public void SetThreads(IReadOnlyList<DesktopChatThread> threads)
    {
        foreach (var key in _threads.Keys.Except(threads.Select(t => t.RemoteConversationId)).ToList())
            _threads.TryRemove(key, out _);

        foreach (var thread in threads)
            _threads[thread.RemoteConversationId] = thread;
    }

    public void SetMessages(long conversationId, IReadOnlyList<DesktopChatMessage> messages)
    {
        _messages[conversationId] = messages.ToList();
    }

    public void AddPendingMessage(DesktopChatMessage message)
    {
        var list = _messages.GetOrAdd(message.RemoteConversationId, _ => []);
        lock (list)
        {
            list.Add(message);
            list.Sort((a, b) => a.SentAtUtc.CompareTo(b.SentAtUtc));
        }
    }

    public void ConfirmPendingMessage(string clientMessageId, long remoteMessageId)
    {
        foreach (var list in _messages.Values)
        {
            lock (list)
            {
                var row = list.FirstOrDefault(x => x.ClientMessageId == clientMessageId);
                if (row is null) continue;

                var index = list.IndexOf(row);
                list[index] = row with
                {
                    RemoteMessageId = remoteMessageId,
                    IsPending = false,
                    SendError = null,
                };
                return;
            }
        }
    }

    public void FailPendingMessage(string clientMessageId, string error)
    {
        foreach (var list in _messages.Values)
        {
            lock (list)
            {
                var row = list.FirstOrDefault(x => x.ClientMessageId == clientMessageId);
                if (row is null) continue;

                var index = list.IndexOf(row);
                list[index] = row with { IsPending = false, SendError = error };
                return;
            }
        }
    }

    public void ApplyPostedMessage(
        long conversationId,
        long messageId,
        long senderUserId,
        string senderName,
        string contentHtml,
        DateTime sentAtUtc,
        long currentUserId,
        long? replyToMessageId = null,
        string? replyToSenderName = null,
        string? replyToContentPreview = null)
    {
        var list = _messages.GetOrAdd(conversationId, _ => []);
        lock (list)
        {
            var existing = list.FirstOrDefault(x => x.RemoteMessageId == messageId);
            if (existing is null)
            {
                list.Add(new DesktopChatMessage(
                    0,
                    conversationId,
                    messageId,
                    null,
                    senderUserId,
                    senderName,
                    contentHtml,
                    sentAtUtc,
                    senderUserId == currentUserId,
                    false,
                    false,
                    null,
                    null,
                    replyToMessageId,
                    replyToSenderName,
                    replyToContentPreview));
            }
            else
            {
                var index = list.IndexOf(existing);
                list[index] = existing with
                {
                    ContentHtml = contentHtml,
                    SenderName = senderName,
                    SentAtUtc = sentAtUtc,
                    IsPending = false,
                    SendError = null,
                    ReplyToMessageId = replyToMessageId ?? existing.ReplyToMessageId,
                    ReplyToSenderName = replyToSenderName ?? existing.ReplyToSenderName,
                    ReplyToContentPreview = replyToContentPreview ?? existing.ReplyToContentPreview,
                };
            }

            list.Sort((a, b) => a.SentAtUtc.CompareTo(b.SentAtUtc));
        }

        if (_threads.TryGetValue(conversationId, out var thread))
        {
            _threads[conversationId] = thread with
            {
                LastMessagePreview = StripHtml(contentHtml, 120),
                LastMessageAtUtc = sentAtUtc,
                UnreadCount = senderUserId != currentUserId ? thread.UnreadCount + 1 : thread.UnreadCount,
            };
        }
    }

    public void UpdateMessageContent(long conversationId, long messageId, string contentHtml)
    {
        if (!_messages.TryGetValue(conversationId, out var list)) return;
        lock (list)
        {
            var row = list.FirstOrDefault(x => x.RemoteMessageId == messageId);
            if (row is null) return;
            var index = list.IndexOf(row);
            list[index] = row with
            {
                ContentHtml = contentHtml,
                EditedAtUtc = DateTime.UtcNow,
                IsDeleted = false,
            };
        }

        if (_threads.TryGetValue(conversationId, out var thread))
        {
            _threads[conversationId] = thread with
            {
                LastMessagePreview = StripHtml(contentHtml, 120),
                LastMessageAtUtc = DateTime.UtcNow,
            };
        }
    }

    public void MarkMessageDeleted(long conversationId, long messageId)
    {
        if (!_messages.TryGetValue(conversationId, out var list)) return;
        lock (list)
        {
            var row = list.FirstOrDefault(x => x.RemoteMessageId == messageId);
            if (row is null) return;
            var index = list.IndexOf(row);
            list[index] = row with
            {
                IsDeleted = true,
                ContentHtml = "<p>این پیام حذف شده است.</p>",
            };
        }

        if (_threads.TryGetValue(conversationId, out var thread))
        {
            _threads[conversationId] = thread with
            {
                LastMessagePreview = "پیام حذف شده",
            };
        }
    }

    public void ClearUnread(long conversationId)
    {
        if (_threads.TryGetValue(conversationId, out var thread))
            _threads[conversationId] = thread with { UnreadCount = 0 };
    }

    public IReadOnlyList<DesktopChatThread> ListThreads() =>
        _threads.Values.OrderByDescending(x => x.LastMessageAtUtc ?? DateTime.MinValue).ToList();

    public IReadOnlyList<DesktopChatMessage> ListMessages(long conversationId) =>
        _messages.TryGetValue(conversationId, out var list)
            ? list.OrderBy(x => x.SentAtUtc).ToList()
            : [];

    public static string ToContentHtml(string plainText) =>
        $"<p>{System.Net.WebUtility.HtmlEncode(plainText.Trim())}</p>";

    public static string StripHtml(string html, int maxLen)
    {
        var text = Regex.Replace(html, "<[^>]+>", " ").Trim();
        if (text.Length <= maxLen) return text;
        return text[..maxLen] + "...";
    }

    public static DateTime ParseUtc(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return DateTime.UtcNow;
        return DateTime.TryParse(value, out var parsed) ? parsed.ToUniversalTime() : DateTime.UtcNow;
    }
}
