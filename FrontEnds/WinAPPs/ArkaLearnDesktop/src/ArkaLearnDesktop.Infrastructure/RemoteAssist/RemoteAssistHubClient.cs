using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;
using Microsoft.AspNetCore.SignalR.Client;

namespace ArkaLearnDesktop.Infrastructure.RemoteAssist;

public sealed class RemoteAssistHubClient : IAsyncDisposable
{
    private readonly IAuthSessionStore _sessionStore;
    private readonly IDesktopLocalSettings _settings;
    private HubConnection? _connection;
    private readonly Dictionary<string, List<Action<JsonElement>>> _handlers = new(StringComparer.Ordinal);
    private long? _lastUserId;
    private long? _lastSessionId;
    private bool _joinedTeacherPool;

    public RemoteAssistHubClient(IAuthSessionStore sessionStore, IDesktopLocalSettings settings)
    {
        _sessionStore = sessionStore;
        _settings = settings;
    }

    public bool IsConnected => _connection?.State == HubConnectionState.Connected;
    public string? ConnectionId => _connection?.ConnectionId;
    public event Action<string?>? Reconnected;

    public async Task ConnectAsync(CancellationToken cancellationToken = default)
    {
        if (_connection?.State == HubConnectionState.Connected) return;

        var hubUrl = ResolveHubUrl();
        _connection = new HubConnectionBuilder()
            .WithUrl(hubUrl, options =>
            {
                options.AccessTokenProvider = async () =>
                    await _sessionStore.GetAccessTokenAsync() ?? string.Empty;
            })
            .WithAutomaticReconnect()
            .Build();

        _connection.Reconnected += async connectionId =>
        {
            await RejoinGroupsAsync();
            Reconnected?.Invoke(connectionId);
        };
        RegisterBuiltInHandlers();
        await _connection.StartAsync(cancellationToken);
    }

    public async Task DisconnectAsync(CancellationToken cancellationToken = default)
    {
        if (_connection is null) return;
        await _connection.StopAsync(cancellationToken);
        await _connection.DisposeAsync();
        _connection = null;
        _wiredEvents.Clear();
        _lastUserId = null;
        _lastSessionId = null;
        _joinedTeacherPool = false;
    }

    public async Task JoinUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        _lastUserId = userId;
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("JoinUser", userId, cancellationToken);
    }

    public async Task JoinTeacherPoolAsync(CancellationToken cancellationToken = default)
    {
        _joinedTeacherPool = true;
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("JoinTeacherPool", cancellationToken);
    }

    public async Task JoinSessionAsync(long sessionId, CancellationToken cancellationToken = default)
    {
        _lastSessionId = sessionId;
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("JoinSession", sessionId, cancellationToken);
    }

    public async Task LeaveSessionAsync(long sessionId, CancellationToken cancellationToken = default)
    {
        if (_lastSessionId == sessionId)
            _lastSessionId = null;
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("LeaveSession", sessionId, cancellationToken);
    }

    public async Task PushScreenFrameAsync(long sessionId, string jpegBase64, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("PushScreenFrame", sessionId, jpegBase64, cancellationToken);
    }

    public async Task RelayInputAsync(long sessionId, string payloadJson, CancellationToken cancellationToken = default)
    {
        if (_connection?.State != HubConnectionState.Connected) return;
        await _connection.InvokeAsync("RelayInput", sessionId, payloadJson, cancellationToken);
    }

    public void On(string eventName, Action<JsonElement> handler)
    {
        if (!_handlers.TryGetValue(eventName, out var list))
        {
            list = [];
            _handlers[eventName] = list;
        }

        list.Add(handler);
        EnsureHubEventWired(eventName);
    }

    private void RegisterBuiltInHandlers()
    {
        if (_connection is null) return;

        foreach (var eventName in new[]
                 {
                     "SessionChanged",
                     "ScreenFrame",
                     "InputRelay",
                     "ConsentRequired",
                     "ConsentResolved",
                 })
        {
            EnsureHubEventWired(eventName);
        }
    }

    private void EnsureHubEventWired(string eventName)
    {
        if (_connection is null) return;
        if (_wiredEvents.Contains(eventName)) return;

        _wiredEvents.Add(eventName);
        _connection.On<JsonElement>(eventName, payload =>
        {
            if (!_handlers.TryGetValue(eventName, out var list)) return;
            foreach (var handler in list.ToArray())
                handler(payload);
        });
    }

    private readonly HashSet<string> _wiredEvents = new(StringComparer.Ordinal);

    private async Task RejoinGroupsAsync()
    {
        var connection = _connection;
        if (connection?.State != HubConnectionState.Connected) return;

        if (_lastUserId is > 0)
            await connection.InvokeAsync("JoinUser", _lastUserId.Value);
        if (_lastSessionId is > 0)
            await connection.InvokeAsync("JoinSession", _lastSessionId.Value);
        if (_joinedTeacherPool)
            await connection.InvokeAsync("JoinTeacherPool");
    }

    private string ResolveHubUrl()
    {
        var uri = new Uri(_settings.ApiBaseUrl.TrimEnd('/') + "/");
        return uri.GetLeftPart(UriPartial.Authority) + "/hubs/remote-assist";
    }

    public async ValueTask DisposeAsync() => await DisconnectAsync();
}
