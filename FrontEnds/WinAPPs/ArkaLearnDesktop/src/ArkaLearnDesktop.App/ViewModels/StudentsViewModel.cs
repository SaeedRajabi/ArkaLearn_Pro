using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.App.Services;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class StudentsViewModel : INotifyPropertyChanged, IPageReady
{
    private const int PageSize = 12;

    private readonly IDesktopApiClient _api;
    private readonly IAuthSessionStore _sessionStore;
    private readonly ICourseManagementContext _courseContext;
    private CourseFilterItem? _selectedCourseFilter;
    private StudentRowItem? _selectedStudent;
    private LicenseRowItem? _selectedLicense;
    private string _searchText = string.Empty;
    private string? _statusMessage;
    private bool _isBusy;
    private int _pageNumber = 1;
    private int _filteredCount;
    private List<DesktopEnrolledStudent> _allStudents = [];
    private List<StudentRowItem> _filteredStudents = [];

    public StudentsViewModel(
        IDesktopApiClient api,
        IAuthSessionStore sessionStore,
        ICourseManagementContext courseContext)
    {
        _api = api;
        _sessionStore = sessionStore;
        _courseContext = courseContext;

        CourseFilters = new ObservableCollection<CourseFilterItem>();
        Students = new ObservableCollection<StudentRowItem>();
        Licenses = new ObservableCollection<LicenseRowItem>();

        RefreshCommand = new AsyncRelayCommand(LoadAsync, () => !IsBusy);
        SearchCommand = new RelayCommand(ResetAndFilter, () => !IsBusy);
        NextPageCommand = new AsyncRelayCommand(NextPageAsync, () => CanGoNext && !IsBusy);
        PreviousPageCommand = new AsyncRelayCommand(PreviousPageAsync, () => CanGoPrevious && !IsBusy);
        RemoveStudentCommand = new AsyncRelayCommand<StudentRowItem>(RemoveStudentAsync, s => s is not null && !IsBusy);
        ApproveEnrollmentCommand = new AsyncRelayCommand<StudentRowItem>(ApproveEnrollmentAsync, s => s is { IsActive: false } && !IsBusy);
        CreateLicenseCommand = new AsyncRelayCommand(CreateLicenseAsync, () => SelectedStudent is not null && !IsBusy);
        RevokeLicenseCommand = new AsyncRelayCommand<LicenseRowItem>(RevokeLicenseAsync, l => l is not null && !IsBusy);
        RenewLicenseCommand = new AsyncRelayCommand<LicenseRowItem>(RenewLicenseAsync, l => l is not null && !IsBusy);
        RegenerateLicenseCommand = new AsyncRelayCommand<LicenseRowItem>(RegenerateLicenseAsync, l => l is not null && !IsBusy);
        CopyLicenseKeyCommand = new RelayCommand<LicenseRowItem>(CopyLicenseKey, l => l is not null && !string.IsNullOrWhiteSpace(l.LicenseKey) && l.LicenseKey != "—");

        _courseContext.SelectionChanged += OnCourseContextChanged;
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<CourseFilterItem> CourseFilters { get; }
    public ObservableCollection<StudentRowItem> Students { get; }
    public ObservableCollection<LicenseRowItem> Licenses { get; }

    public CourseFilterItem? SelectedCourseFilter
    {
        get => _selectedCourseFilter;
        set
        {
            if (!Set(ref _selectedCourseFilter, value)) return;
            ResetAndFilter();
            ((AsyncRelayCommand)CreateLicenseCommand).RaiseCanExecuteChanged();
        }
    }

    public StudentRowItem? SelectedStudent
    {
        get => _selectedStudent;
        set
        {
            if (!Set(ref _selectedStudent, value)) return;
            _ = LoadLicensesForSelectedStudentAsync();
            ((AsyncRelayCommand)CreateLicenseCommand).RaiseCanExecuteChanged();
            OnPropertyChanged(nameof(SelectedStudentLabel));
            OnPropertyChanged(nameof(HasSelectedStudent));
            OnPropertyChanged(nameof(LicensePanelVisibility));
        }
    }

    public LicenseRowItem? SelectedLicense
    {
        get => _selectedLicense;
        set => Set(ref _selectedLicense, value);
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

    public string SelectedStudentLabel =>
        SelectedStudent is null
            ? "یک دانشجو را انتخاب کنید"
            : $"لایسنس دسکتاپ — {SelectedStudent.FullName}";

    public bool HasSelectedStudent => SelectedStudent is not null;
    public Visibility LicensePanelVisibility =>
        HasSelectedStudent ? Visibility.Visible : Visibility.Collapsed;

    public string PageLabel =>
        _filteredCount == 0
            ? "بدون دانشجو"
            : $"صفحه {ToPersianNumber(PageNumber)} از {ToPersianNumber(TotalPages)} — {ToPersianNumber(_filteredCount)} نفر";

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

    public int TotalPages => Math.Max(1, (int)Math.Ceiling(_filteredCount / (double)PageSize));
    public bool CanGoNext => PageNumber < TotalPages;
    public bool CanGoPrevious => PageNumber > 1;

    public ICommand RefreshCommand { get; }
    public ICommand SearchCommand { get; }
    public ICommand NextPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand RemoveStudentCommand { get; }
    public ICommand ApproveEnrollmentCommand { get; }
    public ICommand CreateLicenseCommand { get; }
    public ICommand RevokeLicenseCommand { get; }
    public ICommand RenewLicenseCommand { get; }
    public ICommand RegenerateLicenseCommand { get; }
    public ICommand CopyLicenseKeyCommand { get; }

    private async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            var user = await _sessionStore.GetCurrentUserAsync();
            var isAdmin = DesktopUserRole.IsAdmin(user?.Role);

            var courses = isAdmin
                ? await _api.SearchCoursesAsync(null, 1, 200)
                : await _api.SearchMyCoursesAsync(null, 1, 200);

            CourseFilters.Clear();
            CourseFilters.Add(new CourseFilterItem(0, "همه دوره‌ها"));
            foreach (var course in courses.Items.OrderBy(c => c.Title))
                CourseFilters.Add(new CourseFilterItem(course.CourseId, course.Title));

            CourseFilterItem? preferred = null;
            if (_courseContext.SelectedCourseId is > 0)
                preferred = CourseFilters.FirstOrDefault(c => c.CourseId == _courseContext.SelectedCourseId);
            preferred ??= CourseFilters.FirstOrDefault();
            _selectedCourseFilter = preferred;
            OnPropertyChanged(nameof(SelectedCourseFilter));

            _allStudents = (await _api.GetMyEnrolledStudentsAsync()).ToList();
            _pageNumber = 1;
            OnPropertyChanged(nameof(PageNumber));
            ApplyStudentFilter(preserveSelection: false);
            StatusMessage = _allStudents.Count == 0
                ? "دانشجوی ثبت‌نام‌شده‌ای یافت نشد."
                : $"{ToPersianNumber(_allStudents.Count)} ثبت‌نام بارگذاری شد.";
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

    private void ResetAndFilter()
    {
        PageNumber = 1;
        ApplyStudentFilter(preserveSelection: false);
    }

    private void ApplyStudentFilter(bool preserveSelection)
    {
        var previousUserId = preserveSelection ? SelectedStudent?.UserId : null;
        var previousCourseId = preserveSelection ? SelectedStudent?.CourseId : null;

        var query = _searchText.Trim();
        var courseId = SelectedCourseFilter?.CourseId ?? 0;

        _filteredStudents = _allStudents
            .Where(s => courseId <= 0 || s.CourseId == courseId)
            .Where(s => string.IsNullOrWhiteSpace(query)
                || s.FullName.Contains(query, StringComparison.OrdinalIgnoreCase)
                || (s.Email?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false)
                || (s.UserName?.Contains(query, StringComparison.OrdinalIgnoreCase) ?? false))
            .OrderByDescending(s => s.EnrollmentDateTime)
            .Select(s => new StudentRowItem(s))
            .ToList();

        _filteredCount = _filteredStudents.Count;
        OnPropertyChanged(nameof(PageLabel));
        OnPropertyChanged(nameof(TotalPages));
        OnPropertyChanged(nameof(CanGoNext));
        OnPropertyChanged(nameof(CanGoPrevious));
        ((AsyncRelayCommand)NextPageCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)PreviousPageCommand).RaiseCanExecuteChanged();

        if (PageNumber > TotalPages)
            PageNumber = TotalPages;

        Students.Clear();
        foreach (var row in _filteredStudents.Skip((PageNumber - 1) * PageSize).Take(PageSize))
            Students.Add(row);

        if (previousUserId is > 0)
        {
            SelectedStudent = Students.FirstOrDefault(s => s.UserId == previousUserId && s.CourseId == previousCourseId)
                ?? Students.FirstOrDefault();
        }
        else
        {
            SelectedStudent = Students.FirstOrDefault();
        }
    }

    private async Task NextPageAsync()
    {
        if (!CanGoNext) return;
        PageNumber++;
        ApplyStudentFilter(preserveSelection: false);
        await Task.CompletedTask;
    }

    private async Task PreviousPageAsync()
    {
        if (!CanGoPrevious) return;
        PageNumber--;
        ApplyStudentFilter(preserveSelection: false);
        await Task.CompletedTask;
    }

    private async Task LoadLicensesForSelectedStudentAsync()
    {
        Licenses.Clear();
        SelectedLicense = null;

        if (SelectedStudent is null) return;

        try
        {
            var licenses = await _api.GetStudentDesktopLicensesAsync(SelectedStudent.UserId);
            var courseId = SelectedCourseFilter?.CourseId is > 0
                ? SelectedCourseFilter.CourseId
                : SelectedStudent.CourseId;

            foreach (var license in licenses
                         .Where(l => courseId <= 0 || l.CourseId == courseId)
                         .OrderByDescending(l => l.EnrollmentDateTime))
            {
                Licenses.Add(new LicenseRowItem(license));
            }

            SelectedLicense = Licenses.FirstOrDefault();
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
    }

    private async Task RemoveStudentAsync(StudentRowItem? student)
    {
        if (student is null) return;

        var confirm = MessageBox.Show(
            $"آیا از حذف دانشجو «{student.FullName}» از دوره «{student.CourseTitle}» مطمئن هستید؟\nاین عمل قابل بازگشت نیست.",
            "تأیید حذف دانشجو",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning,
            MessageBoxResult.No,
            MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);

        if (confirm != MessageBoxResult.Yes) return;

        IsBusy = true;
        try
        {
            var result = await _api.RemoveMyStudentAsync(student.UserId);
            StatusMessage = result.Success
                ? $"دانشجو «{student.FullName}» حذف شد."
                : result.ErrorMessage ?? "حذف ناموفق بود.";
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

    private async Task ApproveEnrollmentAsync(StudentRowItem? student)
    {
        if (student is null || student.IsActive) return;

        IsBusy = true;
        try
        {
            var licenses = await _api.GetStudentDesktopLicensesAsync(student.UserId);
            var enrollmentId = licenses
                .FirstOrDefault(l => l.CourseId == student.CourseId && l.EnrollmentId > 0)
                ?.EnrollmentId ?? 0;

            if (enrollmentId <= 0)
            {
                StatusMessage = "شناسه ثبت‌نام برای تأیید پیدا نشد.";
                return;
            }

            var result = await _api.ApproveEnrollmentAsync(enrollmentId);
            StatusMessage = result.Success
                ? $"ثبت‌نام «{student.FullName}» در «{result.CourseTitle}» تأیید شد."
                : result.ErrorMessage ?? "تأیید ثبت‌نام ناموفق بود.";
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

    private async Task CreateLicenseAsync()
    {
        if (SelectedStudent is null) return;

        var courseId = SelectedCourseFilter?.CourseId is > 0
            ? SelectedCourseFilter.CourseId
            : SelectedStudent.CourseId;
        if (courseId <= 0)
        {
            StatusMessage = "ابتدا یک دوره انتخاب کنید.";
            return;
        }

        IsBusy = true;
        try
        {
            var result = await _api.CreateStudentDesktopLicenseAsync(SelectedStudent.UserId, courseId);
            StatusMessage = result.Success
                ? "لایسنس دسکتاپ ایجاد شد."
                : result.ErrorMessage ?? "ایجاد لایسنس ناموفق بود.";
            if (result.Success)
                await LoadLicensesForSelectedStudentAsync();
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

    private async Task RevokeLicenseAsync(LicenseRowItem? license)
    {
        if (license is null) return;
        var confirm = MessageBox.Show(
            $"آیا لایسنس دوره «{license.CourseTitle}» غیرفعال شود؟",
            "تأیید غیرفعال‌سازی",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question,
            MessageBoxResult.No,
            MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);
        if (confirm != MessageBoxResult.Yes) return;

        await RunLicenseActionAsync(license.EnrollmentId, id => _api.RevokeStudentDesktopLicenseAsync(id), "لایسنس غیرفعال شد.");
    }

    private async Task RenewLicenseAsync(LicenseRowItem? license)
    {
        if (license is null) return;
        await RunLicenseActionAsync(license.EnrollmentId, id => _api.RenewStudentDesktopLicenseAsync(id), "لایسنس تمدید شد.");
    }

    private async Task RegenerateLicenseAsync(LicenseRowItem? license)
    {
        if (license is null) return;
        var confirm = MessageBox.Show(
            $"کلید جدید برای «{license.CourseTitle}» صادر شود؟ کلید قبلی دیگر معتبر نخواهد بود.",
            "تأیید صدور کلید جدید",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning,
            MessageBoxResult.No,
            MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);
        if (confirm != MessageBoxResult.Yes) return;

        await RunLicenseActionAsync(license.EnrollmentId, id => _api.RegenerateStudentDesktopLicenseAsync(id), "کلید لایسنس جدید صادر شد.");
    }

    private async Task RunLicenseActionAsync(
        long enrollmentId,
        Func<long, Task<DesktopLicenseOperationResult>> action,
        string successMessage)
    {
        if (enrollmentId <= 0) return;

        IsBusy = true;
        try
        {
            var result = await action(enrollmentId);
            StatusMessage = result.Success ? successMessage : result.ErrorMessage ?? "عملیات ناموفق بود.";
            if (result.Success)
                await LoadLicensesForSelectedStudentAsync();
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

    private void CopyLicenseKey(LicenseRowItem? license)
    {
        if (license is null || string.IsNullOrWhiteSpace(license.LicenseKey) || license.LicenseKey == "—") return;
        Clipboard.SetText(license.LicenseKey);
        StatusMessage = "کلید لایسنس در کلیپ‌بورد کپی شد.";
    }

    private void OnCourseContextChanged()
    {
        if (_courseContext.SelectedCourseId is not > 0) return;
        SelectedCourseFilter = CourseFilters.FirstOrDefault(c => c.CourseId == _courseContext.SelectedCourseId)
            ?? SelectedCourseFilter;
    }

    private void RaiseCommandStates()
    {
        ((AsyncRelayCommand)RefreshCommand).RaiseCanExecuteChanged();
        ((RelayCommand)SearchCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)NextPageCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)PreviousPageCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<StudentRowItem>)RemoveStudentCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<StudentRowItem>)ApproveEnrollmentCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)CreateLicenseCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<LicenseRowItem>)RevokeLicenseCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<LicenseRowItem>)RenewLicenseCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<LicenseRowItem>)RegenerateLicenseCommand).RaiseCanExecuteChanged();
        ((RelayCommand<LicenseRowItem>)CopyLicenseKeyCommand).RaiseCanExecuteChanged();
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

public sealed class CourseFilterItem
{
    public CourseFilterItem(long courseId, string title)
    {
        CourseId = courseId;
        Title = title;
    }

    public long CourseId { get; }
    public string Title { get; }
}

public sealed class StudentRowItem
{
    public StudentRowItem(DesktopEnrolledStudent source)
    {
        StudentId = source.StudentId;
        UserId = source.UserId;
        FullName = source.FullName;
        UserName = source.UserName ?? "—";
        Email = source.Email ?? "—";
        CourseId = source.CourseId;
        CourseTitle = source.CourseTitle;
        EnrollmentDateTime = source.EnrollmentDateTime;
        IsActive = source.IsActive;
        StatusLabel = source.IsActive ? "فعال" : "در انتظار تأیید";
        Initials = BuildInitials(source.FullName);
    }

    public long StudentId { get; }
    public long UserId { get; }
    public string FullName { get; }
    public string UserName { get; }
    public string Email { get; }
    public long CourseId { get; }
    public string CourseTitle { get; }
    public string EnrollmentDateTime { get; }
    public bool IsActive { get; }
    public string StatusLabel { get; }
    public string Initials { get; }
    public Visibility ApproveVisibility => IsActive ? Visibility.Collapsed : Visibility.Visible;

    private static string BuildInitials(string fullName)
    {
        var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0) return "؟";
        if (parts.Length == 1) return parts[0][..Math.Min(1, parts[0].Length)];
        return $"{parts[0][0]}{parts[^1][0]}";
    }
}

public sealed class LicenseRowItem
{
    public LicenseRowItem(DesktopStudentDesktopLicense source)
    {
        EnrollmentId = source.EnrollmentId;
        CourseTitle = source.CourseTitle;
        LicenseKey = source.DesktopLicenseKey ?? "—";
        ExpiresLabel = source.DesktopLicenseExpiresAtUtc?.ToLocalTime().ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture) ?? "—";
        IsCurrentlyValid = source.IsCurrentlyValid;
        StatusLabel = source.IsCurrentlyValid
            ? "معتبر"
            : source.IsDesktopLicenseActive ? "منقضی" : "غیرفعال";
    }

    public long EnrollmentId { get; }
    public string CourseTitle { get; }
    public string LicenseKey { get; }
    public string ExpiresLabel { get; }
    public string StatusLabel { get; }
    public bool IsCurrentlyValid { get; }
}
