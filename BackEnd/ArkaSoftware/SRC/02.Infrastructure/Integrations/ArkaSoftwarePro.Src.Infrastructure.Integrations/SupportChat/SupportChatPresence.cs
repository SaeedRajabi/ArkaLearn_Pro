using System.Collections.Concurrent;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;

public sealed class SupportChatPresence : ISupportChatPresence
{
    private readonly ConcurrentDictionary<string, long> _connectionToUser = new();
    private readonly ConcurrentDictionary<long, ConcurrentDictionary<string, byte>> _userConnections = new();

    public void Register(long userId, string connectionId)
    {
        if (userId <= 0 || string.IsNullOrWhiteSpace(connectionId))
            return;

        _connectionToUser[connectionId] = userId;
        _userConnections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, byte>()).TryAdd(connectionId, 0);
    }

    public long? Unregister(string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            return null;

        if (!_connectionToUser.TryRemove(connectionId, out var userId))
            return null;

        if (_userConnections.TryGetValue(userId, out var connections))
        {
            connections.TryRemove(connectionId, out _);
            if (connections.IsEmpty)
                _userConnections.TryRemove(userId, out _);
        }

        return userId;
    }

    public bool IsOnline(long userId)
    {
        return userId > 0
               && _userConnections.TryGetValue(userId, out var connections)
               && !connections.IsEmpty;
    }
}
