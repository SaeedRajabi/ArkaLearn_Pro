using ArkaLearnDesktop.App.Security;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.App.ViewModels;
using ArkaLearnDesktop.App.Views.Shell;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Application.DI;
using ArkaLearnDesktop.Application.Updates.Queries;
using ArkaLearnDesktop.Infrastructure.DI;
using ArkaLearnDesktop.Infrastructure.Drm;
using ArkaLearnDesktop.Infrastructure.Local;
using ArkaLearnDesktop.Infrastructure.Tray;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;
using System.Globalization;
using System.Reflection;
using System.Windows;

namespace ArkaLearnDesktop.App;

public partial class App : System.Windows.Application
{
    /// <summary>
    /// Display/API version from the executing assembly (InformationalVersion / FileVersion / AssemblyVersion).
    /// Bump only <c>Version</c> / <c>FileVersion</c> / <c>AssemblyVersion</c> in the csproj on publish.
    /// </summary>
    public static string AppVersion { get; } = ResolveAppVersion();

    private const string SingleInstanceMutexName = @"Local\ArkaLearnDesktop.SingleInstance.v1";
    private const string ActivateEventName = @"Local\ArkaLearnDesktop.Activate.v1";

    private ServiceProvider? _services;
    private int _bootstrapGate;
    private Mutex? _instanceMutex;
    private EventWaitHandle? _activateEvent;
    private CancellationTokenSource? _activateWatchCts;

