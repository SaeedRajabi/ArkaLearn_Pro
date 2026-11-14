using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ArkaLearnDesktop.App.Localization;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class SettingsViewModel : INotifyPropertyChanged, IPageReady
{
    private readonly IDesktopLocalSettings _settings;
    private readonly IAuthSessionStore _sessionStore;
    private readonly IDesktopNavigationService _navigation;
    private readonly IDesktopThemeService _themeService;
    private readonly IDesktopApiClient _api;
    private string _apiBaseUrl = string.Empty;
    private string? _statusMessage;
    private string? _userDisplayName;
    private string? _userRole;
    private bool _isBusy;
    private bool _canEditApiBaseUrl;
    private bool _suppressThemeApply;
    private bool _suppressStartupApply;
    private bool _startWithWindows;
    private DesktopThemePreference _themePreference = DesktopThemePreference.System;

    public SettingsViewModel(
        IDesktopLocalSettings settings,
        IAuthSessionStore sessionStore,
        IDesktopNavigationService navigation,
        IDesktopThemeService themeService,
        IDesktopApiClient api)
    {
        _settings = settings;
        _sessionStore = sessionStore;
        _navigation = navigation;
        _themeService = themeService;
        _api = api;
        SaveCommand = new AsyncRelayCommand(SaveAsync, () => !IsBusy && CanEditApiBaseUrl && !string.IsNullOrWhiteSpace(ApiBaseUrl));
        LogoutCommand = new AsyncRelayCommand(LogoutAsync, () => !IsBusy);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public string ApiBaseUrl
    {
        get => _apiBaseUrl;
        set
        {
            if (Set(ref _apiBaseUrl, value))
                ((AsyncRelayCommand)SaveCommand).RaiseCanExecuteChanged();
        }
    }

    public string DeviceId => _settings.DeviceId;

    public string AppVersion => App.AppVersion;

    public string? UserDisplayName
    {
        get => _userDisplayName;
        private set => Set(ref _userDisplayName, value);
    }

    public string? UserRole
    {
        get => _userRole;
        private set => Set(ref _userRole, value);
    }

    public bool CanEditApiBaseUrl
    {
        get => _canEditApiBaseUrl;
        private set
        {
            if (Set(ref _canEditApiBaseUrl, value))
            {
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsApiUrlReadOnly)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(ApiUrlHint)));
                ((AsyncRelayCommand)SaveCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public bool IsApiUrlReadOnly => !CanEditApiBaseUrl;

    public string ApiUrlHint => CanEditApiBaseUrl
        ? "همچنین می‌توانید متغیر محیطی ARKASOFTWARE_API_BASE را تنظیم کنید."
        : "تغییر آدرس سرور فقط برای ادمین سیستم مجاز است.";

    public DesktopThemePreference ThemePreference
    {
        get => _themePreference;
        set
        {
            if (!Set(ref _themePreference, value)) return;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsThemeSystem)));
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsThemeLight)));
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsThemeDark)));
            if (!_suppressThemeApply)
                _ = ApplyThemeAsync(value);
        }
    }

    public bool IsThemeSystem
    {
        get => ThemePreference == DesktopThemePreference.System;
        set { if (value) ThemePreference = DesktopThemePreference.System; }
    }

    public bool IsThemeLight
    {
        get => ThemePreference == DesktopThemePreference.Light;
        set { if (value) ThemePreference = DesktopThemePreference.Light; }
    }

    public bool IsThemeDark
    {
        get => ThemePreference == DesktopThemePreference.Dark;
        set { if (value) ThemePreference = DesktopThemePreference.Dark; }
    }

    public bool StartWithWindows
    {
        get => _startWithWindows;
        set
        {
            if (!Set(ref _startWithWindows, value)) return;
            if (!_suppressStartupApply)
                _ = ApplyStartWithWindowsAsync(value);
        }
    }

    public string? StatusMessage
    {
        get => _statusMessage;
        set => Set(ref _statusMessage, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (Set(ref _isBusy, value))
            {
                ((AsyncRelayCommand)SaveCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)LogoutCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public ICommand SaveCommand { get; }
    public ICommand LogoutCommand { get; }

    private async Task LoadAsync()
    {
        await _settings.EnsureInitializedAsync();
        _suppressThemeApply = true;
        _suppressStartupApply = true;
        try
        {
            ApiBaseUrl = _settings.ApiBaseUrl;
            ThemePreference = _settings.ThemePreference;
            StartWithWindows = _settings.StartWithWindows;
            var user = await _sessionStore.GetCurrentUserAsync();
            UserDisplayName = user?.DisplayName ?? "—";
            UserRole = PersianUi.TranslateRole(user?.Role);
            CanEditApiBaseUrl = IsAdminRole(user?.Role);
            StatusMessage = "تنظیمات محلی (فقط روی این دستگاه ذخیره می‌شود).";
        }
        finally
        {
            _suppressThemeApply = false;
            _suppressStartupApply = false;
        }
    }

    private static bool IsAdminRole(string? role) =>
        role?.Contains("admin", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("administrator", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("ادمین", StringComparison.Ordinal) == true
        || role?.Trim() == "3";

    private async Task SaveAsync()
    {
        if (!CanEditApiBaseUrl)
        {
            StatusMessage = "اجازه تغییر آدرس سرور را ندارید.";
            return;
        }

        IsBusy = true;
        try
        {
            await _settings.SaveApiBaseUrlAsync(ApiBaseUrl.Trim());
            ApiBaseUrl = _settings.ApiBaseUrl;
            StatusMessage = "آدرس API ذخیره شد. برای اتصال مجدد، در صورت نیاز دوباره وارد شوید.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task ApplyThemeAsync(DesktopThemePreference preference)
    {
        if (IsBusy) return;

        IsBusy = true;
        try
        {
            await _settings.SaveThemePreferenceAsync(preference);
            _themeService.Apply(preference);
            StatusMessage = "تم اعمال شد.";
            _navigation.NavigateToShell("Settings");
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
            IsBusy = false;
        }
    }

    private async Task ApplyStartWithWindowsAsync(bool enabled)
    {
        if (IsBusy) return;

        IsBusy = true;
        try
        {
            await _settings.SaveStartWithWindowsAsync(enabled);
            StatusMessage = enabled
                ? "اجرای خودکار همراه ویندوز فعال شد."
                : "اجرای خودکار همراه ویندوز غیرفعال شد.";
        }
        catch (Exception ex)
        {
            _suppressStartupApply = true;
            StartWithWindows = !enabled;
            _suppressStartupApply = false;
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task LogoutAsync()
    {
        IsBusy = true;
        try
        {
            await App.StopPresenceAsync();
            await _api.LogoutDesktopSessionAsync();
            await _sessionStore.ClearAsync();
            _navigation.NavigateToLogin();
        }
        finally
        {
            IsBusy = false;
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        return true;
    }
}
