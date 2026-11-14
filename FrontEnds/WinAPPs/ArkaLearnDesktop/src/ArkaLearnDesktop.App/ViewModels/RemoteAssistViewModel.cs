using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;
using ArkaLearnDesktop.App.Localization;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Infrastructure.RemoteAssist;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class RemoteAssistViewModel : INotifyPropertyChanged, IAsyncDisposable, IPageReady
{
    private readonly IDesktopApiClient _api;
    private readonly IAuthSessionStore _sessionStore;
    private readonly RemoteAssistHubClient _hub;
    private readonly IRemoteScreenShareAdapter _screenShare;
    private readonly IRemoteInputExecutor _inputExecutor;
    private readonly TeacherCursorOverlayWindow _cursorOverlay;

    private DesktopRemoteAssistSession? _activeSession;
    private string _acceptCode = string.Empty;
    private string _acceptUsername = string.Empty;
    private string _acceptPassword = string.Empty;
    private string? _cachedSessionPassword;
    private string? _statusMessage;
    private bool _isBusy;
    private bool _isHelper;
    private bool _hubStarted;
    private long? _joinedSessionId;
    private ImageSource? _screenPreview;
    private bool _isSharingScreen;
    private bool _showConsentDialog;
    private bool _permRemoteControl = true;
    private bool _permClipboard;
    private bool _permFileTransfer;
    private bool _permAudio;
    private bool _permLockLocalInput;
    private int _selectedMonitorIndex;
    private bool _isPreviewExpanded;
    private bool _hasMultipleMonitors;
    private string _selectedAccessPresetId = "standard";
    private bool _suppressPresetSync;

    public RemoteAssistViewModel(
        IDesktopApiClient api,
        IAuthSessionStore sessionStore,
        RemoteAssistHubClient hub,
        IRemoteScreenShareAdapter screenShare,
        IRemoteInputExecutor inputExecutor)
    {
        _api = api;
        _sessionStore = sessionStore;
        _hub = hub;
        _screenShare = screenShare;
        _inputExecutor = inputExecutor;
        _cursorOverlay = new TeacherCursorOverlayWindow();
        _inputExecutor.CursorMoved += OnInjectedCursorMoved;

        RefreshCommand = new AsyncRelayCommand(LoadAsync);
        EnsureSessionCommand = new AsyncRelayCommand(EnsureSessionAsync, () => !IsBusy && IsStudent);
        ChangePasswordCommand = new AsyncRelayCommand(ChangePasswordAsync, () => !IsBusy && IsStudent && ActiveSession is not null);
        AcceptCommand = new AsyncRelayCommand(
            AcceptAsync,
            () => !IsBusy && IsHelper
                && !string.IsNullOrWhiteSpace(AcceptCode)
                && !string.IsNullOrWhiteSpace(AcceptUsername)
                && !string.IsNullOrWhiteSpace(AcceptPassword));
        EndCommand = new AsyncRelayCommand(EndAsync, () => !IsBusy && ActiveSession is not null);
        GrantConsentCommand = new AsyncRelayCommand(GrantConsentAsync, () => !IsBusy && ShowConsentDialog);
        DenyConsentCommand = new AsyncRelayCommand(DenyConsentAsync, () => !IsBusy && ShowConsentDialog);
        CopySessionCodeCommand = new AsyncRelayCommand(
            () => CopyCredentialAsync(ActiveSession?.OneTimeSessionCode, "شناسه ورود"),
            () => !string.IsNullOrWhiteSpace(ActiveSession?.OneTimeSessionCode));
        CopyUsernameCommand = new AsyncRelayCommand(
            () => CopyCredentialAsync(ActiveSession?.SessionUsername, "نام کاربری"),
            () => !string.IsNullOrWhiteSpace(ActiveSession?.SessionUsername));
        CopyPasswordCommand = new AsyncRelayCommand(
            () => CopyCredentialAsync(DisplayedPassword, "رمز"),
            () => !string.IsNullOrWhiteSpace(DisplayedPassword) && DisplayedPassword != "—");
        ExpandPreviewCommand = new AsyncRelayCommand(
            () =>
            {
                IsPreviewExpanded = true;
                return Task.CompletedTask;
            },
            () => ScreenPreview is not null);
        CollapsePreviewCommand = new AsyncRelayCommand(
            () =>
            {
                IsPreviewExpanded = false;
                return Task.CompletedTask;
            });
        DeleteHistoryItemCommand = new AsyncRelayCommand<DesktopRemoteAssistSession>(
            DeleteHistoryItemAsync,
            _ => !IsBusy);
        ClearHistoryCommand = new AsyncRelayCommand(
            ClearHistoryAsync,
            () => !IsBusy && HistoryItems.Count > 0);

        PendingSessions = new ObservableCollection<DesktopRemoteAssistSession>();
        HistoryItems = new ObservableCollection<DesktopRemoteAssistSession>();
        AvailableMonitors = new ObservableCollection<DesktopMonitorInfo>();
        AccessPresets =
        [
            new AccessPresetOption("view", "فقط مشاهده صفحه"),
            new AccessPresetOption("standard", "استاندارد (کنترل موس و کیبورد)"),
            new AccessPresetOption("full", "دسترسی کامل (همه موارد)"),
            new AccessPresetOption("custom", "سفارشی"),
        ];

        _hub.On("SessionChanged", OnSessionChanged);
        _hub.On("ConsentRequired", OnConsentRequired);
        _hub.On("ConsentResolved", OnSessionChanged);
        _hub.On("ScreenFrame", OnScreenFrame);
        _hub.On("InputRelay", OnInputRelay);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => InitializeAsync();

    public ObservableCollection<DesktopRemoteAssistSession> PendingSessions { get; }
    public ObservableCollection<DesktopRemoteAssistSession> HistoryItems { get; }
    public ObservableCollection<DesktopMonitorInfo> AvailableMonitors { get; }
    public IReadOnlyList<AccessPresetOption> AccessPresets { get; }

    public string SelectedAccessPresetId
    {
        get => _selectedAccessPresetId;
        set
        {
            if (!Set(ref _selectedAccessPresetId, value)) return;
            ApplyAccessPreset(value);
        }
    }

    public DesktopRemoteAssistSession? ActiveSession
    {
        get => _activeSession;
        private set
        {
            if (Set(ref _activeSession, value))
            {
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(HasActiveSession)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(ActiveSessionStatusFa)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(DisplayedPassword)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(ShowScreenPreview)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(CanRemoteControl)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsAwaitingConsent)));
                ((AsyncRelayCommand)EndCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)ChangePasswordCommand).RaiseCanExecuteChanged();
                RaiseCopyCommandsCanExecute();
                _ = SyncScreenShareAsync();
                UpdateConsentFromSession(value);
                UpdateCursorOverlay();
            }
        }
    }

    public bool IsHelper
    {
        get => _isHelper;
        private set
        {
            if (Set(ref _isHelper, value))
            {
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsStudent)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(CanRemoteControl)));
                ((AsyncRelayCommand)EnsureSessionCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)AcceptCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)ChangePasswordCommand).RaiseCanExecuteChanged();
                UpdateCursorOverlay();
            }
        }
    }

    public bool IsStudent => !IsHelper;
    public bool HasActiveSession => ActiveSession is not null;
    public bool IsAwaitingConsent =>
        ActiveSession?.Status.Equals("AwaitingConsent", StringComparison.OrdinalIgnoreCase) == true;

    public bool ShowScreenPreview =>
        ActiveSession?.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) == true
        && ScreenPreview is not null;

    public string? ActiveSessionStatusFa =>
        ActiveSession is null ? null : PersianUi.TranslateRemoteAssistStatus(ActiveSession.Status);

    public string DisplayedPassword =>
        !string.IsNullOrWhiteSpace(ActiveSession?.SessionPassword)
            ? ActiveSession!.SessionPassword!
            : (_cachedSessionPassword ?? "رمز ذخیره نشده — تغییر رمز بزنید");

    public ImageSource? ScreenPreview
    {
        get => _screenPreview;
        private set
        {
            if (Set(ref _screenPreview, value))
            {
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(ShowScreenPreview)));
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(CanRemoteControl)));
                ((AsyncRelayCommand)ExpandPreviewCommand).RaiseCanExecuteChanged();
                if (value is null)
                    IsPreviewExpanded = false;
            }
        }
    }

    public bool CanRemoteControl =>
        IsHelper
        && ActiveSession?.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) == true
        && ActiveSession.AllowRemoteControl;

    public bool IsSharingScreen
    {
        get => _isSharingScreen;
        private set
        {
            if (Set(ref _isSharingScreen, value))
                UpdateCursorOverlay();
        }
    }

    public bool ShowConsentDialog
    {
        get => _showConsentDialog;
        private set
        {
            if (Set(ref _showConsentDialog, value))
            {
                ((AsyncRelayCommand)GrantConsentCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)DenyConsentCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public bool PermRemoteControl
    {
        get => _permRemoteControl;
        set
        {
            if (!Set(ref _permRemoteControl, value)) return;
            MarkAccessPresetCustomIfNeeded();
        }
    }

    public bool PermClipboard
    {
        get => _permClipboard;
        set
        {
            if (!Set(ref _permClipboard, value)) return;
            MarkAccessPresetCustomIfNeeded();
        }
    }

    public bool PermFileTransfer
    {
        get => _permFileTransfer;
        set
        {
            if (!Set(ref _permFileTransfer, value)) return;
            MarkAccessPresetCustomIfNeeded();
        }
    }

    public bool PermAudio
    {
        get => _permAudio;
        set
        {
            if (!Set(ref _permAudio, value)) return;
            MarkAccessPresetCustomIfNeeded();
        }
    }

    public bool PermLockLocalInput
    {
        get => _permLockLocalInput;
        set
        {
            if (!Set(ref _permLockLocalInput, value)) return;
            MarkAccessPresetCustomIfNeeded();
        }
    }

    public int SelectedMonitorIndex
    {
        get => _selectedMonitorIndex;
        set => Set(ref _selectedMonitorIndex, value);
    }

    public bool HasMultipleMonitors
    {
        get => _hasMultipleMonitors;
        private set => Set(ref _hasMultipleMonitors, value);
    }

    public bool IsPreviewExpanded
    {
        get => _isPreviewExpanded;
        private set => Set(ref _isPreviewExpanded, value);
    }

    public string AcceptCode
    {
        get => _acceptCode;
        set
        {
            if (Set(ref _acceptCode, value))
                ((AsyncRelayCommand)AcceptCommand).RaiseCanExecuteChanged();
        }
    }

    public string AcceptUsername
    {
        get => _acceptUsername;
        set
        {
            if (Set(ref _acceptUsername, value))
                ((AsyncRelayCommand)AcceptCommand).RaiseCanExecuteChanged();
        }
    }

    public string AcceptPassword
    {
        get => _acceptPassword;
        set
        {
            if (Set(ref _acceptPassword, value))
                ((AsyncRelayCommand)AcceptCommand).RaiseCanExecuteChanged();
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
                ((AsyncRelayCommand)EnsureSessionCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)ChangePasswordCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)AcceptCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)EndCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)GrantConsentCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)DenyConsentCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand)ClearHistoryCommand).RaiseCanExecuteChanged();
                ((AsyncRelayCommand<DesktopRemoteAssistSession>)DeleteHistoryItemCommand).RaiseCanExecuteChanged();
            }
        }
    }

    public ICommand RefreshCommand { get; }
    public ICommand EnsureSessionCommand { get; }
    public ICommand ChangePasswordCommand { get; }
    public ICommand AcceptCommand { get; }
    public ICommand EndCommand { get; }
    public ICommand GrantConsentCommand { get; }
    public ICommand DenyConsentCommand { get; }
    public ICommand CopySessionCodeCommand { get; }
    public ICommand CopyUsernameCommand { get; }
    public ICommand CopyPasswordCommand { get; }
    public ICommand ExpandPreviewCommand { get; }
    public ICommand CollapsePreviewCommand { get; }
    public ICommand DeleteHistoryItemCommand { get; }
    public ICommand ClearHistoryCommand { get; }

    private Task CopyCredentialAsync(string? value, string label)
    {
        if (string.IsNullOrWhiteSpace(value) || value == "—")
        {
            StatusMessage = $"{label} برای کپی موجود نیست.";
            return Task.CompletedTask;
        }

        try
        {
            Clipboard.SetText(value.Trim());
            StatusMessage = $"{label} کپی شد.";
        }
        catch (Exception ex)
        {
            StatusMessage = $"کپی ناموفق بود: {ex.Message}";
        }

        return Task.CompletedTask;
    }

    private void RaiseCopyCommandsCanExecute()
    {
        ((AsyncRelayCommand)CopySessionCodeCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)CopyUsernameCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)CopyPasswordCommand).RaiseCanExecuteChanged();
    }

    private async Task InitializeAsync()
    {
        await EnsureHubAsync();
        await LoadAsync();
        if (IsStudent)
            await EnsureSessionAsync();
    }

    private async Task EnsureHubAsync()
    {
        if (_hubStarted) return;

        var user = await _sessionStore.GetCurrentUserAsync();
        if (user is null) return;

        await _hub.ConnectAsync();
        await _hub.JoinUserAsync(user.UserId);
        if (IsHelperRole(user.Role))
            await _hub.JoinTeacherPoolAsync();

        _hubStarted = true;
    }

    private static bool IsHelperRole(string? role) =>
        role?.Contains("teacher", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("استاد", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("admin", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("ادمین", StringComparison.OrdinalIgnoreCase) == true;

    private async Task LoadAsync()
    {
        await RunOnUiAsync(async () =>
        {
            IsBusy = true;
            try
            {
                await EnsureHubAsync();

                var user = await _sessionStore.GetCurrentUserAsync();
                IsHelper = IsHelperRole(user?.Role);

                if (IsHelper && _hubStarted)
                    await _hub.JoinTeacherPoolAsync();

                var session = await _api.GetMyRemoteAssistSessionAsync();
                if (session is not null && string.IsNullOrWhiteSpace(session.SessionPassword) && !string.IsNullOrWhiteSpace(_cachedSessionPassword))
                {
                    session = session with { SessionPassword = _cachedSessionPassword };
                }
                else if (!string.IsNullOrWhiteSpace(session?.SessionPassword))
                {
                    _cachedSessionPassword = session.SessionPassword;
                }

                ActiveSession = session;

                ReplaceCollection(PendingSessions, IsHelper
                    ? await _api.GetPendingRemoteAssistSessionsAsync()
                    : Array.Empty<DesktopRemoteAssistSession>());

                var history = await _api.GetRemoteAssistHistoryAsync(pageNumber: 1, pageSize: 30);
                ReplaceCollection(HistoryItems, history.Items);

                await JoinActiveSessionGroupAsync();
                await SyncScreenShareAsync();

                StatusMessage = ActiveSession is null
                    ? (IsHelper
                        ? "شناسه، نام کاربری و رمز دانشجو را وارد کنید."
                        : "نشست آماده نیست — در حال آماده‌سازی…")
                    : $"وضعیت: {PersianUi.TranslateRemoteAssistStatus(ActiveSession.Status)}";
            }
            catch (Exception ex)
            {
                StatusMessage = ex.Message;
            }
            finally
            {
                IsBusy = false;
            }
        });
    }

    private async Task EnsureSessionAsync()
    {
        IsBusy = true;
        try
        {
            var result = await _api.EnsureRemoteAssistSessionAsync();
            if (!result.Success || result.Session is null)
            {
                StatusMessage = result.ErrorMessage ?? "آماده‌سازی نشست ناموفق بود.";
                return;
            }

            if (!string.IsNullOrWhiteSpace(result.Session.SessionPassword))
                _cachedSessionPassword = result.Session.SessionPassword;

            ActiveSession = result.Session with
            {
                SessionPassword = result.Session.SessionPassword ?? _cachedSessionPassword,
            };
            StatusMessage = "شناسه، نام کاربری و رمز را به استاد بدهید. فقط رمز قابل تغییر است.";
            await JoinActiveSessionGroupAsync();
            await LoadHistoryOnlyAsync();
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

    private async Task ChangePasswordAsync()
    {
        if (ActiveSession is null) return;
        IsBusy = true;
        try
        {
            var result = await _api.ChangeRemoteAssistPasswordAsync(ActiveSession.SessionId);
            if (!result.Success || result.Session is null)
            {
                StatusMessage = result.ErrorMessage ?? "تغییر رمز ناموفق بود.";
                return;
            }

            _cachedSessionPassword = result.Session.SessionPassword;
            ActiveSession = result.Session;
            StatusMessage = "رمز نشست به‌روزرسانی شد.";
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

    private async Task AcceptAsync()
    {
        IsBusy = true;
        try
        {
            var result = await _api.AcceptRemoteAssistSessionAsync(AcceptCode, AcceptUsername, AcceptPassword);
            if (!result.Success)
            {
                StatusMessage = result.ErrorMessage ?? "درخواست اتصال ناموفق بود.";
                return;
            }

            AcceptCode = string.Empty;
            AcceptUsername = string.Empty;
            AcceptPassword = string.Empty;
            StatusMessage = result.Status?.Equals("AwaitingConsent", StringComparison.OrdinalIgnoreCase) == true
                ? "در انتظار تأیید دانشجو و دسترسی‌ها…"
                : $"درخواست اتصال برای دانشجو #{result.RequesterUserId} ارسال شد.";
            await LoadAsync();
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

    private async Task GrantConsentAsync()
    {
        if (ActiveSession is null) return;
        IsBusy = true;
        try
        {
            var result = await _api.ConfirmRemoteAssistConsentAsync(
                ActiveSession.SessionId,
                PermRemoteControl,
                PermClipboard,
                PermFileTransfer,
                PermAudio,
                PermLockLocalInput);
            if (!result.Success || result.Session is null)
            {
                StatusMessage = result.ErrorMessage ?? "تأیید دسترسی ناموفق بود.";
                return;
            }

            ShowConsentDialog = false;
            ActiveSession = result.Session with { SessionPassword = _cachedSessionPassword };
            StatusMessage = "دسترسی‌ها تأیید شد؛ جلسه فعال است.";
            await JoinActiveSessionGroupAsync();
            await SyncScreenShareAsync();
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

    private async Task DenyConsentAsync()
    {
        if (ActiveSession is null) return;
        IsBusy = true;
        try
        {
            var result = await _api.DenyRemoteAssistConsentAsync(ActiveSession.SessionId);
            ShowConsentDialog = false;
            if (result.Session is not null)
                ActiveSession = result.Session with { SessionPassword = _cachedSessionPassword };
            StatusMessage = result.Success ? "درخواست اتصال رد شد." : (result.ErrorMessage ?? "رد دسترسی ناموفق بود.");
            await LoadAsync();
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

    private async Task EndAsync()
    {
        if (ActiveSession is null) return;
        IsBusy = true;
        try
        {
            var ok = await _api.EndRemoteAssistSessionAsync(ActiveSession.SessionId);
            StatusMessage = ok ? "جلسه پایان یافت." : "پایان جلسه ناموفق بود.";
            ActiveSession = null;
            ShowConsentDialog = false;
            StopScreenShare();
            if (IsStudent)
                await EnsureSessionAsync();
            else
                await LoadAsync();
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

    private async Task LoadHistoryOnlyAsync()
    {
        try
        {
            var history = await _api.GetRemoteAssistHistoryAsync(pageNumber: 1, pageSize: 30);
            await RunOnUiAsync(() =>
            {
                ReplaceCollection(HistoryItems, history.Items);
                ((AsyncRelayCommand)ClearHistoryCommand).RaiseCanExecuteChanged();
            });
        }
        catch
        {
            // ignore
        }
    }

    private async Task DeleteHistoryItemAsync(DesktopRemoteAssistSession? item)
    {
        if (item is null) return;
        var confirm = System.Windows.MessageBox.Show(
            "این نشست از تاریخچه حذف شود؟",
            "حذف نشست",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);
        if (confirm != MessageBoxResult.Yes) return;

        IsBusy = true;
        try
        {
            var deleted = await _api.DeleteRemoteAssistHistoryAsync(sessionId: item.SessionId);
            StatusMessage = deleted > 0 ? "نشست از تاریخچه حذف شد." : "حذف نشست ناموفق بود.";
            await LoadHistoryOnlyAsync();
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
            ((AsyncRelayCommand)ClearHistoryCommand).RaiseCanExecuteChanged();
        }
    }

    private async Task ClearHistoryAsync()
    {
        var confirm = System.Windows.MessageBox.Show(
            "همه نشست‌های تاریخچه حذف شوند؟ این عمل قابل بازگشت نیست.",
            "حذف همه",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);
        if (confirm != MessageBoxResult.Yes) return;

        IsBusy = true;
        try
        {
            var deleted = await _api.DeleteRemoteAssistHistoryAsync();
            StatusMessage = deleted > 0
                ? $"{deleted} نشست از تاریخچه حذف شد."
                : "مواردی برای حذف یافت نشد.";
            await LoadHistoryOnlyAsync();
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
            ((AsyncRelayCommand)ClearHistoryCommand).RaiseCanExecuteChanged();
        }
    }

    private void UpdateConsentFromSession(DesktopRemoteAssistSession? session)
    {
        if (session?.Status.Equals("AwaitingConsent", StringComparison.OrdinalIgnoreCase) == true && IsStudent)
        {
            _suppressPresetSync = true;
            _selectedAccessPresetId = "standard";
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(SelectedAccessPresetId)));
            ApplyAccessPreset("standard");
            _suppressPresetSync = false;
            RefreshMonitors();
            ShowConsentDialog = true;
        }
        else if (session?.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) == true)
        {
            ShowConsentDialog = false;
        }
        else if (session is null
                 || session.Status.Equals("Ended", StringComparison.OrdinalIgnoreCase)
                 || session.Status.Equals("Denied", StringComparison.OrdinalIgnoreCase))
        {
            ShowConsentDialog = false;
            StopScreenShare();
        }
    }

    private void RefreshMonitors()
    {
        var monitors = _screenShare.GetMonitors();
        AvailableMonitors.Clear();
        foreach (var monitor in monitors)
            AvailableMonitors.Add(monitor);

        HasMultipleMonitors = AvailableMonitors.Count > 1;
        var primary = AvailableMonitors.FirstOrDefault(m => m.IsPrimary) ?? AvailableMonitors.FirstOrDefault();
        SelectedMonitorIndex = primary?.Index ?? 0;
    }

    private void OnConsentRequired(JsonElement payload) =>
        _ = RunOnUiAsync(async () =>
        {
            try
            {
                await LoadAsync();
                if (IsStudent && IsAwaitingConsent)
                    ShowConsentDialog = true;
            }
            catch
            {
                // ignore
            }
        });

    private void OnSessionChanged(JsonElement payload) =>
        _ = RunOnUiAsync(async () =>
        {
            try
            {
                await LoadAsync();
            }
            catch
            {
                // ignore
            }
        });

    private void OnScreenFrame(JsonElement payload)
    {
        if (IsStudent || ActiveSession is null) return;
        if (!ActiveSession.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)) return;

        var sessionId = ReadLong(payload, "sessionId");
        if (sessionId != ActiveSession.SessionId) return;

        var jpegBase64 = ReadString(payload, "jpegBase64");
        if (string.IsNullOrWhiteSpace(jpegBase64)) return;

        try
        {
            var image = CreateImageSource(Convert.FromBase64String(jpegBase64));
            _ = RunOnUiAsync(() => ScreenPreview = image);
        }
        catch
        {
            // ignore
        }
    }

    private void OnInputRelay(JsonElement payload)
    {
        if (!IsStudent || ActiveSession is null) return;
        if (!ActiveSession.AllowRemoteControl) return;

        var sessionId = ReadLong(payload, "sessionId");
        if (sessionId != ActiveSession.SessionId) return;

        var payloadJson = ReadString(payload, "payloadJson");
        if (string.IsNullOrWhiteSpace(payloadJson)) return;

        _ = RunOnUiAsync(() => _inputExecutor.Apply(payloadJson));
    }

    public void SendMouseMove(double percentX, double percentY) =>
        _ = RelayInputAsync($$"""{"kind":"mouseMove","x":{{percentX.ToString(System.Globalization.CultureInfo.InvariantCulture)}},"y":{{percentY.ToString(System.Globalization.CultureInfo.InvariantCulture)}}}""");

    public void SendMouseButton(int button, bool isDown, double percentX, double percentY) =>
        _ = RelayInputAsync($$"""{"kind":"mouseButton","button":{{button}},"down":{{(isDown ? "true" : "false")}},"x":{{percentX.ToString(System.Globalization.CultureInfo.InvariantCulture)}},"y":{{percentY.ToString(System.Globalization.CultureInfo.InvariantCulture)}}}""");

    public void SendKey(int virtualKey, bool isDown) =>
        _ = RelayInputAsync($$"""{"kind":"key","vk":{{virtualKey}},"down":{{(isDown ? "true" : "false")}}}""");

    private async Task RelayInputAsync(string payloadJson)
    {
        if (!CanRemoteControl || ActiveSession is null) return;
        try
        {
            await _hub.RelayInputAsync(ActiveSession.SessionId, payloadJson);
        }
        catch
        {
            // ignore
        }
    }

    private async Task JoinActiveSessionGroupAsync()
    {
        if (!_hubStarted) return;

        if (_joinedSessionId is > 0)
        {
            await _hub.LeaveSessionAsync(_joinedSessionId.Value);
            _joinedSessionId = null;
        }

        if (ActiveSession?.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) == true)
        {
            await _hub.JoinSessionAsync(ActiveSession.SessionId);
            _joinedSessionId = ActiveSession.SessionId;
        }
    }

    private Task SyncScreenShareAsync()
    {
        if (ActiveSession?.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) == true && IsStudent)
        {
            if (_screenShare.IsSharing) return Task.CompletedTask;

            if (AvailableMonitors.Count == 0)
                RefreshMonitors();

            var monitor = AvailableMonitors.FirstOrDefault(m => m.Index == SelectedMonitorIndex)
                ?? AvailableMonitors.FirstOrDefault(m => m.IsPrimary)
                ?? AvailableMonitors.FirstOrDefault();
            if (monitor is not null)
                _inputExecutor.SetTargetScreen(monitor.BoundsX, monitor.BoundsY, monitor.Width, monitor.Height);

            _screenShare.Start(
                ActiveSession.SessionId,
                SelectedMonitorIndex,
                (sessionId, jpegBase64) => _hub.PushScreenFrameAsync(sessionId, jpegBase64),
                bytes =>
                {
                    var image = bytes is null ? null : CreateImageSource(bytes);
                    _ = RunOnUiAsync(() => ScreenPreview = image);
                });
            IsSharingScreen = true;
            return Task.CompletedTask;
        }

        StopScreenShare();
        return Task.CompletedTask;
    }

    private void StopScreenShare()
    {
        if (_screenShare.IsSharing)
            _screenShare.Stop();
        IsSharingScreen = false;
        ScreenPreview = null;
        IsPreviewExpanded = false;
        _inputExecutor.ClearTargetScreen();
    }

    private void OnInjectedCursorMoved(int screenX, int screenY)
    {
        if (!ShouldShowCursorOverlay)
        {
            _cursorOverlay.HideOverlay();
            return;
        }

        _cursorOverlay.MoveTo(screenX, screenY);
    }

    private bool ShouldShowCursorOverlay =>
        IsStudent
        && IsSharingScreen
        && ActiveSession?.Status.Equals("Active", StringComparison.OrdinalIgnoreCase) == true
        && ActiveSession.AllowRemoteControl;

    private void UpdateCursorOverlay()
    {
        if (ShouldShowCursorOverlay)
            _cursorOverlay.ShowNearCursor(ActiveSession?.HelperDisplayName ?? "استاد");
        else
            _cursorOverlay.HideOverlay();
    }

    private static ImageSource CreateImageSource(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes);
        var image = new BitmapImage();
        image.BeginInit();
        image.CacheOption = BitmapCacheOption.OnLoad;
        image.StreamSource = stream;
        image.EndInit();
        image.Freeze();
        return image;
    }

    private static long ReadLong(JsonElement payload, string camelName)
    {
        if (payload.TryGetProperty(camelName, out var camel) && camel.TryGetInt64(out var v)) return v;
        var pascal = char.ToUpperInvariant(camelName[0]) + camelName[1..];
        if (payload.TryGetProperty(pascal, out var pascalProp) && pascalProp.TryGetInt64(out v)) return v;
        return 0;
    }

    private static string ReadString(JsonElement payload, string camelName)
    {
        if (payload.TryGetProperty(camelName, out var camel)) return camel.GetString() ?? string.Empty;
        var pascal = char.ToUpperInvariant(camelName[0]) + camelName[1..];
        if (payload.TryGetProperty(pascal, out var pascalProp)) return pascalProp.GetString() ?? string.Empty;
        return string.Empty;
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private static Dispatcher UiDispatcher =>
        System.Windows.Application.Current?.Dispatcher ?? Dispatcher.CurrentDispatcher;

    private static Task RunOnUiAsync(Action action)
    {
        var dispatcher = UiDispatcher;
        if (dispatcher.CheckAccess())
        {
            action();
            return Task.CompletedTask;
        }

        return dispatcher.InvokeAsync(action).Task;
    }

    private static Task RunOnUiAsync(Func<Task> action)
    {
        var dispatcher = UiDispatcher;
        if (dispatcher.CheckAccess())
            return action();

        return dispatcher.InvokeAsync(action).Task.Unwrap();
    }

    private static void ReplaceCollection<T>(ObservableCollection<T> target, IEnumerable<T> items)
    {
        target.Clear();
        foreach (var item in items)
            target.Add(item);
    }

    private void ApplyAccessPreset(string? presetId)
    {
        _suppressPresetSync = true;
        try
        {
            switch ((presetId ?? string.Empty).Trim().ToLowerInvariant())
            {
                case "view":
                    PermRemoteControl = false;
                    PermClipboard = false;
                    PermFileTransfer = false;
                    PermAudio = false;
                    PermLockLocalInput = false;
                    break;
                case "full":
                    PermRemoteControl = true;
                    PermClipboard = true;
                    PermFileTransfer = true;
                    PermAudio = true;
                    PermLockLocalInput = true;
                    break;
                case "standard":
                    PermRemoteControl = true;
                    PermClipboard = false;
                    PermFileTransfer = false;
                    PermAudio = false;
                    PermLockLocalInput = false;
                    break;
                // custom: leave checkboxes as-is
            }
        }
        finally
        {
            _suppressPresetSync = false;
        }
    }

    private void MarkAccessPresetCustomIfNeeded()
    {
        if (_suppressPresetSync) return;
        if (_selectedAccessPresetId == "custom") return;
        _selectedAccessPresetId = "custom";
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(SelectedAccessPresetId)));
    }

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        return true;
    }

    public async ValueTask DisposeAsync()
    {
        StopScreenShare();
        _cursorOverlay.HideOverlay();
        if (_joinedSessionId is > 0)
        {
            try
            {
                await _hub.LeaveSessionAsync(_joinedSessionId.Value);
            }
            catch
            {
                // ignore
            }

            _joinedSessionId = null;
        }

        _hubStarted = false;
        ShowConsentDialog = false;
        ActiveSession = null;
    }
}

public sealed record AccessPresetOption(string Id, string DisplayName);