    protected override async void OnStartup(StartupEventArgs e)
    {
        ConfigurePersianCulture();
        ShutdownMode = ShutdownMode.OnExplicitShutdown;

        _instanceMutex = new Mutex(true, SingleInstanceMutexName, out var createdNew);
        if (!createdNew)
        {
            try
            {
                using var activate = EventWaitHandle.OpenExisting(ActivateEventName);
                activate.Set();
            }
            catch
            {
                // ignore — existing instance may still be starting
            }

            Shutdown();
            return;
        }

        try
        {
            _activateEvent = new EventWaitHandle(false, EventResetMode.AutoReset, ActivateEventName);
        }
        catch
        {
            _activateEvent = null;
        }

        base.OnStartup(e);

        var services = new ServiceCollection();
        services.AddArkaLearnDesktopApplication();
        services.AddArkaLearnDesktopInfrastructure();
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(PlayEncryptedMediaCommandHandler).Assembly));
        services.AddSingleton<ScreenCaptureGuard>();
        services.AddSingleton<IScreenCaptureGuard>(sp => sp.GetRequiredService<ScreenCaptureGuard>());
        services.AddSingleton<DesktopNavigationService>();
        services.AddSingleton<IDesktopNavigationService>(sp => sp.GetRequiredService<DesktopNavigationService>());
        services.AddSingleton<RemoteAssistPresenceService>();
        services.AddSingleton<DesktopThemeService>();
        services.AddSingleton<IDesktopThemeService>(sp => sp.GetRequiredService<DesktopThemeService>());
        services.AddSingleton<ICourseManagementContext, CourseManagementContext>();
        services.AddTransient<LoginViewModel>();
        services.AddTransient<PlayerViewModel>();
        services.AddTransient<MessengerViewModel>();
        services.AddTransient<SettingsViewModel>();
        services.AddTransient<DownloadsViewModel>();
        services.AddTransient<ExamsViewModel>();
        services.AddTransient<AboutViewModel>();
        services.AddTransient<CoursesViewModel>();
        services.AddTransient<StudentsViewModel>();
        services.AddTransient<TeachersViewModel>();
        services.AddTransient<OnlineUsersViewModel>();
        services.AddSingleton<RemoteAssistViewModel>();
        services.AddTransient<ShellView>();
        services.AddSingleton<MainWindow>();

        _services = services.BuildServiceProvider();

        await _services.InitializeDesktopPersistenceAsync();
        _services.GetRequiredService<IDesktopThemeService>().ApplyFromSettings();

        var startedFromWindows =
            e.Args.Any(a => string.Equals(a, WindowsStartupService.AutostartArg, StringComparison.OrdinalIgnoreCase));

        var nav = _services.GetRequiredService<DesktopNavigationService>();
        var window = _services.GetRequiredService<MainWindow>();
        var tray = _services.GetRequiredService<DesktopTrayService>();
        nav.Attach(window);
        tray.Attach(window, () => nav.OpenRemoteAssist());
        StartActivateWatcher(tray);
        window.Show();
        if (startedFromWindows)
            tray.HideToTray(balloon: false);

        var guard = _services.GetRequiredService<IScreenCaptureGuard>();
        guard.StartMonitoring(threats =>
        {
            window.Dispatcher.Invoke(() =>
            {
                nav.NavigateToScreenCaptureBlocked(threats, () =>
                {
                    _ = ResumeAfterThreatClearedAsync(nav);
                });
            });
        });

        var initialThreats = guard.Scan();
        if (initialThreats.Count > 0)
        {
            nav.NavigateToScreenCaptureBlocked(initialThreats, () =>
            {
                _ = BootstrapAsync(nav);
            });
            return;
        }

        await BootstrapAsync(nav);
    }

    private async Task ResumeAfterThreatClearedAsync(IDesktopNavigationService nav)
    {
        var sp = _services ?? throw new InvalidOperationException("DI container is not initialized.");
        try
        {
            var session = sp.GetRequiredService<IAuthSessionStore>();
            if (await session.HasValidSessionAsync())
            {
                nav.NavigateToShell();
                await StartPresenceAsync();
                return;
            }
        }
        catch
        {
            // fall through to bootstrap
        }

        await BootstrapAsync(nav);
    }

    private async Task BootstrapAsync(IDesktopNavigationService nav)
    {
        if (Interlocked.Exchange(ref _bootstrapGate, 1) == 1)
            return;

        try
        {
            var sp = _services ?? throw new InvalidOperationException("DI container is not initialized.");

            var guard = sp.GetRequiredService<IScreenCaptureGuard>();
            var threats = guard.Scan();
            if (threats.Count > 0)
            {
                nav.NavigateToScreenCaptureBlocked(threats, () =>
                {
                    Interlocked.Exchange(ref _bootstrapGate, 0);
                    _ = BootstrapAsync(nav);
                });
                return;
            }

            try
            {
                var mediator = sp.GetRequiredService<IMediator>();
                var update = await mediator.Send(new CheckAppUpdateQuery(AppVersion));
                if (update.IsMandatory)
                {
                    nav.NavigateToMandatoryUpdate(update);
                    return;
                }

                var session = sp.GetRequiredService<IAuthSessionStore>();
                var api = sp.GetRequiredService<IDesktopApiClient>();

                if (await session.HasValidSessionAsync())
                {
                    var check = await api.EnsureSessionAsync();
                    if (check.Status == DesktopSessionCheckStatus.Valid ||
                        check.Status == DesktopSessionCheckStatus.Offline)
                    {
                        try
                        {
                            var access = await api.RegisterDesktopDeviceAsync(AppVersion);
                            if (!access.IsAllowed)
                            {
                                await session.ClearAsync();
                                nav.NavigateToLogin(access.BlockReason ?? "دسترسی شما به اپلیکیشن دسکتاپ مسدود شده است.");
                                return;
                            }
                        }
                        catch
                        {
                            // Device registration is best-effort when offline; shell still opens with cached session.
                            if (check.Status == DesktopSessionCheckStatus.Valid)
                                throw;
                        }

                        nav.NavigateToShell();
                        await StartPresenceAsync();
                        return;
                    }

                    await session.ClearAsync();
                }

                nav.NavigateToLogin();
            }
            catch
            {
                // Prefer restoring a cached session over forcing login when bootstrap hits a transient error.
                try
                {
                    var session = sp.GetRequiredService<IAuthSessionStore>();
                    if (await session.HasValidSessionAsync())
                    {
                        nav.NavigateToShell();
                        await StartPresenceAsync();
                        return;
                    }
                }
                catch
                {
                    // fall through
                }

                nav.NavigateToLogin();
            }
        }
        finally
        {
            Interlocked.Exchange(ref _bootstrapGate, 0);
        }
    }

    public static async Task StartPresenceAsync()
    {
        if (Current is not App app || app._services is null) return;
        try
        {
            await app._services.GetRequiredService<RemoteAssistPresenceService>().StartAsync();
        }
        catch
        {
            // Presence is best-effort; UI remains usable.
        }
    }

    public static async Task StopPresenceAsync()
    {
        if (Current is not App app || app._services is null) return;
        try
        {
            await app._services.GetRequiredService<RemoteAssistPresenceService>().StopAsync();
        }
        catch
        {
            // ignore
        }
    }

    private static void ConfigurePersianCulture()
    {
        var culture = new CultureInfo("fa-IR");
        CultureInfo.DefaultThreadCurrentCulture = culture;
        CultureInfo.DefaultThreadCurrentUICulture = culture;
        Thread.CurrentThread.CurrentCulture = culture;
        Thread.CurrentThread.CurrentUICulture = culture;
    }

    private static string ResolveAppVersion()
    {
        var asm = Assembly.GetExecutingAssembly();

        var informational = asm
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion;
        if (!string.IsNullOrWhiteSpace(informational))
        {
            var plus = informational.IndexOf('+');
            var cleaned = (plus >= 0 ? informational[..plus] : informational).Trim();
            if (!string.IsNullOrWhiteSpace(cleaned))
                return cleaned;
        }

        try
        {
            var fileVersion = FileVersionInfo.GetVersionInfo(asm.Location).FileVersion;
            if (!string.IsNullOrWhiteSpace(fileVersion))
                return fileVersion.Trim();
        }
        catch
        {
            /* ignore */
        }

        var asmVersion = asm.GetName().Version;
        if (asmVersion is not null)
            return $"{asmVersion.Major}.{asmVersion.Minor}.{Math.Max(asmVersion.Build, 0)}";

        return "0.0.0";
    }

    private void StartActivateWatcher(IDesktopTrayService tray)
    {
        if (_activateEvent is null) return;
        _activateWatchCts = new CancellationTokenSource();
        var token = _activateWatchCts.Token;
        var handle = _activateEvent;
        _ = Task.Run(() =>
        {
            while (!token.IsCancellationRequested)
            {
                try
                {
                    if (!handle.WaitOne(500))
                        continue;
                    Dispatcher.Invoke(() => tray.ShowMainWindow());
                }
                catch
                {
                    break;
                }
            }
        }, token);
    }

    protected override async void OnExit(ExitEventArgs e)
    {
        try
        {
            _activateWatchCts?.Cancel();
            _activateWatchCts?.Dispose();
            _activateEvent?.Dispose();
            await StopPresenceAsync();
            _services?.GetService<IDesktopTrayService>()?.Dispose();
            _services?.GetService<IScreenCaptureGuard>()?.StopMonitoring();
            (_services?.GetService<ScreenCaptureGuard>() as IDisposable)?.Dispose();
        }
        catch
        {
            // ignore
        }

        try
        {
            _instanceMutex?.ReleaseMutex();
            _instanceMutex?.Dispose();
        }
        catch
        {
            // ignore
        }

        if (_services is not null)
            await _services.DisposeAsync();
        base.OnExit(e);
    }
}
