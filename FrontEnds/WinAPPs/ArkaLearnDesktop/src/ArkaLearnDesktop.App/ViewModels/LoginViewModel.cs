using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Application.Auth.Commands;
using MediatR;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class LoginViewModel : INotifyPropertyChanged
{
    private readonly IMediator _mediator;
    private readonly IDesktopNavigationService _navigation;
    private readonly IDesktopLocalSettings _settings;
    private string _userNameOrEmail = string.Empty;
    private string _password = string.Empty;
    private string? _errorMessage;
    private bool _isBusy;
    private bool _isUserNameLocked;

    public LoginViewModel(
        IMediator mediator,
        IDesktopNavigationService navigation,
        IDesktopLocalSettings settings)
    {
        _mediator = mediator;
        _navigation = navigation;
        _settings = settings;
        LoginCommand = new AsyncRelayCommand(
            LoginAsync,
            () => !string.IsNullOrWhiteSpace(UserNameOrEmail) && !string.IsNullOrWhiteSpace(Password),
            disableWhileRunning: false);
        ChangeUserCommand = new AsyncRelayCommand(ChangeUserAsync, () => !IsBusy && IsUserNameLocked);

        var remembered = _settings.LastUserNameOrEmail;
        if (!string.IsNullOrWhiteSpace(remembered))
        {
            _userNameOrEmail = remembered;
            _isUserNameLocked = true;
        }
    }

    public string UserNameOrEmail
    {
        get => _userNameOrEmail;
        set
        {
            if (Set(ref _userNameOrEmail, value))
            {
                OnPropertyChanged(nameof(CanLogin));
                ((AsyncRelayCommand)LoginCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public string Password
    {
        get => _password;
        set
        {
            if (Set(ref _password, value))
            {
                OnPropertyChanged(nameof(CanLogin));
                ((AsyncRelayCommand)LoginCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public string? ErrorMessage
    {
        get => _errorMessage;
        set => Set(ref _errorMessage, value);
    }

    public void SetInitialError(string message) => ErrorMessage = message;

    public bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (Set(ref _isBusy, value))
            {
                OnPropertyChanged(nameof(CanLogin));
                OnPropertyChanged(nameof(IsInteractionEnabled));
                ((AsyncRelayCommand)LoginCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)ChangeUserCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public bool IsInteractionEnabled => !IsBusy;

    public bool IsUserNameLocked
    {
        get => _isUserNameLocked;
        private set
        {
            if (!Set(ref _isUserNameLocked, value)) return;
            OnPropertyChanged(nameof(UserNameFieldVisibility));
            OnPropertyChanged(nameof(LockedUserVisibility));
            ((AsyncRelayCommand)ChangeUserCommand).RaiseCanExecuteChanged();
        }
    }

    public System.Windows.Visibility UserNameFieldVisibility =>
        IsUserNameLocked ? System.Windows.Visibility.Collapsed : System.Windows.Visibility.Visible;

    public System.Windows.Visibility LockedUserVisibility =>
        IsUserNameLocked ? System.Windows.Visibility.Visible : System.Windows.Visibility.Collapsed;

    public bool CanLogin =>
        !IsBusy && !string.IsNullOrWhiteSpace(UserNameOrEmail) && !string.IsNullOrWhiteSpace(Password);

    public bool FocusPasswordOnLoad => IsUserNameLocked;

    public ICommand LoginCommand { get; }
    public ICommand ChangeUserCommand { get; }

    private async Task ChangeUserAsync()
    {
        await _settings.SaveLastUserNameOrEmailAsync(null);
        IsUserNameLocked = false;
        UserNameOrEmail = string.Empty;
        Password = string.Empty;
        ErrorMessage = null;
    }

    private async Task LoginAsync()
    {
        if (IsBusy) return;

        ErrorMessage = null;
        IsBusy = true;
        try
        {
            var user = UserNameOrEmail.Trim();
            var result = await _mediator.Send(new LoginCommand(user, Password, App.AppVersion));
            if (!result.Success)
            {
                ErrorMessage = result.ErrorMessage ?? "ورود ناموفق بود.";
                return;
            }

            await _settings.SaveLastUserNameOrEmailAsync(user);
            IsUserNameLocked = true;
            _navigation.NavigateToShell();
            await App.StartPresenceAsync();
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
        OnPropertyChanged(name);
        return true;
    }

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

public sealed class MandatoryUpdateViewModel : INotifyPropertyChanged
{
    private readonly AppUpdateCheckResult _update;

    public MandatoryUpdateViewModel(AppUpdateCheckResult update)
    {
        _update = update;
        OpenInstallerCommand = new RelayCommand(OpenInstaller, () => !string.IsNullOrWhiteSpace(InstallerUrl));
    }

    public string Title => "به‌روزرسانی اجباری";
    public string Message =>
        $"نسخه فعلی ({_update.CurrentVersion}) دیگر پشتیبانی نمی‌شود. لطفاً نسخه {_update.LatestVersion ?? "جدید"} را نصب کنید.";
    public string? ReleaseNotes => _update.ReleaseNotes;
    public string? InstallerUrl => _update.InstallerUrl;

    public ICommand OpenInstallerCommand { get; }

    private void OpenInstaller()
    {
        if (string.IsNullOrWhiteSpace(InstallerUrl)) return;
        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = InstallerUrl,
                UseShellExecute = true,
            });
        }
        catch
        {
            // ignore launcher failures
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

internal sealed class RelayCommand(Action execute, Func<bool>? canExecute = null) : ICommand
{
    public bool CanExecute(object? parameter) => canExecute?.Invoke() ?? true;
    public void Execute(object? parameter) => execute();
    public event EventHandler? CanExecuteChanged;
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}

internal sealed class RelayCommand<T>(Action<T?> execute, Func<T?, bool>? canExecute = null) : ICommand
{
    public bool CanExecute(object? parameter)
    {
        var value = parameter is T typed ? typed : default;
        return canExecute?.Invoke(value) ?? true;
    }

    public void Execute(object? parameter)
    {
        var value = parameter is T typed ? typed : default;
        if (!CanExecute(parameter)) return;
        execute(value);
    }

    public event EventHandler? CanExecuteChanged;
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}

internal sealed class AsyncRelayCommand(
    Func<Task> execute,
    Func<bool>? canExecute = null,
    bool disableWhileRunning = true) : ICommand
{
    private bool _running;

    public bool CanExecute(object? parameter) =>
        (!disableWhileRunning || !_running) && (canExecute?.Invoke() ?? true);

    public async void Execute(object? parameter)
    {
        if (_running) return;
        if (!(canExecute?.Invoke() ?? true)) return;
        _running = true;
        if (disableWhileRunning)
            RaiseCanExecuteChanged();
        try { await execute(); }
        finally
        {
            _running = false;
            if (disableWhileRunning)
                RaiseCanExecuteChanged();
        }
    }

    public event EventHandler? CanExecuteChanged;
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}

internal sealed class AsyncRelayCommand<T>(Func<T?, Task> execute, Func<T?, bool>? canExecute = null) : ICommand
{
    private bool _running;

    public bool CanExecute(object? parameter)
    {
        if (_running) return false;
        var value = parameter is T typed ? typed : default;
        return canExecute?.Invoke(value) ?? true;
    }

    public async void Execute(object? parameter)
    {
        var value = parameter is T typed ? typed : default;
        if (!CanExecute(parameter)) return;
        _running = true;
        RaiseCanExecuteChanged();
        try { await execute(value); }
        finally
        {
            _running = false;
            RaiseCanExecuteChanged();
        }
    }

    public event EventHandler? CanExecuteChanged;
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}
