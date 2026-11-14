using System.Text.Json;
using ArkaLearnDesktop.App.ViewModels;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Infrastructure.RemoteAssist;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaLearnDesktop.App.Services;

/// <summary>
/// Keeps the Remote Assist hub connected in the background so consent/accept
/// can surface even when the main window is hidden in the tray.
/// </summary>
public sealed class RemoteAssistPresenceService : IAsyncDisposable
{
    private readonly IServiceProvider _services;
    private readonly IDesktopApiClient _api;
    private readonly IAuthSessionStore _sessionStore;
    private readonly IDesktopLocalSettings _settings;
    private readonly RemoteAssistHubClient _hub;
    private readonly IDesktopTrayService _tray;
    private readonly IDesktopNavigationService _navigation;
    private int _started;
    private bool _consentHandlerRegistered;
    private CancellationTokenSource? _heartbeatCancellation;
    private Task? _heartbeatTask;

    public RemoteAssistPresenceService(
        IServiceProvider services,
        IDesktopApiClient api,
        IAuthSessionStore sessionStore,
        IDesktopLocalSettings settings,
        RemoteAssistHubClient hub,
        IDesktopTrayService tray,
        IDesktopNavigationService navigation)
    {
        _services = services;
        _api = api;
        _sessionStore = sessionStore;
        _settings = settings;
        _hub = hub;
        _tray = tray;
        _navigation = navigation;
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (Interlocked.Exchange(ref _started, 1) == 1)
        {
            await WarmUpViewModelAsync(cancellationToken);
            return;
        }

        EnsureConsentHandler();
        await WarmUpViewModelAsync(cancellationToken);
        _heartbeatCancellation = new CancellationTokenSource();
        _heartbeatTask = RunHeartbeatLoopAsync(_heartbeatCancellation.Token);
    }

    public async Task StopAsync()
    {
        Interlocked.Exchange(ref _started, 0);
        var heartbeatCancellation = _heartbeatCancellation;
        var heartbeatTask = _heartbeatTask;
        _heartbeatCancellation = null;
        _heartbeatTask = null;
        heartbeatCancellation?.Cancel();
        if (heartbeatTask is not null)
        {
            try
            {
                await heartbeatTask;
            }
            catch (OperationCanceledException)
            {
                // expected during shutdown
            }
        }
        heartbeatCancellation?.Dispose();

        try
        {
            await SendPresenceAsync(isOnline: false);
        }
        catch
        {
            // best effort during shutdown
        }

        try
        {
            var vm = _services.GetService<RemoteAssistViewModel>();
            if (vm is not null)
                await vm.DisposeAsync();
        }
        catch
        {
            // ignore
        }

        try
        {
            await _hub.DisconnectAsync();
        }
        catch
        {
            // ignore
        }
    }

    private async Task WarmUpViewModelAsync(CancellationToken cancellationToken)
    {
        if (!await _sessionStore.HasValidSessionAsync(cancellationToken))
            return;

        var vm = _services.GetRequiredService<RemoteAssistViewModel>();
        await vm.PrepareAsync(cancellationToken);
    }

    private async Task RunHeartbeatLoopAsync(CancellationToken cancellationToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(25));
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                if (Volatile.Read(ref _started) == 1
                    && await _sessionStore.HasValidSessionAsync(cancellationToken))
                {
                    await SendPresenceAsync(isOnline: true, cancellationToken);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                break;
            }
            catch
            {
                // A later heartbeat will retry transient failures.
            }

            if (!await timer.WaitForNextTickAsync(cancellationToken))
                break;
        }
    }

    private Task SendPresenceAsync(bool isOnline, CancellationToken cancellationToken = default) =>
        _api.HeartbeatPresenceAsync(
            _hub.ConnectionId,
            App.AppVersion,
            _settings.DeviceId,
            isOnline,
            cancellationToken);

    private void EnsureConsentHandler()
    {
        if (_consentHandlerRegistered) return;
        _consentHandlerRegistered = true;

        _hub.On("ConsentRequired", OnConsentRequired);
    }

    private void OnConsentRequired(JsonElement _)
    {
        var app = System.Windows.Application.Current;
        if (app is null) return;

        app.Dispatcher.BeginInvoke(() =>
        {
            _tray.ShowMainWindow();
            _navigation.OpenRemoteAssist();
        });
    }

    public async ValueTask DisposeAsync() => await StopAsync();
}
