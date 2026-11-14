using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class OnlineUsersViewModel : INotifyPropertyChanged, IPageReady
{
    private readonly IDesktopApiClient _api;
    private OnlineUserRowItem? _selectedUser;
    private string? _statusMessage;
    private bool _isBusy;
    private int _onlineCount;

    public OnlineUsersViewModel(IDesktopApiClient api)
    {
        _api = api;
        Users = new ObservableCollection<OnlineUserRowItem>();

        RefreshCommand = new AsyncRelayCommand(LoadAsync);
        BlockUserCommand = new AsyncRelayCommand(BlockUserAsync, () => SelectedUser is not null && !IsBusy);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<OnlineUserRowItem> Users { get; }

    public OnlineUserRowItem? SelectedUser
    {
        get => _selectedUser;
        set
        {
            if (!Set(ref _selectedUser, value)) return;
            ((AsyncRelayCommand)BlockUserCommand).RaiseCanExecuteChanged();
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
            if (!Set(ref _isBusy, value)) return;
            ((AsyncRelayCommand)BlockUserCommand).RaiseCanExecuteChanged();
        }
    }

    public string OnlineCountLabel => $"{ToPersianNumber(OnlineCount)} کاربر آنلاین";

    public int OnlineCount
    {
        get => _onlineCount;
        private set
        {
            if (!Set(ref _onlineCount, value)) return;
            OnPropertyChanged(nameof(OnlineCountLabel));
        }
    }

    public ICommand RefreshCommand { get; }
    public ICommand BlockUserCommand { get; }

    private async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            var rows = await _api.GetOnlineDesktopUsersAsync();
            Users.Clear();
            foreach (var row in rows.OrderByDescending(u => u.LastSeenAtUtc))
                Users.Add(new OnlineUserRowItem(row));

            OnlineCount = rows.Count;
            SelectedUser = Users.FirstOrDefault();
            StatusMessage = rows.Count == 0
                ? "در حال حاضر کاربر دسکتاپی آنلاین نیست."
                : $"{ToPersianNumber(rows.Count)} کاربر آنلاین بارگذاری شد.";
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

    private async Task BlockUserAsync()
    {
        if (SelectedUser is null) return;

        IsBusy = true;
        try
        {
            var result = await _api.BlockDesktopUserAccessAsync(
                SelectedUser.UserId,
                "مسدود شده از پنل ادمین دسکتاپ");
            StatusMessage = result.Success
                ? $"دسترسی دسکتاپ «{SelectedUser.DisplayName}» مسدود شد."
                : result.ErrorMessage ?? "مسدودسازی ناموفق بود.";
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

    private static string ToPersianNumber(int value) =>
        value.ToString(CultureInfo.InvariantCulture)
            .Replace('0', '۰')
            .Replace('1', '۱')
            .Replace('2', '۲')
            .Replace('3', '۳')
            .Replace('4', '۴')
            .Replace('5', '۵')
            .Replace('6', '۶')
            .Replace('7', '۷')
            .Replace('8', '۸')
            .Replace('9', '۹');

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

public sealed class OnlineUserRowItem
{
    public OnlineUserRowItem(DesktopOnlineDesktopUser source)
    {
        UserId = source.UserId;
        DisplayName = source.DisplayName;
        Role = string.IsNullOrWhiteSpace(source.Role) ? "—" : source.Role;
        Status = source.Status;
        AppVersion = string.IsNullOrWhiteSpace(source.AppVersion) ? "—" : source.AppVersion;
        DeviceId = string.IsNullOrWhiteSpace(source.DeviceId) ? "—" : source.DeviceId;
        LastSeenLabel = source.LastSeenAtUtc.ToLocalTime().ToString("yyyy/MM/dd HH:mm:ss", CultureInfo.InvariantCulture);
        UserIdLabel = UserId.ToString(CultureInfo.InvariantCulture);
    }

    public long UserId { get; }
    public string DisplayName { get; }
    public string Role { get; }
    public string Status { get; }
    public string AppVersion { get; }
    public string DeviceId { get; }
    public string LastSeenLabel { get; }
    public string UserIdLabel { get; }
}
