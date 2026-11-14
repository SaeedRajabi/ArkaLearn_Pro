using System.Windows;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.App.ViewModels;
using ArkaLearnDesktop.App.Views.Auth;
using ArkaLearnDesktop.App.Views.Security;
using ArkaLearnDesktop.App.Views.Shell;
using ArkaLearnDesktop.App.Views.Updates;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaLearnDesktop.App.Services;

public sealed class DesktopNavigationService : IDesktopNavigationService
{
    private readonly IServiceProvider _services;
    private readonly IScreenCaptureGuard _captureGuard;
    private MainWindow? _window;
    private ShellView? _shell;
    private ScreenCaptureBlockedViewModel? _blockedVm;

    public DesktopNavigationService(IServiceProvider services, IScreenCaptureGuard captureGuard)
    {
        _services = services;
        _captureGuard = captureGuard;
    }

    public void Attach(MainWindow window) => _window = window;

    public void NavigateToLogin(string? errorMessage = null)
    {
        EnsureWindow();
        ClearBlockedState();
        _shell = null;
        var vm = _services.GetRequiredService<LoginViewModel>();
        if (!string.IsNullOrWhiteSpace(errorMessage))
            vm.SetInitialError(errorMessage);
        _window!.SetContent(new LoginView { DataContext = vm });
    }

    public void NavigateToShell(string? startPageTag = null)
    {
        EnsureWindow();
        ClearBlockedState();
        _shell = _services.GetRequiredService<ShellView>();
        _shell.SetStartPage(startPageTag);
        _window!.SetContent(_shell);
    }

    public void NavigateShellPage(string pageTag)
    {
        EnsureWindow();
        if (_shell is null)
        {
            NavigateToShell(pageTag);
            return;
        }

        _services.GetService<IDesktopTrayService>()?.ShowMainWindow();
        _shell.NavigateTo(pageTag);
    }

    public void OpenRemoteAssist()
    {
        EnsureWindow();
        _services.GetService<IDesktopTrayService>()?.ShowMainWindow();

        if (_shell is not null)
        {
            _shell.NavigateTo("RemoteAssist");
            return;
        }

        NavigateToShell("RemoteAssist");
    }

    public void HideShellSidebar() => _shell?.HideSidebarForImmersive();

    public void RestoreShellSidebar() => _shell?.RestoreSidebarAfterImmersive();

    public void NavigateToMandatoryUpdate(AppUpdateCheckResult update)
    {
        EnsureWindow();
        ClearBlockedState();
        _shell = null;
        var vm = new MandatoryUpdateViewModel(update);
        _window!.SetContent(new MandatoryUpdateView { DataContext = vm });
    }

    public void NavigateToScreenCaptureBlocked(IReadOnlyList<ScreenCaptureThreat> threats, Action onCleared)
    {
        EnsureWindow();
        _shell = null;
        _blockedVm?.Stop();
        _captureGuard.SetBlockedUiVisible(true);

        void Resume()
        {
            ClearBlockedState();
            onCleared();
        }

        _blockedVm = new ScreenCaptureBlockedViewModel(_captureGuard, threats, Resume);
        _window!.SetContent(new ScreenCaptureBlockedView { DataContext = _blockedVm });
    }

    private void ClearBlockedState()
    {
        _blockedVm?.Stop();
        _blockedVm = null;
        _captureGuard.SetBlockedUiVisible(false);
    }

    private void EnsureWindow()
    {
        if (_window is not null) return;
        _window = _services.GetRequiredService<MainWindow>();
        _window.Show();
    }
}
