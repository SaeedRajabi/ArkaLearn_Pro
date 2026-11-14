using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class ScreenCaptureBlockedViewModel : INotifyPropertyChanged
{
    private readonly IScreenCaptureGuard _guard;
    private readonly Action _onCleared;
    private readonly DispatcherTimer _refreshTimer;
    private string? _statusMessage;
    private bool _isBusy;

    public ScreenCaptureBlockedViewModel(
        IScreenCaptureGuard guard,
        IReadOnlyList<ScreenCaptureThreat> initialThreats,
        Action onCleared)
    {
        _guard = guard;
        _onCleared = onCleared;
        Threats = new ObservableCollection<ThreatRow>(initialThreats.Select(ThreatRow.From));
        RefreshThreatSummary();

        CloseAndContinueCommand = new AsyncRelayCommand(CloseAndContinueAsync, () => !IsBusy && Threats.Count > 0);
        RecheckCommand = new AsyncRelayCommand(RecheckAsync, () => !IsBusy);
        ExitCommand = new RelayCommand(ExitApp, () => !IsBusy);

        _refreshTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2) };
        _refreshTimer.Tick += async (_, _) => await RecheckAsync(silent: true);
        _refreshTimer.Start();
    }

    public ObservableCollection<ThreatRow> Threats { get; }

    public string Title => "دسترسی به برنامه مسدود شد";

    public string PolicyMessage =>
        "به‌دلیل نقض قوانین تولید محتوا در آرکا نرم‌افزار، تا زمانی که نرم‌افزارهای فیلم‌برداری از دسکتاپ یا کنترل از راه دور روی این سیستم فعال باشند، نمی‌توانید از برنامه استفاده کنید.";

    public string AppsHeading => Threats.Count <= 1
        ? "نرم‌افزار شناسایی‌شده:"
        : "نرم‌افزارهای شناسایی‌شده:";

    public string? StatusMessage
    {
        get => _statusMessage;
        private set => Set(ref _statusMessage, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!Set(ref _isBusy, value)) return;
            ((AsyncRelayCommand)CloseAndContinueCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)RecheckCommand).RaiseCanExecuteChanged();
            ((RelayCommand)ExitCommand).RaiseCanExecuteChanged();
        }
    }

    public ICommand CloseAndContinueCommand { get; }
    public ICommand RecheckCommand { get; }
    public ICommand ExitCommand { get; }

    public void Stop() => _refreshTimer.Stop();

    private async Task CloseAndContinueAsync()
    {
        IsBusy = true;
        StatusMessage = "در حال بستن نرم‌افزارهای شناسایی‌شده...";
        try
        {
            var result = await _guard.CloseThreatsAsync();
            ApplyThreats(result.Remaining);

            if (result.Errors.Count > 0)
                StatusMessage = string.Join("\n", result.Errors);

            if (result.AllClosed)
            {
                StatusMessage = "نرم‌افزارها بسته شدند. در حال ورود به برنامه...";
                Stop();
                _onCleared();
                return;
            }

            StatusMessage = result.Errors.Count > 0
                ? "برخی نرم‌افزارها بسته نشدند. آن‌ها را دستی ببندید و «بررسی مجدد» را بزنید."
                : "هنوز نرم‌افزاری فعال است. لطفاً آن را ببندید و دوباره بررسی کنید.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
            ApplyThreats(_guard.Scan());
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task RecheckAsync() => await RecheckAsync(silent: false);

    private async Task RecheckAsync(bool silent)
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            if (!silent)
                StatusMessage = "در حال بررسی مجدد...";

            await Task.Yield();
            var threats = _guard.Scan();
            ApplyThreats(threats);

            if (threats.Count == 0)
            {
                StatusMessage = "موردی یافت نشد. در حال ورود به برنامه...";
                Stop();
                _onCleared();
                return;
            }

            if (!silent)
                StatusMessage = $"{DistinctAppCount(threats)} نرم‌افزار مانع هنوز فعال است.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    private void ApplyThreats(IReadOnlyList<ScreenCaptureThreat> threats)
    {
        Threats.Clear();
        foreach (var t in threats)
            Threats.Add(ThreatRow.From(t));

        RefreshThreatSummary();
        OnPropertyChanged(nameof(AppsHeading));
        ((AsyncRelayCommand)CloseAndContinueCommand).RaiseCanExecuteChanged();
    }

    private void RefreshThreatSummary()
    {
        // no-op placeholder for future binding helpers
    }

    private static int DistinctAppCount(IEnumerable<ScreenCaptureThreat> threats) =>
        threats.Select(t => t.DisplayName).Distinct(StringComparer.OrdinalIgnoreCase).Count();

    private static void ExitApp() => System.Windows.Application.Current.Shutdown();

    public event PropertyChangedEventHandler? PropertyChanged;

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        return true;
    }

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

public sealed class ThreatRow
{
    public required string DisplayName { get; init; }
    public required string ProcessLabel { get; init; }

    public static ThreatRow From(ScreenCaptureThreat threat) => new()
    {
        DisplayName = threat.DisplayName,
        ProcessLabel = $"{threat.ProcessName}.exe  (PID {threat.ProcessId})",
    };
}
