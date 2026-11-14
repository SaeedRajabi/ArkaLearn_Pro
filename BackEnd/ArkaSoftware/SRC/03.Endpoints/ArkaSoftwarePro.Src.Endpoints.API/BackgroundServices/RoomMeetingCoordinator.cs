using System.Collections.Concurrent;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;

/// <summary>Serializes room transitions and grants disconnected hosts a bounded reconnect window.</summary>
public sealed class RoomMeetingCoordinator(IServiceScopeFactory scopeFactory, TimeProvider clock,
    ILogger<RoomMeetingCoordinator> logger) : BackgroundService
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _gates = new();
    private readonly ConcurrentDictionary<string, DateTimeOffset> _hostDeadlines = new();
    public TimeSpan ReconnectWindow { get; init; } = TimeSpan.FromSeconds(30);

    public async Task<IDisposable> EnterAsync(string roomId, CancellationToken cancellationToken = default)
    {
        var gate = _gates.GetOrAdd(roomId, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        return new Releaser(gate);
    }
    public void ScheduleHostDeparture(string roomId) => _hostDeadlines[roomId] = clock.GetUtcNow() + ReconnectWindow;
    public void CancelHostDeparture(string roomId) => _hostDeadlines.TryRemove(roomId, out _);

    public async Task ProcessDueDeparturesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var (roomId, deadline) in _hostDeadlines.ToArray())
        {
            if (clock.GetUtcNow() < deadline) continue;
            using var gate = await EnterAsync(roomId, cancellationToken);
            if (!_hostDeadlines.TryGetValue(roomId, out var current) || current != deadline) continue;
            if (MeetingHub.HasActiveHost(roomId) || !long.TryParse(roomId, out var id))
            {
                _hostDeadlines.TryRemove(roomId, out _);
                continue;
            }
            using var scope = scopeFactory.CreateScope();
            await scope.ServiceProvider.GetRequiredService<IMeetingLifecycleService>()
                .EndRoomMeetingAsync(id, "teacher_disconnected", cancellationToken);
            _hostDeadlines.TryRemove(roomId, out _);
        }
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await ProcessDueDeparturesAsync(stoppingToken); }
            catch (Exception ex) when (ex is not OperationCanceledException) { logger.LogError(ex, "Could not process disconnected room hosts."); }
        }
    }
    private sealed class Releaser(SemaphoreSlim gate) : IDisposable
    {
        private SemaphoreSlim? _gate = gate;
        public void Dispose() => Interlocked.Exchange(ref _gate, null)?.Release();
    }
}
