using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.Views.Messenger;

public partial class StoryViewerWindow : Window
{
    private readonly IReadOnlyList<DesktopTeacherStory> _stories;
    private readonly IDesktopApiClient _api;
    private readonly string _apiBaseUrl;
    private readonly StoryViewerViewModel _viewModel;
    private readonly DispatcherTimer _progressTimer;

    private int _currentIndex;
    private bool _isPaused;
    private bool _isClosed;
    private DateTime _segmentStartedUtc;
    private double _elapsedBeforePauseSeconds;
    private IReadOnlyList<Uri>? _videoCandidates;
    private int _videoCandidateIndex;

    public StoryViewerWindow(
        IReadOnlyList<DesktopTeacherStory> stories,
        int startIndex,
        IDesktopApiClient api,
        string apiBaseUrl)
    {
        _stories = stories;
        _api = api;
        _apiBaseUrl = apiBaseUrl;
        _currentIndex = Math.Clamp(startIndex, 0, Math.Max(0, stories.Count - 1));
        _viewModel = new StoryViewerViewModel();
        DataContext = _viewModel;

        InitializeComponent();

        _progressTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(50) };
        _progressTimer.Tick += OnProgressTick;

        Loaded += async (_, _) => await ShowCurrentStoryAsync();
        Closed += (_, _) =>
        {
            _isClosed = true;
            _progressTimer.Stop();
            StopMediaPlayback();
        };
    }

    private async Task ShowCurrentStoryAsync()
    {
        if (_isClosed || _currentIndex < 0 || _currentIndex >= _stories.Count)
        {
            Close();
            return;
        }

        StopMediaPlayback();
        _elapsedBeforePauseSeconds = 0;
        _isPaused = false;
        _progressTimer.Stop();
        _videoCandidates = null;
        _videoCandidateIndex = 0;
        _viewModel.Rebuild(_stories.Count, _currentIndex);

        var story = _stories[_currentIndex];
        TeacherNameText.Text = story.TeacherName;
        CaptionText.Text = string.IsNullOrWhiteSpace(story.Caption) ? string.Empty : story.Caption;
        LoadingText.Text = "در حال بارگذاری...";
        LoadingText.Visibility = Visibility.Visible;
        StoryImage.Visibility = Visibility.Collapsed;
        StoryVideo.Visibility = Visibility.Collapsed;

        _ = _api.RegisterStoryViewAsync(story.Id);

        var mediaCandidates = DesktopMediaUriHelper.ResolveCandidates(story.MediaUrl, _apiBaseUrl);
        if (mediaCandidates.Count == 0)
        {
            LoadingText.Text = "رسانه‌ای برای این استوری موجود نیست.";
            BeginTimedSegment(Math.Max(1, story.DurationSeconds));
            return;
        }

        var isVideo = story.MediaKind == DesktopStoryMediaKind.Video
                      || LooksLikeVideo(story.MediaUrl);

        if (isVideo)
        {
            _videoCandidates = mediaCandidates;
            _videoCandidateIndex = 0;
            StoryVideo.Source = mediaCandidates[0];
            StoryVideo.Visibility = Visibility.Visible;
            StoryVideo.Play();
            BeginTimedSegment(Math.Max(1, story.DurationSeconds));
            return;
        }

        var image = await DesktopRemoteImageLoader.LoadAsync(story.MediaUrl, _apiBaseUrl);
        if (_isClosed) return;

        if (image is null)
        {
            LoadingText.Text = "بارگذاری تصویر ناموفق بود.";
            LoadingText.Visibility = Visibility.Visible;
        }
        else
        {
            StoryImage.Source = image;
            StoryImage.Visibility = Visibility.Visible;
            LoadingText.Visibility = Visibility.Collapsed;
        }

        BeginTimedSegment(Math.Max(1, story.DurationSeconds));
    }

    private static bool LooksLikeVideo(string? url) =>
        !string.IsNullOrWhiteSpace(url)
        && Regex.IsMatch(url, @"\.(mp4|webm|mov|m4v)(?:$|[?#])", RegexOptions.IgnoreCase);

    private void BeginTimedSegment(int durationSeconds)
    {
        _segmentStartedUtc = DateTime.UtcNow;
        _viewModel.SetActiveDuration(durationSeconds);
        _progressTimer.Start();
    }

    private void OnProgressTick(object? sender, EventArgs e)
    {
        if (_isPaused || _isClosed) return;

        var duration = Math.Max(1, _viewModel.ActiveDurationSeconds);
        var elapsed = _elapsedBeforePauseSeconds + (DateTime.UtcNow - _segmentStartedUtc).TotalSeconds;
        var progress = Math.Clamp(elapsed / duration, 0, 1);
        _viewModel.SetActiveProgress(progress);

        if (elapsed >= duration)
            _ = AdvanceAsync();
    }

    private async Task AdvanceAsync()
    {
        _progressTimer.Stop();
        if (_currentIndex + 1 >= _stories.Count)
        {
            Close();
            return;
        }

        _currentIndex++;
        await ShowCurrentStoryAsync();
    }

    private void PauseSegment()
    {
        if (_isPaused) return;
        _isPaused = true;
        _progressTimer.Stop();
        _elapsedBeforePauseSeconds += (DateTime.UtcNow - _segmentStartedUtc).TotalSeconds;
        if (StoryVideo.Visibility == Visibility.Visible)
            StoryVideo.Pause();
    }

    private void ResumeSegment()
    {
        if (!_isPaused || _isClosed) return;
        _isPaused = false;
        _segmentStartedUtc = DateTime.UtcNow;
        _progressTimer.Start();
        if (StoryVideo.Visibility == Visibility.Visible)
            StoryVideo.Play();
    }

    private void StopMediaPlayback()
    {
        StoryVideo.Stop();
        StoryVideo.Source = null;
        StoryImage.Source = null;
    }

    private void Root_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ChangedButton == MouseButton.Left)
            PauseSegment();
    }

    private void Root_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (e.ChangedButton == MouseButton.Left)
            ResumeSegment();
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape)
            Close();
    }

    private void Close_Click(object sender, RoutedEventArgs e) => Close();

    private void StoryVideo_MediaOpened(object sender, RoutedEventArgs e) =>
        LoadingText.Visibility = Visibility.Collapsed;

    private void StoryVideo_MediaEnded(object sender, RoutedEventArgs e) => _ = AdvanceAsync();

    private void StoryVideo_MediaFailed(object sender, ExceptionRoutedEventArgs e)
    {
        if (_videoCandidates is not null && _videoCandidateIndex + 1 < _videoCandidates.Count)
        {
            _videoCandidateIndex++;
            StoryVideo.Source = _videoCandidates[_videoCandidateIndex];
            StoryVideo.Play();
            return;
        }

        LoadingText.Text = "پخش ویدیو ناموفق بود.";
        LoadingText.Visibility = Visibility.Visible;
    }
}

