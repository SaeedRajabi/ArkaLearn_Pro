using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class TeachersViewModel : INotifyPropertyChanged, IPageReady
{
    private const int PageSize = 20;

    private readonly IDesktopApiClient _api;
    private TeacherRowItem? _selectedTeacher;
    private string _searchText = string.Empty;
    private string? _statusMessage;
    private bool _isBusy;
    private int _pageNumber = 1;
    private int _totalCount;

    public TeachersViewModel(IDesktopApiClient api)
    {
        _api = api;
        Teachers = new ObservableCollection<TeacherRowItem>();

        RefreshCommand = new AsyncRelayCommand(LoadAsync);
        SearchCommand = new AsyncRelayCommand(SearchAsync);
        NextPageCommand = new AsyncRelayCommand(NextPageAsync, () => CanGoNext && !IsBusy);
        PreviousPageCommand = new AsyncRelayCommand(PreviousPageAsync, () => CanGoPrevious && !IsBusy);
        EnableAccountCommand = new AsyncRelayCommand(() => SetStatusAsync("active"), () => SelectedTeacher is not null && !IsBusy);
        BlockAccountCommand = new AsyncRelayCommand(() => SetStatusAsync("blocked"), () => SelectedTeacher is not null && !IsBusy);
        CopyUserIdCommand = new RelayCommand(CopyUserId, () => SelectedTeacher is not null);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<TeacherRowItem> Teachers { get; }

    public TeacherRowItem? SelectedTeacher
    {
        get => _selectedTeacher;
        set
        {
            if (!Set(ref _selectedTeacher, value)) return;
            RaiseCommandStates();
        }
    }

    public string SearchText
    {
        get => _searchText;
        set => Set(ref _searchText, value);
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
            RaiseCommandStates();
        }
    }

    public string PageLabel =>
        TotalCount == 0
            ? "بدون استاد"
            : $"صفحه {ToPersianNumber(PageNumber)} از {ToPersianNumber(TotalPages)} — {ToPersianNumber(TotalCount)} استاد";

    public int PageNumber
    {
        get => _pageNumber;
        private set
        {
            if (!Set(ref _pageNumber, value)) return;
            OnPropertyChanged(nameof(PageLabel));
            OnPropertyChanged(nameof(CanGoNext));
            OnPropertyChanged(nameof(CanGoPrevious));
            RaiseCommandStates();
        }
    }

    public int TotalCount
    {
        get => _totalCount;
        private set
        {
            if (!Set(ref _totalCount, value)) return;
            OnPropertyChanged(nameof(PageLabel));
            OnPropertyChanged(nameof(TotalPages));
            OnPropertyChanged(nameof(CanGoNext));
            OnPropertyChanged(nameof(CanGoPrevious));
            RaiseCommandStates();
        }
    }

    public int TotalPages => Math.Max(1, (int)Math.Ceiling(TotalCount / (double)PageSize));
    public bool CanGoNext => PageNumber < TotalPages;
    public bool CanGoPrevious => PageNumber > 1;

    public ICommand RefreshCommand { get; }
    public ICommand SearchCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand EnableAccountCommand { get; }
    public ICommand BlockAccountCommand { get; }
    public ICommand CopyUserIdCommand { get; }

    private async Task SearchAsync()
    {
        PageNumber = 1;
        await LoadAsync();
    }

    private async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            var result = await _api.SearchTeachersAsync(SearchText.Trim(), PageNumber, PageSize);
            Teachers.Clear();
            foreach (var teacher in result.Items)
                Teachers.Add(new TeacherRowItem(teacher));

            TotalCount = result.TotalCount;
            PageNumber = result.PageNumber;
            SelectedTeacher = Teachers.FirstOrDefault();

            StatusMessage = result.Items.Count == 0
                ? "استادی یافت نشد."
                : $"{ToPersianNumber(result.TotalCount)} استاد بارگذاری شد.";
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

    private async Task NextPageAsync()
    {
        if (!CanGoNext) return;
        PageNumber++;
        await LoadAsync();
    }

    private async Task PreviousPageAsync()
    {
        if (!CanGoPrevious) return;
        PageNumber--;
        await LoadAsync();
    }

    private async Task SetStatusAsync(string status)
    {
        if (SelectedTeacher is null) return;

        IsBusy = true;
        try
        {
            var result = await _api.SetTeacherAccountStatusAsync(SelectedTeacher.TeacherId, status);
            StatusMessage = result.Success
                ? status == "active"
                    ? $"حساب «{SelectedTeacher.DisplayName}» فعال شد."
                    : $"حساب «{SelectedTeacher.DisplayName}» مسدود شد."
                : result.ErrorMessage ?? "تغییر وضعیت ناموفق بود.";

            if (result.Success)
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

    private void CopyUserId()
    {
        if (SelectedTeacher is null) return;
        Clipboard.SetText(SelectedTeacher.UserId.ToString(CultureInfo.InvariantCulture));
        StatusMessage = "شناسه کاربر در کلیپ‌بورد کپی شد.";
    }

    private void RaiseCommandStates()
    {
        ((AsyncRelayCommand)EnableAccountCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)BlockAccountCommand).RaiseCanExecuteChanged();
        ((RelayCommand)CopyUserIdCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)NextPageCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)PreviousPageCommand).RaiseCanExecuteChanged();
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

public sealed class TeacherRowItem
{
    public TeacherRowItem(DesktopTeacherSearchItem source)
    {
        TeacherId = source.TeacherId;
        UserId = source.UserId;
        DisplayName = source.DisplayName;
        UserName = source.UserName;
        Email = string.IsNullOrWhiteSpace(source.Email) ? "—" : source.Email;
        AccountStatus = source.AccountStatus ?? "active";
        StatusLabel = FormatStatus(AccountStatus, source.IsUserBlocked);
        UserIdLabel = UserId.ToString(CultureInfo.InvariantCulture);
        PublishedCourseCountLabel = ToPersianNumber(source.PublishedCourseCount);
    }

    public long TeacherId { get; }
    public long UserId { get; }
    public string DisplayName { get; }
    public string UserName { get; }
    public string Email { get; }
    public string AccountStatus { get; }
    public string StatusLabel { get; }
    public string UserIdLabel { get; }
    public string PublishedCourseCountLabel { get; }

    private static string FormatStatus(string status, bool isUserBlocked)
    {
        if (isUserBlocked) return "مسدود (کاربر)";
        return status.ToLowerInvariant() switch
        {
            "active" => "فعال",
            "blocked" => "مسدود",
            "terminated" => "خاتمه‌یافته",
            _ => status,
        };
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
}
