using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;
using Microsoft.AspNetCore.SignalR.Client;

namespace ArkaLearnDesktop.Infrastructure.Messenger;

public sealed class SupportChatHubClient : IAsyncDisposable
{
    private readonly IAuthSessionStore _sessionStore;
    private readonly IDesktopLocalSettings _settings;
    private HubConnection? _connection;
    private readonly Dictionary<string, List<Action<JsonElement>>> _handlers = new(StringComparer.Ordinal);

    public SupportChatHubClient(IAuthSessionStore sessionStore, IDesktopLocalSettings settings)
    {
        _sessionStore = sessionStore;
        _settings = settings;
    }

    public bool IsConnected => _connection?.State == HubConnectionState.Connected;

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (_connection?.State == HubConnectionState.Connected) return;

        var hubUrl = ResolveHubUrl();
        _connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.AccessTokenProvider = async () =>
                    await _sessionStore.GetAccessTokenAsync(cancellationToken) ?? string.Empty;
            })
            .WithAutomaticReconnect()
            .Build();

        RegisterBuiltInHandlers();
        await _connection.StartAsync(cancellationToken);
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_connection is null) return;
        await _connection.StopAsync(cancellationToken);
        await _connection.DisposeAsync();
        _connection = null;
    }

    public async Task JoinUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("JoinUser", userId, cancellationToken);
    }

    public async Task JoinConversationAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("JoinConversation", conversationId, cancellationToken);
    }

    public async Task LeaveConversationAsync(long conversationId, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("LeaveConversation", conversationId, cancellationToken);
    }

    public async Task WatchUserPresenceAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("WatchUserPresence", userId, cancellationToken);
    }

    public async Task UnwatchUserPresenceAsync(long userId, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("UnwatchUserPresence", userId, cancellationToken);
    }

    public void On(string eventName, Action<JsonElement> handler)
    {
        if (!_handlers.TryGetValue(eventName, out var list))
        {
            list = [];
            _handlers[eventName] = list;
        }

        list.Add(handler);
    }

    public string? ConnectionId => _connection?.ConnectionId;

    private void RegisterBuiltInHandlers()
    {
        if (_connection is null) return;

        foreach (var eventName in new[]
        {
            "MessagePosted", "MessageUpdated", "MessageDeleted",
            "ConversationOpened", "ConversationUpdated", "ConversationDeleted",
            "ConversationStatusChanged", "MessagesDelivered", "MessagesRead",
            "NotificationPulse", "UserPresenceChanged",
        })
        {
            _connection.On<JsonElement>(eventName, payload =>
            {
                if (!_handlers.TryGetValue(eventName, out var list)) return;
                foreach (var handler in list)
                    handler(payload);
            });
        }
    }

    private string ResolveHubUrl()
    {
        var uri = new Uri(_settings.ApiBaseUrl.TrimEnd('/') + "/");
        return uri.GetLeftPart(UriPartial.Authority) + "/hubs/support-chat";
    }

    public async ValueTask DisposeAsync() => await DisconnectAsync();
}
