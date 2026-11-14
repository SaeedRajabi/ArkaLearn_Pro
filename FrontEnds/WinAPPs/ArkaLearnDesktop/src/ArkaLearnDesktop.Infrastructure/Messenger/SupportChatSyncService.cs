using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Messenger;

public sealed class SupportChatSyncService : ISupportChatSyncService, IAsyncDisposable
{
    private readonly IDesktopApiClient _api;
    private readonly IAuthSessionStore _sessionStore;
    private readonly MessengerMemoryStore _store;
    private readonly SupportChatHubClient _hub;
    private readonly IDesktopLocalSettings _settings;

    private readonly List<DesktopTeacherStory> _stories = [];
    private readonly Dictionary<long, bool> _presence = new();
    private long? _selectedConversationId;
    private long? _watchedPeerUserId;
    private System.Threading.Timer? _heartbeatTimer;
    private bool _started;

    public SupportChatSyncService(
        IDesktopApiClient api,
        IAuthSessionStore sessionStore,
        MessengerMemoryStore store,
        SupportChatHubClient hub,
        IDesktopLocalSettings settings)
    {
        _api = api;
        _sessionStore = sessionStore;
        _store = store;
        _hub = hub;
        _settings = settings;

        _hub.On("MessagePosted", OnMessagePosted);
        _hub.On("UserPresenceChanged", OnPresenceChanged);
    }

    public event Action? ThreadsChanged;
    public event Action<long>? MessagesChanged;
    public event Action<long, bool>? PresenceChanged;

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (_started) return;
        _started = true;

        var user = await _sessionStore.GetCurrentUserAsync(cancellationToken);
        if (user is null) return;

        await RefreshAsync(cancellationToken);
        await _hub.ConnectAsync(cancellationToken);
        await _hub.JoinUserAsync(user.UserId, cancellationToken);
        await SendHeartbeatAsync(true, cancellationToken);

        _heartbeatTimer = new System.Threading.Timer(async _ =>
        {
            try { await SendHeartbeatAsync(true); }
            catch { /* ignore */ }
        }, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
    }

    public async Task StopAsync(CancellationToken cancellationToken = default)
    {
        _heartbeatTimer?.Dispose();
        _heartbeatTimer = null;

        if (_selectedConversationId is > 0)
            await _hub.LeaveConversationAsync(_selectedConversationId.Value, cancellationToken);

        if (_watchedPeerUserId is > 0)
            await _hub.UnwatchUserPresenceAsync(_watchedPeerUserId.Value, cancellationToken);

        await SendHeartbeatAsync(false, cancellationToken);
        await _hub.DisconnectAsync(cancellationToken);
        _started = false;
    }

    public async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        if (await _sessionStore.GetCurrentUserAsync(cancellationToken) is null) return;

