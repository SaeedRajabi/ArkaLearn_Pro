using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Application.Drm.Commands;
using MediatR;
using Microsoft.Win32;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class PlayerViewModel : INotifyPropertyChanged, IPageReady, IAsyncDisposable
{
    private readonly IMediator _mediator;
    private readonly ISecurePlaybackService _playback;
    private readonly IDesktopApiClient _api;
    private readonly IDesktopLicenseStore _licenseStore;
    private readonly IAuthSessionStore _sessionStore;
    private readonly IWatchPositionStore _watchPositions;
    private readonly ISecureMaterialDownloadService _materialDownload;
    private readonly List<DesktopLicensedCourse> _discoverableCourses = new();
    private readonly List<DesktopLicensedCourse> _unlockedCourses = new();
    private readonly Dictionary<long, long> _enrollmentByCourseId = new();
    private readonly Dictionary<long, string> _licenseKeyByCourseId = new();
    private TeacherListItemVm? _selectedTeacher;
    private DesktopLicensedCourse? _selectedCourse;
    private CurriculumLessonVm? _selectedLesson;
    private string _licenseKeyInput = string.Empty;
    private string? _statusMessage;
    private string? _playbackErrorMessage;
    private string? _activeCourseTitle;
    private long _activeCourseId;
    private long _activeEnrollmentId;
    private long _activeMediaAssetId;
    private int _resumePositionSeconds;
    private int _lastKnownPositionSeconds;
    private bool _isBusy;
    private bool _isLicenseUnlocked;
    private bool _isInitialized;
    private bool _isAddingAnotherLicense;
    private bool _isAwaitingTeacherLicense;
    private PlayerCatalogStep _catalogStep = PlayerCatalogStep.Teachers;
    private Uri? _playbackUri;
    private bool _isBuffering;
    private bool _isPreparingPlayback;
    private double _bufferProgress = -1;
    private string _watermarkText = "آرکا نرم‌افزار";
    private string _watermarkLine1 = string.Empty;
    private string _watermarkLine2 = string.Empty;
    private int _watermarkFontSize = 10;
    private string _watermarkFontColor = "#F3F4F6";
    private double _watermarkOpacity = 0.55;
    private HorizontalAlignment _watermarkHorizontalAlignment = HorizontalAlignment.Left;
    private VerticalAlignment _watermarkVerticalAlignment = VerticalAlignment.Top;
    private double _watermarkRotationDeg;
    private DesktopWatermarkMovement _watermarkMovement = DesktopWatermarkMovement.None;
    private Thickness _watermarkMargin = new(10);
    private bool _showPlatformLogo = true;
    private int _lastHeartbeatPositionSeconds;

    public PlayerViewModel(
        IMediator mediator,
        ISecurePlaybackService playback,
        IDesktopApiClient api,
        IDesktopLicenseStore licenseStore,
        IAuthSessionStore sessionStore,
        IWatchPositionStore watchPositions,
        ISecureMaterialDownloadService materialDownload)
    {
        _mediator = mediator;
        _playback = playback;
        _api = api;
        _licenseStore = licenseStore;
        _sessionStore = sessionStore;
        _watchPositions = watchPositions;
        _materialDownload = materialDownload;
        Teachers = new ObservableCollection<TeacherListItemVm>();
        TeacherCourses = new ObservableCollection<DesktopLicensedCourse>();
        CurriculumSections = new ObservableCollection<CurriculumSectionVm>();
        ValidateLicenseCommand = new AsyncRelayCommand(ValidateLicenseAsync, () => !IsBusy && !string.IsNullOrWhiteSpace(LicenseKeyInput));
        ClearLicenseCommand = new RelayCommand(ClearLicenseSession, () => IsLicenseUnlocked && !IsBusy && !IsAddingAnotherLicense && !IsAwaitingTeacherLicense);
        ShowAddLicenseCommand = new RelayCommand(ShowAddLicenseEntry, () => !IsBusy && !IsAddingAnotherLicense && !IsAwaitingTeacherLicense && _selectedTeacher is not null);
        CancelAddLicenseCommand = new RelayCommand(CancelAddLicenseEntry, () => (IsAddingAnotherLicense || IsAwaitingTeacherLicense) && !IsBusy);
        GoBackCatalogCommand = new RelayCommand(GoBackCatalog, () => !IsBusy && !IsAddingAnotherLicense && !IsAwaitingTeacherLicense && CatalogStep != PlayerCatalogStep.Teachers);
        PlayLessonCommand = new AsyncRelayCommand(PlaySelectedLessonAsync, () => IsLicenseUnlocked && SelectedLesson is not null && SelectedLesson.CanPlay && !IsBusy && !IsPreparingPlayback);
        DownloadMaterialCommand = new AsyncRelayCommand<CurriculumMaterialVm>(
            DownloadMaterialAsync,
            material => IsLicenseUnlocked && material is not null && material.MediaAssetId > 0 && !IsBusy);
        StopCommand = new RelayCommand(StopPlayback, () => PlaybackUri is not null);
        DismissPlaybackErrorCommand = new RelayCommand(ClearPlaybackError);
        StatusMessage = "در حال بارگذاری استادهایی که دوره لایسنس ویندوزی دارید...";

        _playback.BufferingChanged += OnPlaybackBufferingChanged;
        _playback.DownloadProgressChanged += OnDownloadProgressChanged;
    }

    public async Task InitializeAsync()
    {
        if (_isInitialized) return;
        _isInitialized = true;

        await ApplyFallbackWatermarkAsync();
        await LoadDiscoverableTeachersAsync();
        await RestoreUnlockedCoursesAsync();
    }

    private async Task ApplyFallbackWatermarkAsync()
    {
        try
        {
            var user = await _sessionStore.GetCurrentUserAsync();
            if (user is null) return;

            var name = string.IsNullOrWhiteSpace(user.DisplayName) ? user.UserName : user.DisplayName;
            WatermarkText = name;
            WatermarkLine1 = name;
            WatermarkLine2 = string.IsNullOrWhiteSpace(user.Email)
                ? $"آرکا · {user.UserName}"
                : $"آرکا · {user.Email}";
        }
        catch
        {
            // keep defaults
        }
    }

    private async Task LoadCourseWatermarkAsync(long courseId)
    {
        if (courseId <= 0) return;

        try
        {
            var payload = await _api.GetWatermarkForPlaybackAsync(courseId);
            if (payload is null)
            {
                await ApplyFallbackWatermarkAsync();
                return;
            }

            var policy = payload.Policy;
            var student = payload.Student;
            WatermarkText = RenderWatermarkTemplate(policy.TextTemplate, student);
            WatermarkLine1 = WatermarkText;
            WatermarkLine2 = string.Empty;
            WatermarkFontSize = Math.Clamp(policy.FontSize, 8, 48);
            WatermarkFontColor = policy.FontColor;
            WatermarkOpacity = Math.Clamp(policy.Opacity, 0.1, 1.0);
            (WatermarkHorizontalAlignment, WatermarkVerticalAlignment) = MapWatermarkPosition(policy.Position);
            WatermarkRotationDeg = policy.RotationDeg;
            WatermarkMovement = policy.Movement;
            WatermarkMargin = new Thickness(Math.Max(0, policy.PaddingPx));
            ShowPlatformLogo = policy.PlatformLogoLocked;
        }
        catch
        {
            await ApplyFallbackWatermarkAsync();
        }
    }

    private static string RenderWatermarkTemplate(string template, DesktopWatermarkStudentFields student)
    {
        var text = string.IsNullOrWhiteSpace(template) ? "{FullName} | {Email}" : template;
        return text
            .Replace("{FullName}", student.FullName ?? string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("{Email}", student.Email ?? string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("{Phone}", student.Phone ?? string.Empty, StringComparison.OrdinalIgnoreCase)
            .Trim();
    }

    private static (HorizontalAlignment Horizontal, VerticalAlignment Vertical) MapWatermarkPosition(DesktopWatermarkPosition position) =>
        position switch
        {
            DesktopWatermarkPosition.TopRight => (HorizontalAlignment.Right, VerticalAlignment.Top),
            DesktopWatermarkPosition.BottomLeft => (HorizontalAlignment.Left, VerticalAlignment.Bottom),
            DesktopWatermarkPosition.BottomRight => (HorizontalAlignment.Right, VerticalAlignment.Bottom),
            DesktopWatermarkPosition.Center => (HorizontalAlignment.Center, VerticalAlignment.Center),
            _ => (HorizontalAlignment.Left, VerticalAlignment.Top),
        };

    public void NotifyPlaybackHeartbeat(int positionSeconds)
    {
        _lastKnownPositionSeconds = Math.Max(0, positionSeconds);
        var delta = Math.Max(0, positionSeconds - _lastHeartbeatPositionSeconds);
        _lastHeartbeatPositionSeconds = positionSeconds;
        _ = ReportTelemetryAsync(DesktopPlaybackTelemetryKind.Heartbeat, positionSeconds, delta);
        _ = PersistWatchPositionAsync(positionSeconds);
    }

    public void NotifyPlaybackComplete(int positionSeconds)
    {
        _lastKnownPositionSeconds = Math.Max(0, positionSeconds);
        _ = ReportTelemetryAsync(DesktopPlaybackTelemetryKind.Complete, positionSeconds, 0);
        if (_activeMediaAssetId > 0)
            _ = _watchPositions.SavePositionAsync(_activeMediaAssetId, 0, positionSeconds);
    }

    public void NotifyPlaybackPause(int positionSeconds)
    {
        _lastKnownPositionSeconds = Math.Max(0, positionSeconds);
        _ = ReportTelemetryAsync(DesktopPlaybackTelemetryKind.Pause, positionSeconds, 0);
        _ = PersistWatchPositionAsync(positionSeconds);
    }

    public void NotifyPlaybackSeek(int positionSeconds)
    {
        _lastKnownPositionSeconds = Math.Max(0, positionSeconds);
        _ = ReportTelemetryAsync(DesktopPlaybackTelemetryKind.Seek, positionSeconds, 0);
        _ = PersistWatchPositionAsync(positionSeconds);
    }

    public void NotifyPlaybackPlay(int positionSeconds) =>
        _ = ReportTelemetryAsync(DesktopPlaybackTelemetryKind.Play, positionSeconds, 0);

    public void ResetTelemetryTracking(int positionSeconds = 0)
    {
        _lastHeartbeatPositionSeconds = positionSeconds;
    }

    private async Task ReportTelemetryAsync(
        DesktopPlaybackTelemetryKind kind,
        int positionSeconds,
        int watchedDeltaSeconds)
    {
        if (_activeCourseId <= 0 || SelectedLesson is null || SelectedLesson.LessonId <= 0)
            return;

        try
        {
            await _api.ReportPlaybackTelemetryAsync(
                _activeCourseId,
                SelectedLesson.LessonId,
                kind,
                Math.Max(0, positionSeconds),
                Math.Max(0, watchedDeltaSeconds),
                _activeEnrollmentId > 0 ? _activeEnrollmentId : null);
        }
        catch
        {
            // Telemetry is best-effort.
        }
    }

    public string WatermarkText
    {
        get => _watermarkText;
        private set => Set(ref _watermarkText, value);
    }

    public string WatermarkLine1
    {
        get => _watermarkLine1;
        private set => Set(ref _watermarkLine1, value);
    }

    public string WatermarkLine2
    {
        get => _watermarkLine2;
        private set => Set(ref _watermarkLine2, value);
    }

    public int WatermarkFontSize
    {
        get => _watermarkFontSize;
        private set => Set(ref _watermarkFontSize, value);
    }

    public string WatermarkFontColor
    {
        get => _watermarkFontColor;
        private set
        {
            if (!Set(ref _watermarkFontColor, value)) return;
            OnPropertyChanged(nameof(WatermarkForegroundBrush));
        }
    }

    public Brush WatermarkForegroundBrush
    {
        get
        {
            try
            {
                var color = (Color)ColorConverter.ConvertFromString(_watermarkFontColor)!;
                return new SolidColorBrush(color);
            }
            catch
            {
                return new SolidColorBrush(Color.FromRgb(243, 244, 246));
            }
        }
    }

    public double WatermarkOpacity
    {
        get => _watermarkOpacity;
        private set => Set(ref _watermarkOpacity, value);
    }

    public HorizontalAlignment WatermarkHorizontalAlignment
    {
        get => _watermarkHorizontalAlignment;
        private set => Set(ref _watermarkHorizontalAlignment, value);
    }

    public VerticalAlignment WatermarkVerticalAlignment
    {
        get => _watermarkVerticalAlignment;
        private set => Set(ref _watermarkVerticalAlignment, value);
    }

    public double WatermarkRotationDeg
    {
        get => _watermarkRotationDeg;
        private set => Set(ref _watermarkRotationDeg, value);
    }

    public DesktopWatermarkMovement WatermarkMovement
    {
        get => _watermarkMovement;
        private set => Set(ref _watermarkMovement, value);
    }

    public Thickness WatermarkMargin
    {
        get => _watermarkMargin;
        private set => Set(ref _watermarkMargin, value);
    }

    public bool ShowPlatformLogo
    {
        get => _showPlatformLogo;
        private set => Set(ref _showPlatformLogo, value);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => InitializeAsync();

    public ObservableCollection<TeacherListItemVm> Teachers { get; }
    public ObservableCollection<DesktopLicensedCourse> TeacherCourses { get; }
    public ObservableCollection<CurriculumSectionVm> CurriculumSections { get; }

    public bool IsLicenseUnlocked
    {
        get => _isLicenseUnlocked;
        private set
        {
            if (!Set(ref _isLicenseUnlocked, value)) return;
            OnPropertyChanged(nameof(LicenseGateVisibility));
            OnPropertyChanged(nameof(CatalogVisibility));
            OnPropertyChanged(nameof(CancelAddLicenseVisibility));
            NotifyCatalogStepChanged();
            ((RelayCommand)ClearLicenseCommand).RaiseCanExecuteChanged();
            ((RelayCommand)ShowAddLicenseCommand).RaiseCanExecuteChanged();
            ((RelayCommand)CancelAddLicenseCommand).RaiseCanExecuteChanged();
            ((RelayCommand)GoBackCatalogCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)PlayLessonCommand).RaiseCanExecuteChanged();
        }
    }

    public bool IsAddingAnotherLicense
    {
        get => _isAddingAnotherLicense;
        private set
        {
            if (!Set(ref _isAddingAnotherLicense, value)) return;
            OnPropertyChanged(nameof(LicenseGateVisibility));
            OnPropertyChanged(nameof(CatalogVisibility));
            OnPropertyChanged(nameof(CancelAddLicenseVisibility));
            OnPropertyChanged(nameof(LicenseGateTitle));
            NotifyCatalogStepChanged();
            RaiseLicenseGateCommands();
        }
    }

    public bool IsAwaitingTeacherLicense
    {
        get => _isAwaitingTeacherLicense;
        private set
        {
            if (!Set(ref _isAwaitingTeacherLicense, value)) return;
            OnPropertyChanged(nameof(LicenseGateVisibility));
            OnPropertyChanged(nameof(CatalogVisibility));
            OnPropertyChanged(nameof(CancelAddLicenseVisibility));
            OnPropertyChanged(nameof(LicenseGateTitle));
            NotifyCatalogStepChanged();
            RaiseLicenseGateCommands();
        }
    }

    public PlayerCatalogStep CatalogStep
    {
        get => _catalogStep;
        private set
        {
            if (!Set(ref _catalogStep, value)) return;
            NotifyCatalogStepChanged();
            ((RelayCommand)GoBackCatalogCommand).RaiseCanExecuteChanged();
        }
    }

    public Visibility LicenseGateVisibility =>
        IsAwaitingTeacherLicense || IsAddingAnotherLicense ? Visibility.Visible : Visibility.Collapsed;
    public Visibility CatalogVisibility =>
        !IsAwaitingTeacherLicense && !IsAddingAnotherLicense ? Visibility.Visible : Visibility.Collapsed;
    public Visibility CancelAddLicenseVisibility =>
        IsAddingAnotherLicense || IsAwaitingTeacherLicense ? Visibility.Visible : Visibility.Collapsed;
    public string LicenseGateTitle =>
        IsAddingAnotherLicense
            ? "افزودن لایسنس دوره دیگر"
            : _selectedTeacher is null
                ? "کلید لایسنس"
                : $"لایسنس دوره — {_selectedTeacher.TeacherName}";

    public Visibility TeachersStepVisibility =>
        !IsAwaitingTeacherLicense && !IsAddingAnotherLicense && CatalogStep == PlayerCatalogStep.Teachers
            ? Visibility.Visible
            : Visibility.Collapsed;
    public Visibility CoursesStepVisibility =>
        !IsAwaitingTeacherLicense && !IsAddingAnotherLicense && CatalogStep == PlayerCatalogStep.Courses
            ? Visibility.Visible
            : Visibility.Collapsed;
    public Visibility CourseContentStepVisibility =>
        !IsAwaitingTeacherLicense && !IsAddingAnotherLicense && CatalogStep == PlayerCatalogStep.CourseContent
            ? Visibility.Visible
            : Visibility.Collapsed;
    public Visibility GoBackButtonVisibility =>
        !IsAwaitingTeacherLicense && !IsAddingAnotherLicense && CatalogStep != PlayerCatalogStep.Teachers
            ? Visibility.Visible
            : Visibility.Collapsed;

    public string CatalogStepTitle => CatalogStep switch
    {
        PlayerCatalogStep.Courses => _selectedTeacher is null
            ? "دوره‌ها"
            : $"دوره‌های {_selectedTeacher.TeacherName}",
        PlayerCatalogStep.CourseContent => "سرفصل دوره",
        _ => "استادها",
    };

    public TeacherListItemVm? SelectedTeacher
    {
        get => _selectedTeacher;
        set
        {
            if (!Set(ref _selectedTeacher, value)) return;
            if (value is null)
            {
                TeacherCourses.Clear();
                return;
            }

            var unlockedForTeacher = _unlockedCourses.Count(c => c.TeacherId == value.TeacherId);
            if (unlockedForTeacher == 0)
            {
                LicenseKeyInput = string.Empty;
                IsAwaitingTeacherLicense = true;
                StatusMessage = $"برای مشاهده دوره‌های {value.TeacherName}، لایسنس همان دوره را وارد کنید.";
                return;
            }

            IsAwaitingTeacherLicense = false;
            LoadCoursesForSelectedTeacher();
            CatalogStep = PlayerCatalogStep.Courses;
            StatusMessage = $"{TeacherCourses.Count} دوره بازشده از {value.TeacherName} — برای ورود یک دوره را انتخاب کنید. برای دوره دیگر + را بزنید.";
        }
    }

    public DesktopLicensedCourse? SelectedCourse
    {
        get => _selectedCourse;
        set
        {
            if (!Set(ref _selectedCourse, value)) return;
            if (value is not null && IsLicenseUnlocked)
            {
                CatalogStep = PlayerCatalogStep.CourseContent;
                _ = LoadCurriculumForCourseAsync(value.CourseId, value.DesktopLicenseKey);
            }
            else
            {
                CurriculumSections.Clear();
                SelectedLesson = null;
                ActiveCourseTitle = null;
                _activeCourseId = 0;
            }
        }
    }

    public CurriculumLessonVm? SelectedLesson
    {
        get => _selectedLesson;
        set
        {
            if (value is { IsLocked: true })
                value = null;
            var previous = _selectedLesson;
            if (!Set(ref _selectedLesson, value)) return;
            if (previous is not null)
                previous.IsSelected = false;
            if (_selectedLesson is not null)
                _selectedLesson.IsSelected = true;
            ((AsyncRelayCommand)PlayLessonCommand).RaiseCanExecuteChanged();
        }
    }

    public string LicenseKeyInput
    {
        get => _licenseKeyInput;
        set
        {
            if (!Set(ref _licenseKeyInput, value)) return;
            ((AsyncRelayCommand)ValidateLicenseCommand).RaiseCanExecuteChanged();
        }
    }

    public string? ActiveCourseTitle
    {
        get => _activeCourseTitle;
        set
        {
            if (!Set(ref _activeCourseTitle, value)) return;
            OnPropertyChanged(nameof(CatalogStepTitle));
        }
    }

    public string? StatusMessage
    {
        get => _statusMessage;
        set => Set(ref _statusMessage, value);
    }

    public string? PlaybackErrorMessage
    {
        get => _playbackErrorMessage;
        set
        {
            if (!Set(ref _playbackErrorMessage, value)) return;
            OnPropertyChanged(nameof(PlaybackErrorVisibility));
        }
    }

    public Visibility PlaybackErrorVisibility =>
        string.IsNullOrWhiteSpace(PlaybackErrorMessage) ? Visibility.Collapsed : Visibility.Visible;

    public bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (!Set(ref _isBusy, value)) return;
            ((AsyncRelayCommand)ValidateLicenseCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)PlayLessonCommand).RaiseCanExecuteChanged();
            RaiseLicenseGateCommands();
            ((AsyncRelayCommand<CurriculumMaterialVm>)DownloadMaterialCommand).RaiseCanExecuteChanged();
        }
    }

    private void RaiseLicenseGateCommands()
    {
        ((RelayCommand)ClearLicenseCommand).RaiseCanExecuteChanged();
        ((RelayCommand)ShowAddLicenseCommand).RaiseCanExecuteChanged();
        ((RelayCommand)CancelAddLicenseCommand).RaiseCanExecuteChanged();
        ((RelayCommand)GoBackCatalogCommand).RaiseCanExecuteChanged();
    }

    public Uri? PlaybackUri
    {
        get => _playbackUri;
        set
        {
            if (!Set(ref _playbackUri, value)) return;
            ((RelayCommand)StopCommand).RaiseCanExecuteChanged();
        }
    }

    public bool IsBuffering
    {
        get => _isBuffering;
        set
        {
            if (!Set(ref _isBuffering, value)) return;
            OnPropertyChanged(nameof(VideoLoadingVisibility));
        }
    }

    public bool IsPreparingPlayback
    {
        get => _isPreparingPlayback;
        set
        {
            if (!Set(ref _isPreparingPlayback, value)) return;
            OnPropertyChanged(nameof(VideoLoadingVisibility));
            OnPropertyChanged(nameof(BufferingStatusText));
            OnPropertyChanged(nameof(BufferProgressText));
            ((AsyncRelayCommand)PlayLessonCommand).RaiseCanExecuteChanged();
        }
    }

    public double BufferProgress
    {
        get => _bufferProgress;
        set
        {
            if (!Set(ref _bufferProgress, value)) return;
            OnPropertyChanged(nameof(BufferingStatusText));
            OnPropertyChanged(nameof(BufferProgressText));
            OnPropertyChanged(nameof(HasBufferProgress));
        }
    }

    public bool HasBufferProgress => BufferProgress >= 0;

    public string BufferProgressText =>
        BufferProgress >= 0 ? $"{BufferProgress:0}٪" : string.Empty;

    public Visibility VideoLoadingVisibility =>
        IsBuffering || IsPreparingPlayback ? Visibility.Visible : Visibility.Collapsed;

    public string BufferingStatusText =>
        IsPreparingPlayback
            ? "در حال آماده‌سازی پخش امن..."
            : "در حال بارگذاری بخش بعدی...";

    /// <summary>Seconds to seek after MediaOpened (0 = start).</summary>
    public int ResumePositionSeconds => _resumePositionSeconds;

    public ICommand ValidateLicenseCommand { get; }
    public ICommand ClearLicenseCommand { get; }
    public ICommand ShowAddLicenseCommand { get; }
    public ICommand CancelAddLicenseCommand { get; }
    public ICommand GoBackCatalogCommand { get; }
    public ICommand PlayLessonCommand { get; }
    public ICommand DownloadMaterialCommand { get; }
    public ICommand DismissPlaybackErrorCommand { get; }
    public ICommand StopCommand { get; }

    private void NotifyCatalogStepChanged()
    {
        OnPropertyChanged(nameof(TeachersStepVisibility));
        OnPropertyChanged(nameof(CoursesStepVisibility));
        OnPropertyChanged(nameof(CourseContentStepVisibility));
        OnPropertyChanged(nameof(GoBackButtonVisibility));
        OnPropertyChanged(nameof(CatalogStepTitle));
    }

    private void ShowAddLicenseEntry()
    {
        StopPlayback();
        LicenseKeyInput = string.Empty;
        IsAddingAnotherLicense = true;
        StatusMessage = _selectedTeacher is null
            ? "کلید لایسنس دوره جدید را وارد کنید."
            : $"لایسنس دوره دیگر از {_selectedTeacher.TeacherName} را وارد کنید.";
    }

    private void CancelAddLicenseEntry()
    {
        LicenseKeyInput = string.Empty;
        if (IsAddingAnotherLicense)
        {
            IsAddingAnotherLicense = false;
            StatusMessage = _selectedTeacher is null
                ? $"{Teachers.Count} استاد — روی یک استاد بزنید."
                : $"{TeacherCourses.Count} دوره بازشده — برای دوره دیگر + را بزنید.";
            return;
        }

        if (IsAwaitingTeacherLicense)
        {
            IsAwaitingTeacherLicense = false;
            _selectedTeacher = null;
            OnPropertyChanged(nameof(SelectedTeacher));
            CatalogStep = PlayerCatalogStep.Teachers;
            StatusMessage = $"{Teachers.Count} استاد — روی یک استاد بزنید تا لایسنس دوره را وارد کنید.";
        }
    }

    private async Task ValidateLicenseAsync() => await ValidateLicenseAsync(showBusyState: true);

    private async Task ValidateLicenseAsync(bool showBusyState)
    {
        if (showBusyState) IsBusy = true;
        var pendingTeacher = _selectedTeacher;
        StatusMessage = "در حال تأیید کلید لایسنس...";
        try
        {
            var result = await _api.ValidateDesktopLicenseAsync(LicenseKeyInput);
            if (!result.Success)
            {
                ShowPlaybackError(SanitizeApiError(result.ErrorMessage, "کلید لایسنس نامعتبر، غیرفعال یا منقضی شده است."));
                return;
            }

            var meta = _discoverableCourses.FirstOrDefault(c => c.CourseId == result.CourseId);
            var teacherId = meta?.TeacherId ?? pendingTeacher?.TeacherId ?? 0;
            var teacherName = meta?.TeacherName
                ?? pendingTeacher?.TeacherName
                ?? "مدرس";

            if (pendingTeacher is not null && teacherId > 0 && teacherId != pendingTeacher.TeacherId)
            {
                ShowPlaybackError("این لایسنس متعلق به استاد انتخاب‌شده نیست. استاد درست را انتخاب کنید یا لایسنس همان استاد را وارد کنید.");
                return;
            }

            var unlocked = new DesktopLicensedCourse(
                result.CourseId,
                string.IsNullOrWhiteSpace(result.CourseTitle) ? (meta?.CourseTitle ?? "دوره") : result.CourseTitle,
                result.LicenseKey,
                true,
                teacherId,
                teacherName);

            _unlockedCourses.RemoveAll(c => c.CourseId == unlocked.CourseId);
            _unlockedCourses.Add(unlocked);
            _enrollmentByCourseId[result.CourseId] = result.EnrollmentId;
            _licenseKeyByCourseId[result.CourseId] = result.LicenseKey;
            _activeEnrollmentId = result.EnrollmentId;

            await _licenseStore.SaveUnlockedCourseAsync(new UnlockedCourseLicense(
                unlocked.CourseId,
                result.EnrollmentId,
                result.LicenseKey,
                unlocked.CourseTitle,
                unlocked.TeacherId,
                unlocked.TeacherName));

            IsLicenseUnlocked = true;
            IsAddingAnotherLicense = false;
            IsAwaitingTeacherLicense = false;
            LicenseKeyInput = string.Empty;

            if (pendingTeacher is null || pendingTeacher.TeacherId != unlocked.TeacherId)
            {
                _selectedTeacher = Teachers.FirstOrDefault(t => t.TeacherId == unlocked.TeacherId)
                    ?? new TeacherListItemVm(unlocked.TeacherId, unlocked.TeacherName, 1);
                OnPropertyChanged(nameof(SelectedTeacher));
            }

            LoadCoursesForSelectedTeacher();
            CatalogStep = PlayerCatalogStep.Courses;
            StatusMessage = $"دوره «{unlocked.CourseTitle}» باز شد. فقط دوره‌هایی که لایسنس‌شان را وارد کرده‌اید نمایش داده می‌شوند.";
        }
        catch (Exception ex)
        {
            ShowPlaybackError(ToUserFriendlyError(ex, "تأیید لایسنس ممکن نشد. لطفاً دوباره تلاش کنید."));
        }
        finally
        {
            if (showBusyState) IsBusy = false;
        }
    }

    private async Task LoadDiscoverableTeachersAsync()
    {
        try
        {
            IsBusy = true;
            StatusMessage = "در حال دریافت لیست استادها...";
            var courses = await _api.GetMyLicensedCoursesAsync();
            _discoverableCourses.Clear();
            _discoverableCourses.AddRange(courses.Where(c => c.IsActive && c.TeacherId > 0));
            RebuildTeachersFromDiscoverable();
            CatalogStep = PlayerCatalogStep.Teachers;
            StatusMessage = Teachers.Count == 0
                ? "دوره لایسنس ویندوزی فعالی در حساب شما یافت نشد."
                : $"{Teachers.Count} استاد — روی یک استاد بزنید و لایسنس همان دوره را وارد کنید.";
        }
        catch (Exception ex)
        {
            ShowPlaybackError(ToUserFriendlyError(ex, "بارگذاری لیست استادها ممکن نشد."));
            StatusMessage = "بارگذاری استادها ناموفق بود. اتصال اینترنت را بررسی کنید.";
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task RestoreUnlockedCoursesAsync()
    {
        try
        {
            var saved = await _licenseStore.GetUnlockedCoursesAsync();
            if (saved.Count == 0) return;

            foreach (var row in saved)
            {
                if (row.CourseId <= 0 || string.IsNullOrWhiteSpace(row.LicenseKey))
                {
                    // Legacy single key — re-validate to recover course identity.
                    if (string.IsNullOrWhiteSpace(row.LicenseKey)) continue;
                    var legacy = await _api.ValidateDesktopLicenseAsync(row.LicenseKey);
                    if (!legacy.Success) continue;
                    await UnlockFromValidationAsync(legacy);
                    continue;
                }

                var result = await _api.ValidateDesktopLicenseAsync(row.LicenseKey);
                if (!result.Success) continue;
                await UnlockFromValidationAsync(result, persist: false);
            }

            // Fill teacher metadata for restored rows that only had a key.
            for (var i = 0; i < _unlockedCourses.Count; i++)
            {
                var course = _unlockedCourses[i];
                if (course.TeacherId > 0) continue;
                var meta = _discoverableCourses.FirstOrDefault(c => c.CourseId == course.CourseId);
                if (meta is null) continue;
                _unlockedCourses[i] = course with
                {
                    TeacherId = meta.TeacherId,
                    TeacherName = meta.TeacherName,
                    CourseTitle = string.IsNullOrWhiteSpace(course.CourseTitle) ? meta.CourseTitle : course.CourseTitle,
                };
            }

            IsLicenseUnlocked = _unlockedCourses.Count > 0;
            RebuildTeachersFromDiscoverable();
        }
        catch
        {
            // Keep discovery list; user can re-enter keys.
        }
    }

    private async Task UnlockFromValidationAsync(DesktopLicenseValidationResult result, bool persist = true)
    {
        var meta = _discoverableCourses.FirstOrDefault(c => c.CourseId == result.CourseId);
        var unlocked = new DesktopLicensedCourse(
            result.CourseId,
            string.IsNullOrWhiteSpace(result.CourseTitle) ? (meta?.CourseTitle ?? "دوره") : result.CourseTitle,
            result.LicenseKey,
            true,
            meta?.TeacherId ?? 0,
            meta?.TeacherName ?? "مدرس");

        _unlockedCourses.RemoveAll(c => c.CourseId == unlocked.CourseId);
        _unlockedCourses.Add(unlocked);
        _enrollmentByCourseId[result.CourseId] = result.EnrollmentId;
        _licenseKeyByCourseId[result.CourseId] = result.LicenseKey;

        if (persist)
        {
            await _licenseStore.SaveUnlockedCourseAsync(new UnlockedCourseLicense(
                unlocked.CourseId,
                result.EnrollmentId,
                result.LicenseKey,
                unlocked.CourseTitle,
                unlocked.TeacherId,
                unlocked.TeacherName));
        }
    }

    private void GoBackCatalog()
    {
        if (CatalogStep == PlayerCatalogStep.CourseContent)
        {
            ParkPlaybackSession();
            CurriculumSections.Clear();
            SelectedLesson = null;
            ActiveCourseTitle = null;
            _activeCourseId = 0;
            _selectedCourse = null;
            OnPropertyChanged(nameof(SelectedCourse));
            CatalogStep = PlayerCatalogStep.Courses;
            StatusMessage = _selectedTeacher is null
                ? "یک دوره را انتخاب کنید."
                : $"{TeacherCourses.Count} دوره بازشده از {_selectedTeacher.TeacherName}.";
            return;
        }

        if (CatalogStep == PlayerCatalogStep.Courses)
        {
            TeacherCourses.Clear();
            _selectedTeacher = null;
            OnPropertyChanged(nameof(SelectedTeacher));
            _selectedCourse = null;
            OnPropertyChanged(nameof(SelectedCourse));
            CatalogStep = PlayerCatalogStep.Teachers;
            StatusMessage = $"{Teachers.Count} استاد — روی یک استاد بزنید تا لایسنس دوره را وارد کنید.";
        }
    }

    private async void ClearLicenseSession()
    {
        StopPlayback();
        _playback.EvictAllSessions();
        await _licenseStore.ClearAllUnlockedAsync();
        IsLicenseUnlocked = false;
        IsAddingAnotherLicense = false;
        IsAwaitingTeacherLicense = false;
        CatalogStep = PlayerCatalogStep.Teachers;
        _unlockedCourses.Clear();
        TeacherCourses.Clear();
        CurriculumSections.Clear();
        _selectedTeacher = null;
        OnPropertyChanged(nameof(SelectedTeacher));
        _selectedCourse = null;
        OnPropertyChanged(nameof(SelectedCourse));
        SelectedLesson = null;
        ActiveCourseTitle = null;
        _activeCourseId = 0;
        _activeEnrollmentId = 0;
        _enrollmentByCourseId.Clear();
        _licenseKeyByCourseId.Clear();
        LicenseKeyInput = string.Empty;
        RebuildTeachersFromDiscoverable();
        StatusMessage = Teachers.Count == 0
            ? "دوره لایسنس ویندوزی فعالی یافت نشد."
            : $"{Teachers.Count} استاد — روی یک استاد بزنید و لایسنس را وارد کنید.";
    }

    private void RebuildTeachersFromDiscoverable()
    {
        Teachers.Clear();
        TeacherCourses.Clear();
        CurriculumSections.Clear();
        _selectedCourse = null;
        OnPropertyChanged(nameof(SelectedCourse));
        SelectedLesson = null;

        foreach (var group in _discoverableCourses
                     .GroupBy(c => new { c.TeacherId, Name = string.IsNullOrWhiteSpace(c.TeacherName) ? "مدرس" : c.TeacherName })
                     .OrderBy(g => g.Key.Name))
        {
            var unlockedCount = _unlockedCourses.Count(c => c.TeacherId == group.Key.TeacherId);
            Teachers.Add(new TeacherListItemVm(group.Key.TeacherId, group.Key.Name, unlockedCount > 0 ? unlockedCount : group.Count()));
        }
    }

    private void LoadCoursesForSelectedTeacher()
    {
        TeacherCourses.Clear();
        CurriculumSections.Clear();
        _selectedCourse = null;
        OnPropertyChanged(nameof(SelectedCourse));
        SelectedLesson = null;
        ActiveCourseTitle = null;
        _activeCourseId = 0;

        if (_selectedTeacher is null)
            return;

        // Only courses unlocked by entering their own license key.
        foreach (var course in _unlockedCourses.Where(c => c.TeacherId == _selectedTeacher.TeacherId))
            TeacherCourses.Add(course);
    }

    private async Task LoadCurriculumForCourseAsync(long courseId, string? licenseKey)
    {
        if (!IsLicenseUnlocked)
        {
            ShowPlaybackError("ابتدا لایسنس را تأیید کنید.");
            return;
        }

        IsBusy = true;
        ClearPlaybackError();
        StatusMessage = "در حال بارگذاری سرفصل‌ها و درس‌ها...";
        CurriculumSections.Clear();
        SelectedLesson = null;

        try
        {
            var curriculum = await _api.GetCourseCurriculumAsync(courseId, licenseKey);
            if (curriculum is null)
            {
                ShowPlaybackError("سرفصل دوره یافت نشد یا به این دوره دسترسی ندارید.");
                ActiveCourseTitle = null;
                _activeCourseId = 0;
                return;
            }

            _activeCourseId = curriculum.CourseId;
            ActiveCourseTitle = curriculum.CourseTitle;
            _activeEnrollmentId = _enrollmentByCourseId.GetValueOrDefault(curriculum.CourseId);
            await LoadCourseWatermarkAsync(curriculum.CourseId);

            foreach (var section in curriculum.Sections)
            {
                var sectionVm = new CurriculumSectionVm(section);
                foreach (var lesson in section.Lessons)
                    sectionVm.Lessons.Add(new CurriculumLessonVm(lesson));
                CurriculumSections.Add(sectionVm);
            }

            var lessonCount = curriculum.Sections.Sum(s => s.Lessons.Count);
            var lockedCount = curriculum.Sections.Sum(s => s.Lessons.Count(l => l.IsLocked));
            StatusMessage = lockedCount > 0
                ? $"{lessonCount} درس در {curriculum.Sections.Count} سرفصل — {lockedCount} درس خارج از دسترسی لایسنس."
                : $"{lessonCount} درس در {curriculum.Sections.Count} سرفصل بارگذاری شد.";
        }
        catch (Exception ex)
        {
            ShowPlaybackError(ToUserFriendlyError(ex, "بارگذاری سرفصل دوره ممکن نشد. لطفاً دوباره تلاش کنید."));
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task PlaySelectedLessonAsync()
    {
        if (!IsLicenseUnlocked)
        {
            ShowPlaybackError("ابتدا لایسنس را تأیید کنید.");
            return;
        }

        if (SelectedLesson is null || !SelectedLesson.CanPlay) return;
        if (_activeCourseId <= 0)
        {
            ShowPlaybackError("ابتدا یک دوره را انتخاب کنید.");
            return;
        }

        var mediaAssetId = SelectedLesson.MediaAssetId;
        IsBusy = true;
        IsPreparingPlayback = true;
        IsBuffering = false;
        BufferProgress = -1;
        ClearPlaybackError();
        StatusMessage = "در حال بارگذاری تدریجی و آماده‌سازی پخش...";
        try
        {
            await PersistWatchPositionAsync(_lastKnownPositionSeconds);
            // Soft-park previous lesson session so switching back is instant (no re-download/decrypt).
            ParkPlaybackSession();

            var savedPosition = await _watchPositions.GetPositionSecondsAsync(mediaAssetId);
            _resumePositionSeconds = savedPosition ?? 0;
            OnPropertyChanged(nameof(ResumePositionSeconds));

            var result = await _mediator.Send(new PlayEncryptedMediaCommand(
                mediaAssetId,
                _activeCourseId,
                null,
                null));

            if (!result.Success || result.PlaybackUri is null)
            {
                ShowPlaybackError(SanitizeApiError(result.ErrorMessage, "پخش درس ممکن نشد. لطفاً دوباره تلاش کنید."));
                IsPreparingPlayback = false;
                return;
            }

            _activeMediaAssetId = mediaAssetId;
            PlaybackUri = result.PlaybackUri;
            ResetTelemetryTracking(_resumePositionSeconds);
            StatusMessage = _resumePositionSeconds > 0
                ? $"ادامه از {FormatClock(_resumePositionSeconds)} — {SelectedLesson.Title}"
                : $"پخش امن: {SelectedLesson.Title}";
            // IsPreparingPlayback stays true until NotifyMediaOpened().
        }
        catch (Exception ex)
        {
            ShowPlaybackError(ToUserFriendlyError(ex, "پخش درس ممکن نشد. لطفاً دوباره تلاش کنید."));
            IsPreparingPlayback = false;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task DownloadMaterialAsync(CurriculumMaterialVm? material)
    {
        if (material is null || _activeCourseId <= 0)
            return;

        var suggestedName = SanitizeFileName(
            string.IsNullOrWhiteSpace(material.OriginalFileName)
                ? material.DisplayName
                : material.OriginalFileName);
        var extension = Path.GetExtension(suggestedName);
        var dialog = new SaveFileDialog
        {
            Title = $"ذخیره {material.DisplayName}",
            FileName = string.IsNullOrWhiteSpace(suggestedName) ? $"handout-{material.MaterialId}" : suggestedName,
            Filter = string.IsNullOrWhiteSpace(extension)
                ? "همه فایل‌ها|*.*"
                : $"فایل {extension}|*{extension}|همه فایل‌ها|*.*",
            AddExtension = !string.IsNullOrWhiteSpace(extension),
            DefaultExt = extension,
        };
        if (dialog.ShowDialog() != true)
            return;

        IsBusy = true;
        ClearPlaybackError();
        StatusMessage = $"در حال دریافت و رمزگشایی {material.DisplayName}...";
        try
        {
            await _materialDownload.DownloadAsync(_activeCourseId, material.Source, dialog.FileName);
            StatusMessage = $"{material.DisplayName} با موفقیت ذخیره شد.";
        }
        catch (Exception ex)
        {
            ShowPlaybackError(ToUserFriendlyError(ex, "دانلود فایل ممکن نشد. لطفاً دوباره تلاش کنید."));
        }
        finally
        {
            IsBusy = false;
        }
    }

    private static string SanitizeFileName(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return string.Empty;

        var invalid = Path.GetInvalidFileNameChars();
        return new string(fileName.Trim().Select(c => invalid.Contains(c) ? '_' : c).ToArray());
    }

    public void NotifyMediaOpened()
    {
        IsPreparingPlayback = false;
        IsBuffering = false;
        if (BufferProgress < 100)
            BufferProgress = -1;
    }

    private static string FormatClock(int totalSeconds)
    {
        var ts = TimeSpan.FromSeconds(Math.Max(0, totalSeconds));
        return ts.TotalHours >= 1
            ? $"{(int)ts.TotalHours:00}:{ts.Minutes:00}:{ts.Seconds:00}"
            : $"{ts.Minutes:00}:{ts.Seconds:00}";
    }

    /// <summary>
    /// Moves selection to the previous/next playable lesson in the loaded curriculum.
    /// </summary>
    public bool SelectAdjacentLesson(int direction)
    {
        if (direction == 0) return false;

        var playable = CurriculumSections
            .SelectMany(s => s.Lessons)
            .Where(l => l.CanPlay)
            .ToList();
        if (playable.Count == 0) return false;

        var index = SelectedLesson is null
            ? -1
            : playable.FindIndex(l => l.LessonId == SelectedLesson.LessonId);

        var nextIndex = index < 0
            ? (direction > 0 ? 0 : playable.Count - 1)
            : index + Math.Sign(direction);

        if (nextIndex < 0 || nextIndex >= playable.Count)
        {
            ShowPlaybackError(direction > 0 ? "درس بعدی وجود ندارد." : "درس قبلی وجود ندارد.");
            return false;
        }

        SelectedLesson = playable[nextIndex];
        return true;
    }

    public void StopPlayback()
    {
        _ = PersistWatchPositionAsync(_lastKnownPositionSeconds);
        _playback.StopPlayback(PlaybackUri);
        PlaybackUri = null;
        _activeMediaAssetId = 0;
        _resumePositionSeconds = 0;
        IsBuffering = false;
        IsPreparingPlayback = false;
        BufferProgress = -1;
        ResetTelemetryTracking();
    }

    /// <summary>Keeps decrypted session in memory LRU; clears only the current MediaElement binding.</summary>
    public void ParkPlaybackSession()
    {
        _ = PersistWatchPositionAsync(_lastKnownPositionSeconds);
        _playback.ParkCurrentSession();
        PlaybackUri = null;
        IsBuffering = false;
        BufferProgress = -1;
    }

    public async ValueTask DisposeAsync()
    {
        await PersistWatchPositionAsync(_lastKnownPositionSeconds);
        _playback.BufferingChanged -= OnPlaybackBufferingChanged;
        _playback.DownloadProgressChanged -= OnDownloadProgressChanged;
        // Leaving the player page must not destroy RAM sessions — user may return shortly.
        ParkPlaybackSession();
    }

    private async Task PersistWatchPositionAsync(int positionSeconds)
    {
        if (_activeMediaAssetId <= 0) return;
        if (positionSeconds < 3) return;
        try
        {
            await _watchPositions.SavePositionAsync(_activeMediaAssetId, positionSeconds);
            _lastKnownPositionSeconds = positionSeconds;
        }
        catch
        {
            // Local persistence must never break playback.
        }
    }

    private void OnPlaybackBufferingChanged(object? sender, bool waiting)
    {
        var app = System.Windows.Application.Current;
        if (app?.Dispatcher is null || app.Dispatcher.CheckAccess())
        {
            IsBuffering = waiting;
            return;
        }

        app.Dispatcher.Invoke(() => IsBuffering = waiting);
    }

    private void OnDownloadProgressChanged(object? sender, double percent)
    {
        var app = System.Windows.Application.Current;
        void Apply() => BufferProgress = percent;
        if (app?.Dispatcher is null || app.Dispatcher.CheckAccess())
        {
            Apply();
            return;
        }

        app.Dispatcher.Invoke(Apply);
    }

    public void ReportPlaybackError(string message) => ShowPlaybackError(message);

    private void ShowPlaybackError(string message)
    {
        PlaybackErrorMessage = message;
    }

    private void ClearPlaybackError()
    {
        PlaybackErrorMessage = null;
    }

    private static string ToUserFriendlyError(Exception ex, string fallback)
    {
        if (ex is System.Net.Http.HttpRequestException)
            return "امکان اتصال به سرور فراهم نشد. لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.";

        if (ex is TaskCanceledException or OperationCanceledException or TimeoutException)
            return "زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.";

        return SanitizeApiError(ex.Message, fallback);
    }

    private static string SanitizeApiError(string? message, string fallback)
    {
        if (string.IsNullOrWhiteSpace(message))
            return fallback;

        var trimmed = message.Trim();
        if (ContainsPersian(trimmed) && !LooksTechnical(trimmed))
            return trimmed;

        if (trimmed.Contains("No such host", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("Name or service not known", StringComparison.OrdinalIgnoreCase))
            return "امکان اتصال به سرور فراهم نشد. لطفاً اتصال اینترنت و تنظیمات شبکه را بررسی کنید.";

        if (trimmed.Contains("timed out", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("timeout", StringComparison.OrdinalIgnoreCase))
            return "زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.";

        if (trimmed.Contains("Unauthorized", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("401", StringComparison.OrdinalIgnoreCase))
            return "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.";

        if (trimmed.Contains("Forbidden", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("403", StringComparison.OrdinalIgnoreCase))
            return "به این محتوا دسترسی ندارید.";

        if (trimmed.Contains("Not Found", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Contains("404", StringComparison.OrdinalIgnoreCase))
            return "محتوای مورد نظر یافت نشد.";

        return fallback;
    }

    private static bool ContainsPersian(string value) =>
        value.Any(c => c is >= '\u0600' and <= '\u06FF');

    private static bool LooksTechnical(string value) =>
        value.Contains("Exception", StringComparison.OrdinalIgnoreCase) ||
        value.Contains("StackTrace", StringComparison.OrdinalIgnoreCase) ||
        value.Contains(" at ", StringComparison.Ordinal) ||
        value.Contains("HttpRequest", StringComparison.OrdinalIgnoreCase) ||
        value.Contains("NullReference", StringComparison.OrdinalIgnoreCase);

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(name);
        return true;
    }
}

public enum PlayerCatalogStep
{
    Teachers = 0,
    Courses = 1,
    CourseContent = 2,
}

public sealed class TeacherListItemVm
{
    public TeacherListItemVm(long teacherId, string teacherName, int courseCount)
    {
        TeacherId = teacherId;
        TeacherName = teacherName;
        CourseCount = courseCount;
    }

    public long TeacherId { get; }
    public string TeacherName { get; }
    public int CourseCount { get; }
    public string CourseCountLabel => $"{CourseCount} دوره";
}

public sealed class CurriculumSectionVm
{
    public CurriculumSectionVm(DesktopCourseSectionItem section)
    {
        SectionId = section.SectionId;
        Title = section.Title;
        foreach (var material in section.Materials)
            Materials.Add(new CurriculumMaterialVm(material));
        IsExpanded = false;
    }

    public long SectionId { get; }
    public string Title { get; }
    public bool HasMaterials => Materials.Count > 0;
    public bool IsExpanded { get; set; }
    public ObservableCollection<CurriculumMaterialVm> Materials { get; } = new();
    public ObservableCollection<CurriculumLessonVm> Lessons { get; } = new();
}

public sealed class CurriculumLessonVm : INotifyPropertyChanged
{
    private bool _isSelected;

    public CurriculumLessonVm(DesktopCourseLessonItem lesson)
    {
        LessonId = lesson.LessonId;
        Title = lesson.Title;
        VideoTitle = lesson.VideoTitle;
        DurationSeconds = lesson.DurationSeconds;
        IsPublished = lesson.IsPublished;
        MediaAssetId = lesson.MediaAssetId ?? 0;
        HasEncryptedVideo = lesson.HasEncryptedVideo;
        IsLocked = lesson.IsLocked;
        foreach (var material in lesson.Materials)
            Materials.Add(new CurriculumMaterialVm(material));
    }

    public long LessonId { get; }
    public string Title { get; }
    public string? VideoTitle { get; }
    public int DurationSeconds { get; }
    public bool IsPublished { get; }
    public long MediaAssetId { get; }
    public bool HasEncryptedVideo { get; }
    public bool IsLocked { get; }
    public bool HasMaterials => Materials.Count > 0;
    public ObservableCollection<CurriculumMaterialVm> Materials { get; } = new();

    /// <summary>Selectable in the curriculum list (locked lessons stay visible but disabled).</summary>
    public bool IsSelectable => !IsLocked;

    public bool CanPlay => !IsLocked && HasEncryptedVideo && MediaAssetId > 0 && IsPublished;

    public bool IsSelected
    {
        get => _isSelected;
        set
        {
            if (_isSelected == value) return;
            _isSelected = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsSelected)));
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(ShowPlayButton)));
        }
    }

    /// <summary>Play control on the selected playable lesson only.</summary>
    public bool ShowPlayButton => IsSelected && CanPlay;

    public string DurationLabel
    {
        get
        {
            if (DurationSeconds <= 0) return "—";
            var minutes = DurationSeconds / 60;
            var seconds = DurationSeconds % 60;
            return $"{minutes:00}:{seconds:00}";
        }
    }

    public string StatusLabel =>
        IsLocked
            ? "خارج از دسترسی لایسنس"
            : CanPlay
                ? "ویدیوی رمزنگاری‌شده"
                : "بدون ویدیو";

    public event PropertyChangedEventHandler? PropertyChanged;
}

public sealed class CurriculumMaterialVm
{
    public CurriculumMaterialVm(DesktopCourseCurriculumMaterialDto material)
    {
        Source = material;
    }

    internal DesktopCourseCurriculumMaterialDto Source { get; }
    public long MaterialId => Source.MaterialId;
    public long MediaAssetId => Source.MediaAssetId;
    public string DisplayName => string.IsNullOrWhiteSpace(Source.DisplayName)
        ? Source.OriginalFileName ?? "فایل ضمیمه"
        : Source.DisplayName;
    public string? OriginalFileName => Source.OriginalFileName;
    public long? FileSizeBytes => Source.FileSizeBytes;
    public bool IsEncrypted => Source.IsEncrypted;
    public string FileSizeLabel => FileSizeBytes switch
    {
        null or <= 0 => string.Empty,
        < 1024 => $"{FileSizeBytes} بایت",
        < 1024 * 1024 => $"{FileSizeBytes / 1024d:0.#} کیلوبایت",
        _ => $"{FileSizeBytes / (1024d * 1024d):0.#} مگابایت",
    };
}