internal sealed class StoryViewerViewModel : INotifyPropertyChanged
{
    private int _activeIndex;
    private int _activeDurationSeconds = 5;

    public ObservableCollection<StoryProgressSegment> ProgressSegments { get; } = new();

    public int ActiveDurationSeconds => _activeDurationSeconds;

    public void Rebuild(int count, int activeIndex)
    {
        _activeIndex = activeIndex;
        ProgressSegments.Clear();
        for (var i = 0; i < count; i++)
            ProgressSegments.Add(new StoryProgressSegment(i < activeIndex ? 1 : 0));
    }

    public void SetActiveDuration(int seconds) => _activeDurationSeconds = Math.Max(1, seconds);

    public void SetActiveProgress(double progress)
    {
        if (_activeIndex < 0 || _activeIndex >= ProgressSegments.Count) return;
        ProgressSegments[_activeIndex].Progress = progress;
    }

    public event PropertyChangedEventHandler? PropertyChanged;
}

internal sealed class StoryProgressSegment : INotifyPropertyChanged
{
    private double _progress;

    public StoryProgressSegment(double progress) => _progress = progress;

    public double Progress
    {
        get => _progress;
        set
        {
            if (Math.Abs(_progress - value) < 0.001) return;
            _progress = value;
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Progress)));
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(ProgressWidth)));
        }
    }

    public double ProgressWidth => Math.Max(0, Math.Min(1, Progress)) * 100;

    public event PropertyChangedEventHandler? PropertyChanged;
}