        var threads = await _api.GetSupportConversationsAsync(cancellationToken);
        _store.SetThreads(threads.ToList());
        _stories.Clear();
        _stories.AddRange(await _api.GetActiveStoriesAsync(cancellationToken));
        ThreadsChanged?.Invoke();
    }

    public async Task SelectConversationAsync(long remoteConversationId, CancellationToken cancellationToken = default)
    {
        var user = await _sessionStore.GetCurrentUserAsync(cancellationToken);
        if (user is null) return;

        if (_selectedConversationId is > 0 && _selectedConversationId != remoteConversationId)
            await _hub.LeaveConversationAsync(_selectedConversationId.Value, cancellationToken);

        _selectedConversationId = remoteConversationId;
        await _hub.JoinConversationAsync(remoteConversationId, cancellationToken);

        var detail = await _api.GetSupportConversationAsync(remoteConversationId, 30, null, cancellationToken);
        if (detail is null) return;

        var messages = detail.Messages.Select(m => new DesktopChatMessage(
            m.Id,
            remoteConversationId,
            m.Id,
            null,
            m.SenderUserId,
            m.SenderName,
            m.ContentHtml,
            m.SentAtUtc,
            m.IsMine,
            m.IsDeleted,
            false,
            null,
            m.EditedAtUtc,
            m.ReplyToMessageId,
            m.ReplyToSenderName,
            m.ReplyToContentPreview)).ToList();

        _store.SetMessages(remoteConversationId, messages);
        MessagesChanged?.Invoke(remoteConversationId);

        await _api.MarkSupportConversationReadAsync(remoteConversationId, cancellationToken);
        _store.ClearUnread(remoteConversationId);
        ThreadsChanged?.Invoke();

        var peerUserId = user.UserId == detail.StudentUserId ? detail.TeacherUserId : detail.StudentUserId;
        if (_watchedPeerUserId is > 0 && _watchedPeerUserId != peerUserId)
            await _hub.UnwatchUserPresenceAsync(_watchedPeerUserId.Value, cancellationToken);

        _watchedPeerUserId = peerUserId;
        await _hub.WatchUserPresenceAsync(peerUserId, cancellationToken);
        var online = await _api.GetUserPresenceOnlineAsync(peerUserId, cancellationToken);
        _presence[peerUserId] = online;
        PresenceChanged?.Invoke(peerUserId, online);
    }

    public async Task SendMessageAsync(long remoteConversationId, string text, CancellationToken cancellationToken = default)
    {
        var trimmed = text.Trim();
        if (trimmed.Length == 0) return;
        await SendHtmlMessageAsync(remoteConversationId, MessengerMemoryStore.ToContentHtml(trimmed), null, cancellationToken);
    }

    public async Task SendHtmlMessageAsync(
        long remoteConversationId,
        string contentHtml,
        long? replyToMessageId = null,
        CancellationToken cancellationToken = default)
    {
        var user = await _sessionStore.GetCurrentUserAsync(cancellationToken);
        if (user is null) return;

        var html = contentHtml?.Trim() ?? string.Empty;
        if (html.Length == 0) return;

        var clientMessageId = Guid.NewGuid().ToString("N");
        _store.AddPendingMessage(new DesktopChatMessage(
            0,
            remoteConversationId,
            null,
            clientMessageId,
            user.UserId,
            user.DisplayName,
            html,
            DateTime.UtcNow,
            true,
            false,
            true,
            null,
            null,
            replyToMessageId));
        MessagesChanged?.Invoke(remoteConversationId);

        var remoteId = await _api.SendSupportMessageAsync(
            remoteConversationId,
            html,
            replyToMessageId,
            clientMessageId,
            cancellationToken);
        if (remoteId is > 0)
        {
            _store.ConfirmPendingMessage(clientMessageId, remoteId.Value);
            MessagesChanged?.Invoke(remoteConversationId);
            return;
        }

        _store.FailPendingMessage(clientMessageId, "ارسال پیام ناموفق بود.");
        MessagesChanged?.Invoke(remoteConversationId);
    }

    public async Task UpdateMessageAsync(
        long remoteConversationId,
        long messageId,
        string contentHtml,
        CancellationToken cancellationToken = default)
    {
        var html = contentHtml?.Trim() ?? string.Empty;
        if (messageId <= 0 || html.Length == 0) return;

        var ok = await _api.UpdateSupportMessageAsync(remoteConversationId, messageId, html, cancellationToken);
        if (!ok) throw new InvalidOperationException("ویرایش پیام ناموفق بود.");

        _store.UpdateMessageContent(remoteConversationId, messageId, html);
        MessagesChanged?.Invoke(remoteConversationId);
        ThreadsChanged?.Invoke();
    }

    public async Task DeleteMessageAsync(
        long remoteConversationId,
        long messageId,
        CancellationToken cancellationToken = default)
    {
        if (messageId <= 0) return;

        var ok = await _api.DeleteSupportMessageAsync(remoteConversationId, messageId, cancellationToken);
        if (!ok) throw new InvalidOperationException("حذف پیام ناموفق بود.");

        _store.MarkMessageDeleted(remoteConversationId, messageId);
        MessagesChanged?.Invoke(remoteConversationId);
        ThreadsChanged?.Invoke();
    }

    public IReadOnlyList<DesktopTeacherStory> GetStories() => _stories;

    public bool IsPeerOnline(long peerUserId) =>
        _presence.TryGetValue(peerUserId, out var online) && online;

    public Task<IReadOnlyList<DesktopChatThread>> GetThreadsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<DesktopChatThread>>(_store.ListThreads());

    public Task<IReadOnlyList<DesktopChatMessage>> GetMessagesAsync(long remoteConversationId, CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<DesktopChatMessage>>(_store.ListMessages(remoteConversationId));

    private async void OnMessagePosted(JsonElement payload)
    {
        try
        {
            var user = await _sessionStore.GetCurrentUserAsync();
            if (user is null) return;

            var conversationId = ReadLong(payload, "conversationId");
            var messageId = ReadLong(payload, "messageId");
            if (conversationId <= 0 || messageId <= 0) return;

            _store.ApplyPostedMessage(
                conversationId,
                messageId,
                ReadLong(payload, "senderUserId"),
                ReadString(payload, "senderName"),
                ReadString(payload, "contentHtml"),
                MessengerMemoryStore.ParseUtc(ReadString(payload, "sentAtUtc")),
                user.UserId,
                ReadNullableLong(payload, "replyToMessageId"),
                ReadStringOrNull(payload, "replyToSenderName"),
                ReadStringOrNull(payload, "replyToContentPreview"));

            ThreadsChanged?.Invoke();
            MessagesChanged?.Invoke(conversationId);
        }
        catch
        {
            // ignore malformed hub payloads
        }
    }

    private void OnPresenceChanged(JsonElement payload)
    {
        var userId = ReadLong(payload, "userId");
        if (userId <= 0) return;

        var isOnline = payload.TryGetProperty("isOnline", out var camel)
            ? camel.GetBoolean()
            : payload.TryGetProperty("IsOnline", out var pascal) && pascal.GetBoolean();

        _presence[userId] = isOnline;
        PresenceChanged?.Invoke(userId, isOnline);
    }

    private Task SendHeartbeatAsync(bool isOnline, CancellationToken cancellationToken = default) =>
        _api.HeartbeatPresenceAsync(
            _hub.ConnectionId,
            "0.1.0",
            _settings.DeviceId,
            isOnline,
            cancellationToken);

    private static long ReadLong(JsonElement payload, string camelName)
    {
        if (payload.TryGetProperty(camelName, out var camel) && camel.TryGetInt64(out var v)) return v;
        var pascal = char.ToUpperInvariant(camelName[0]) + camelName[1..];
        if (payload.TryGetProperty(pascal, out var pascalProp) && pascalProp.TryGetInt64(out v)) return v;
        return 0;
    }

    private static long? ReadNullableLong(JsonElement payload, string camelName)
    {
        var value = ReadLong(payload, camelName);
        return value > 0 ? value : null;
    }

    private static string ReadString(JsonElement payload, string camelName)
    {
        if (payload.TryGetProperty(camelName, out var camel)) return camel.GetString() ?? string.Empty;
        var pascal = char.ToUpperInvariant(camelName[0]) + camelName[1..];
        if (payload.TryGetProperty(pascal, out var pascalProp)) return pascalProp.GetString() ?? string.Empty;
        return string.Empty;
    }

    private static string? ReadStringOrNull(JsonElement payload, string camelName)
    {
        var value = ReadString(payload, camelName);
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public async ValueTask DisposeAsync()
    {
        await StopAsync();
        await _hub.DisposeAsync();
    }
}
