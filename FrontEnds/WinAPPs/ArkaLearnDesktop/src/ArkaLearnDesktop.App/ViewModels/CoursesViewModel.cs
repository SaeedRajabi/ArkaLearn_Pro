using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.App.Services;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class CoursesViewModel : INotifyPropertyChanged, IPageReady
{
    private const int PageSize = 20;

    private readonly IDesktopApiClient _api;
    private readonly IAuthSessionStore _sessionStore;
    private readonly ICourseManagementContext _courseContext;
    private readonly IDesktopNavigationService _navigation;
    private bool _isAdmin;
    private CourseRowItem? _selectedCourse;
    private string _searchText = string.Empty;
    private string? _statusMessage;
    private bool _isBusy;
    private int _pageNumber = 1;
    private int _totalCount;

    public CoursesViewModel(
        IDesktopApiClient api,
        IAuthSessionStore sessionStore,
        ICourseManagementContext courseContext,
        IDesktopNavigationService navigation)
    {
        _api = api;
        _sessionStore = sessionStore;
        _courseContext = courseContext;
        _navigation = navigation;

        Courses = new ObservableCollection<CourseRowItem>();
        RefreshCommand = new AsyncRelayCommand(LoadAsync, () => !IsBusy);
        NextPageCommand = new AsyncRelayCommand(NextPageAsync, () => CanGoNext && !IsBusy);
        PreviousPageCommand = new AsyncRelayCommand(PreviousPageAsync, () => CanGoPrevious && !IsBusy);
        ViewStudentsCommand = new RelayCommand<CourseRowItem>(ViewStudents, course => course is not null && !IsBusy);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<CourseRowItem> Courses { get; }

    public CourseRowItem? SelectedCourse
    {
        get => _selectedCourse;
        set
        {
            if (!Set(ref _selectedCourse, value)) return;
            if (value is not null)
            {
                _courseContext.SelectedCourseId = value.CourseId;
                _courseContext.SelectedCourseTitle = value.Title;
            }

            ((RelayCommand<CourseRowItem>)ViewStudentsCommand).RaiseCanExecuteChanged();
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
            ((AsyncRelayCommand)RefreshCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)NextPageCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)PreviousPageCommand).RaiseCanExecuteChanged();
            ((RelayCommand<CourseRowItem>)ViewStudentsCommand).RaiseCanExecuteChanged();
        }
    }

    public string PageSubtitle => _isAdmin
        ? "فهرست همه دوره‌ها (نمای ادمین)"
        : "فهرست دوره‌های شما با تعداد دانشجویان";

    public string PageLabel =>
        TotalCount == 0
            ? "بدون دوره"
            : $"صفحه {ToPersianNumber(PageNumber)} از {ToPersianNumber(TotalPages)} — {ToPersianNumber(TotalCount)} دوره";

    public int PageNumber
    {
        get => _pageNumber;
        private set
        {
            if (!Set(ref _pageNumber, value)) return;
            OnPropertyChanged(nameof(PageLabel));
            OnPropertyChanged(nameof(CanGoNext));
            OnPropertyChanged(nameof(CanGoPrevious));
            ((AsyncRelayCommand)NextPageCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)PreviousPageCommand).RaiseCanExecuteChanged();
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
            ((AsyncRelayCommand)NextPageCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)PreviousPageCommand).RaiseCanExecuteChanged();
        }
    }

    public int TotalPages => Math.Max(1, (int)Math.Ceiling(TotalCount / (double)PageSize));
    public bool CanGoNext => PageNumber < TotalPages;
    public bool CanGoPrevious => PageNumber > 1;

    public ICommand RefreshCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand ViewStudentsCommand { get; }

    private async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            var user = await _sessionStore.GetCurrentUserAsync();
            _isAdmin = DesktopUserRole.IsAdmin(user?.Role);
            OnPropertyChanged(nameof(PageSubtitle));

            var result = _isAdmin
                ? await _api.SearchCoursesAsync(SearchText.Trim(), PageNumber, PageSize)
                : await _api.SearchMyCoursesAsync(SearchText.Trim(), PageNumber, PageSize);
            Courses.Clear();
            foreach (var course in result.Items)
                Courses.Add(new CourseRowItem(course));

            TotalCount = result.TotalCount;
            PageNumber = result.PageNumber;

            if (_courseContext.SelectedCourseId is > 0)
                SelectedCourse = Courses.FirstOrDefault(c => c.CourseId == _courseContext.SelectedCourseId);

            StatusMessage = result.Items.Count == 0
                ? "دوره‌ای یافت نشد."
                : $"{ToPersianNumber(result.TotalCount)} دوره بارگذاری شد.";
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

    private void ViewStudents(CourseRowItem? course)
    {
        if (course is null) return;
        SelectedCourse = course;
        _courseContext.SelectedCourseId = course.CourseId;
        _courseContext.SelectedCourseTitle = course.Title;
        _navigation.NavigateShellPage("Students");
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

public sealed class CourseRowItem
{
    public CourseRowItem(DesktopTeacherCourseItem source)
    {
        CourseId = source.CourseId;
        Title = source.Title;
        Status = source.Status ?? "—";
        StudentCountLabel = ToPersianNumber(source.StudentCount);
        PriceLabel = source.Price is > 0
            ? $"{ToPersianNumber((int)source.Price.Value):N0} تومان"
            : "رایگان";
        CategoryName = string.IsNullOrWhiteSpace(source.CategoryName) ? "—" : source.CategoryName;
    }

    public long CourseId { get; }
    public string Title { get; }
    public string Status { get; }
    public string StudentCountLabel { get; }
    public string PriceLabel { get; }
    public string CategoryName { get; }

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
