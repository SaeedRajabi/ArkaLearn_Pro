using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Threading;
using ArkaLearnDesktop.App.Native;
using ArkaLearnDesktop.App.ViewModels;
using ArkaLearnDesktop.App.Views.Shell;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.Views.Player;

public partial class SecurePlayerView : UserControl
{
    private static readonly Geometry PlayGeometry = Geometry.Parse("M6,2 L20,12 L6,22 Z");
    private static readonly Geometry PauseGeometry = Geometry.Parse("M5,3 H9 V21 H5 Z M15,3 H19 V21 H15 Z");

    private readonly DispatcherTimer _hideControlsTimer;
    private readonly DispatcherTimer _progressTimer;
    private readonly DispatcherTimer _telemetryHeartbeatTimer;
    private readonly DispatcherTimer _watermarkMotionTimer;
    private const double DefaultCatalogWidth = 360;
    private const int TelemetryHeartbeatSeconds = 15;

    private bool _isPlaying;
    private bool _isSeeking;
    private bool _isFullscreen;
    private bool _controlsPinned;
    private bool _isCatalogVisible = true;
    private Window? _hostWindow;
    private WindowStyle _savedWindowStyle;
    private ResizeMode _savedResizeMode;
    private WindowState _savedWindowState;
    private double _savedCatalogWidth = DefaultCatalogWidth;
    private double _watermarkMotionPhase;

    public SecurePlayerView()
    {
        InitializeComponent();

        _hideControlsTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(2.8) };
        _hideControlsTimer.Tick += (_, _) =>
        {
            if (!_controlsPinned && !_isSeeking)
                HideControls();
        };

        _progressTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(250) };
        _progressTimer.Tick += (_, _) => UpdateProgressUi();

        _telemetryHeartbeatTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(TelemetryHeartbeatSeconds) };
        _telemetryHeartbeatTimer.Tick += (_, _) => SendHeartbeatTelemetry();

        _watermarkMotionTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(40) };
        _watermarkMotionTimer.Tick += (_, _) => UpdateWatermarkMotion();

        Loaded += (_, _) =>
        {
            _hostWindow = Window.GetWindow(this);
            if (_hostWindow is not null)
                DisplayCaptureProtection.EnableForWindow(_hostWindow);

            MediaPlayer.Volume = VolumeSlider.Value / 100d;
            UpdatePlayPauseIcon();
        };

        Unloaded += (_, _) =>
        {
            try
            {
                ViewModel?.NotifyPlaybackPause(CurrentPositionSeconds());
            }
            catch
            {
                // ignore
            }

            _progressTimer.Stop();
            _hideControlsTimer.Stop();
            _telemetryHeartbeatTimer.Stop();
            _watermarkMotionTimer.Stop();
            if (_isFullscreen)
                ExitFullscreen(restoreUiOnly: true);
        };
    }

    private PlayerViewModel? ViewModel => DataContext as PlayerViewModel;

    private int CurrentPositionSeconds()
    {
        try
        {
            return (int)Math.Max(0, MediaPlayer.Position.TotalSeconds);
        }
        catch
        {
            return 0;
        }
    }

    private void SendHeartbeatTelemetry()
    {
        if (!_isPlaying || ViewModel is null) return;
        ViewModel.NotifyPlaybackHeartbeat(CurrentPositionSeconds());
    }

    private void StartTelemetryHeartbeat()
    {
        _telemetryHeartbeatTimer.Stop();
        _telemetryHeartbeatTimer.Start();
    }

    private void StopTelemetryHeartbeat()
    {
        _telemetryHeartbeatTimer.Stop();
    }

    private void UpdateWatermarkMotion()
    {
        if (ViewModel?.WatermarkMovement != DesktopWatermarkMovement.Diagonal)
        {
            VideoWatermark.RenderTransform = VideoWatermark.RenderTransform is RotateTransform existing
                ? existing
                : new RotateTransform(ViewModel?.WatermarkRotationDeg ?? 0);
            return;
        }

        _watermarkMotionPhase += 0.03;
        var offset = 24 * Math.Sin(_watermarkMotionPhase);
        var group = new TransformGroup();
        group.Children.Add(new RotateTransform(ViewModel?.WatermarkRotationDeg ?? 0));
        group.Children.Add(new TranslateTransform(offset, offset * 0.6));
        VideoWatermark.RenderTransform = group;
    }

    private void SyncWatermarkMotionTimer()
    {
        if (ViewModel?.WatermarkMovement == DesktopWatermarkMovement.Diagonal)
            _watermarkMotionTimer.Start();
        else
        {
            _watermarkMotionTimer.Stop();
            ApplyStaticWatermarkTransform();
        }
    }

    private void ApplyStaticWatermarkTransform()
    {
        VideoWatermark.RenderTransform = new RotateTransform(ViewModel?.WatermarkRotationDeg ?? 0);
    }

    private async void SecurePlayerView_OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext is PlayerViewModel vm)
            await vm.InitializeAsync();
    }

    private void SecurePlayerView_OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if (e.OldValue is PlayerViewModel oldVm)
            oldVm.PropertyChanged -= ViewModelOnPropertyChanged;
        if (e.NewValue is PlayerViewModel newVm)
        {
            newVm.PropertyChanged += ViewModelOnPropertyChanged;
            SyncWatermarkMotionTimer();
        }
    }

    private void ViewModelOnPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(PlayerViewModel.WatermarkMovement))
            SyncWatermarkMotionTimer();
        else if (e.PropertyName == nameof(PlayerViewModel.WatermarkRotationDeg)
                 && ViewModel?.WatermarkMovement != DesktopWatermarkMovement.Diagonal)
            ApplyStaticWatermarkTransform();

        if (e.PropertyName != nameof(PlayerViewModel.PlaybackUri) || DataContext is not PlayerViewModel vm)
            return;

        if (vm.PlaybackUri is null)
        {
            _progressTimer.Stop();
            StopTelemetryHeartbeat();
            MediaPlayer.Stop();
            MediaPlayer.Close();
            MediaPlayer.Source = null;
            _isPlaying = false;
            ProgressSlider.Value = 0;
            CurrentTimeText.Text = "00:00:00";
            DurationText.Text = "00:00:00";
            UpdatePlayPauseIcon();
            return;
        }

        MediaPlayer.Source = vm.PlaybackUri;
        MediaPlayer.Play();
        _isPlaying = true;
        UpdatePlayPauseIcon();
        _progressTimer.Start();
        StartTelemetryHeartbeat();
        ShowControls();
        VideoHost.Focus();
    }

    private void VideoHost_OnMouseEnter(object sender, MouseEventArgs e) => ShowControls();

    private void VideoHost_OnMouseLeave(object sender, MouseEventArgs e)
    {
        if (_controlsPinned) return;
        _hideControlsTimer.Stop();
        HideControls();
    }

    private void VideoHost_OnMouseMove(object sender, MouseEventArgs e)
    {
        ShowControls();
        RestartHideTimer();
    }

    private void ControlsOverlay_OnMouseEnter(object sender, MouseEventArgs e)
    {
        _controlsPinned = true;
        ShowControls();
        _hideControlsTimer.Stop();
    }

    private void ControlsOverlay_OnMouseLeave(object sender, MouseEventArgs e)
    {
        _controlsPinned = false;
        RestartHideTimer();
    }

    private void VideoHost_OnMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            TogglePlayPause();
            e.Handled = true;
        }
    }

    private void VideoHost_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape && _isFullscreen)
        {
            ExitFullscreen();
            e.Handled = true;
            return;
        }

        if (e.Key is Key.Space or Key.MediaPlayPause)
        {
            TogglePlayPause();
            e.Handled = true;
        }
        else if (e.Key == Key.F)
        {
            ToggleFullscreen();
            e.Handled = true;
        }
    }

    private void ShowControls()
    {
        ControlsOverlay.Opacity = 1;
        ControlsOverlay.IsHitTestVisible = true;
    }

    private void HideControls()
    {
        ControlsOverlay.Opacity = 0;
        ControlsOverlay.IsHitTestVisible = false;
        _hideControlsTimer.Stop();
    }

    private void RestartHideTimer()
    {
        _hideControlsTimer.Stop();
        _hideControlsTimer.Start();
    }

    private void PlayPauseButton_OnClick(object sender, RoutedEventArgs e) => TogglePlayPause();

    private void TogglePlayPause()
    {
        if (MediaPlayer.Source is null) return;

        var position = CurrentPositionSeconds();
        if (_isPlaying)
        {
            MediaPlayer.Pause();
            _isPlaying = false;
            StopTelemetryHeartbeat();
            ViewModel?.NotifyPlaybackPause(position);
        }
        else
        {
            MediaPlayer.Play();
            _isPlaying = true;
            _progressTimer.Start();
            StartTelemetryHeartbeat();
            ViewModel?.NotifyPlaybackPlay(position);
        }

        UpdatePlayPauseIcon();
        ShowControls();
        RestartHideTimer();
    }

    /// <summary>
    /// Soft stop: pause + seek to start. Keeps Source so Play works again.
    /// Does not dispose the DRM loopback URI.
    /// </summary>
    private void StopButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (MediaPlayer.Source is null) return;

        MediaPlayer.Stop();
        try
        {
            MediaPlayer.Position = TimeSpan.Zero;
        }
        catch
        {
            // Ignore if media not fully opened yet.
        }

        _isPlaying = false;
        StopTelemetryHeartbeat();
        ViewModel?.NotifyPlaybackPause(CurrentPositionSeconds());
        ProgressSlider.Value = 0;
        CurrentTimeText.Text = "00:00:00";
        UpdatePlayPauseIcon();
        ShowControls();
        RestartHideTimer();
    }

    private void MediaPlayer_OnMediaOpened(object sender, RoutedEventArgs e)
    {
        try
        {
            var resume = ViewModel?.ResumePositionSeconds ?? 0;
            if (resume > 5 && MediaPlayer.NaturalDuration.HasTimeSpan)
            {
                var duration = MediaPlayer.NaturalDuration.TimeSpan.TotalSeconds;
                if (resume < duration - 5)
                    MediaPlayer.Position = TimeSpan.FromSeconds(resume);
            }
        }
        catch
        {
            // Ignore seek failures; play from start.
        }

        _isPlaying = true;
        ViewModel?.NotifyMediaOpened();
        ViewModel?.NotifyPlaybackPlay(CurrentPositionSeconds());
        UpdatePlayPauseIcon();
        UpdateProgressUi(forceDuration: true);
        _progressTimer.Start();
    }

    private void MediaPlayer_OnBufferingStarted(object sender, RoutedEventArgs e)
    {
        if (ViewModel is not null)
            ViewModel.IsBuffering = true;
    }

    private void MediaPlayer_OnBufferingEnded(object sender, RoutedEventArgs e)
    {
        if (ViewModel is not null)
            ViewModel.IsBuffering = false;
    }

    private void MediaPlayer_OnMediaFailed(object sender, ExceptionRoutedEventArgs e)
    {
        if (ViewModel is null) return;
        ViewModel.IsBuffering = false;
        ViewModel.IsPreparingPlayback = false;
        ViewModel.ReportPlaybackError("پخش ویدیو با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.");
    }

    private void MediaPlayer_OnMediaEnded(object sender, RoutedEventArgs e)
    {
        _isPlaying = false;
        StopTelemetryHeartbeat();
        ViewModel?.NotifyPlaybackComplete(CurrentPositionSeconds());
        try
        {
            MediaPlayer.Position = TimeSpan.Zero;
        }
        catch
        {
            // ignore
        }

        ProgressSlider.Value = 0;
        CurrentTimeText.Text = "00:00:00";
        UpdatePlayPauseIcon();
        // Soft end — keep Source so user can press Play again without re-decrypting.
    }

    private void VolumeSlider_OnValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
    {
        if (!IsLoaded) return;
        MediaPlayer.Volume = e.NewValue / 100d;
    }

    private void ProgressSlider_OnPreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        _isSeeking = true;
        _hideControlsTimer.Stop();
    }

    private void ProgressSlider_OnPreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        ApplySeekFromSlider();
        _isSeeking = false;
        RestartHideTimer();
    }

    private void ProgressSlider_OnValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
    {
        if (!_isSeeking || !IsLoaded) return;
        CurrentTimeText.Text = FormatTime(TimeSpan.FromSeconds(e.NewValue));
    }

    private void ApplySeekFromSlider()
    {
        if (MediaPlayer.NaturalDuration.HasTimeSpan)
        {
            MediaPlayer.Position = TimeSpan.FromSeconds(ProgressSlider.Value);
            ViewModel?.NotifyPlaybackSeek((int)Math.Max(0, ProgressSlider.Value));
        }
    }

    private void UpdateProgressUi(bool forceDuration = false)
    {
        if (_isSeeking || MediaPlayer.Source is null) return;

        if (MediaPlayer.NaturalDuration.HasTimeSpan)
        {
            var duration = MediaPlayer.NaturalDuration.TimeSpan;
            if (forceDuration || Math.Abs(ProgressSlider.Maximum - duration.TotalSeconds) > 0.5)
                ProgressSlider.Maximum = Math.Max(duration.TotalSeconds, 0.1);

            DurationText.Text = FormatTime(duration);
            ProgressSlider.Value = MediaPlayer.Position.TotalSeconds;
            CurrentTimeText.Text = FormatTime(MediaPlayer.Position);
        }
        else
        {
            CurrentTimeText.Text = FormatTime(MediaPlayer.Position);
        }
    }

    private static string FormatTime(TimeSpan value)
    {
        if (value < TimeSpan.Zero) value = TimeSpan.Zero;
        return value.ToString(value.TotalHours >= 1 ? @"hh\:mm\:ss" : @"hh\:mm\:ss");
    }

    private void UpdatePlayPauseIcon()
    {
        PlayPauseIcon.Data = _isPlaying ? PauseGeometry : PlayGeometry;
        PlayPauseButton.ToolTip = _isPlaying ? "توقف موقت" : "پخش";
    }

    private void FullscreenButton_OnClick(object sender, RoutedEventArgs e) => ToggleFullscreen();

    private void ToggleFullscreen()
    {
        if (_isFullscreen)
            ExitFullscreen();
        else
            EnterFullscreen();
    }

    private void EnterFullscreen()
    {
        _hostWindow ??= Window.GetWindow(this);
        if (_hostWindow is null || _isFullscreen) return;

        _savedWindowStyle = _hostWindow.WindowStyle;
        _savedResizeMode = _hostWindow.ResizeMode;
        _savedWindowState = _hostWindow.WindowState;
        RememberCatalogWidthIfVisible();

        HeaderPanel.Visibility = Visibility.Collapsed;
        HeaderRowDef.Height = new GridLength(0);
        ApplyCatalogLayout(visible: false, expandVideo: true);

        VideoHost.CornerRadius = new CornerRadius(0);
        VideoHost.BorderThickness = new Thickness(0);
        VideoHost.Margin = new Thickness(0);

        _hostWindow.WindowStyle = WindowStyle.None;
        _hostWindow.ResizeMode = ResizeMode.NoResize;
        _hostWindow.WindowState = WindowState.Maximized;

        FindShell()?.HideSidebarForImmersive();

        _isFullscreen = true;
        ShowControls();
        VideoHost.Focus();
    }

    private void ExitFullscreen(bool restoreUiOnly = false)
    {
        if (!_isFullscreen && !restoreUiOnly) return;

        HeaderPanel.Visibility = Visibility.Visible;
        HeaderRowDef.Height = GridLength.Auto;
        VideoHost.CornerRadius = new CornerRadius(12);
        VideoHost.BorderThickness = new Thickness(1);

        // Always bring the lesson catalog back after leaving fullscreen so the menu isn't stuck hidden.
        ApplyCatalogLayout(visible: true, expandVideo: false);

        if (_hostWindow is not null && !restoreUiOnly)
        {
            _hostWindow.WindowStyle = _savedWindowStyle;
            _hostWindow.ResizeMode = _savedResizeMode;
            _hostWindow.WindowState = _savedWindowState;
        }

        if (!restoreUiOnly)
            FindShell()?.RestoreSidebarAfterImmersive();

        _isFullscreen = false;
        ShowControls();
        VideoHost.Focus();
    }

    private ShellView? FindShell()
    {
        DependencyObject? current = this;
        while (current is not null)
        {
            if (current is ShellView shell)
                return shell;
            current = VisualTreeHelper.GetParent(current);
        }

        return null;
    }

    private void ToggleCatalogButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (_isFullscreen)
        {
            // Leave fullscreen and force-show the menu so the user isn't stuck without it.
            ExitFullscreen();
            return;
        }

        if (_isCatalogVisible)
        {
            RememberCatalogWidthIfVisible();
            ApplyCatalogLayout(visible: false, expandVideo: true);
        }
        else
        {
            ApplyCatalogLayout(visible: true, expandVideo: false);
        }

        ShowControls();
        RestartHideTimer();
    }

    private void RememberCatalogWidthIfVisible()
    {
        if (!_isCatalogVisible) return;
        if (CatalogColumn.Width.IsAbsolute && CatalogColumn.Width.Value > 0)
            _savedCatalogWidth = CatalogColumn.Width.Value;
        if (_savedCatalogWidth <= 0)
            _savedCatalogWidth = DefaultCatalogWidth;
    }

    private void ApplyCatalogLayout(bool visible, bool expandVideo)
    {
        _isCatalogVisible = visible;
        CatalogPanel.Visibility = visible ? Visibility.Visible : Visibility.Collapsed;

        var width = EnsureCatalogWidth();
        CatalogColumn.Width = visible ? new GridLength(width) : new GridLength(0);

        if (expandVideo || !visible)
        {
            Grid.SetColumn(VideoHost, 0);
            Grid.SetColumnSpan(VideoHost, 2);
        }
        else
        {
            Grid.SetColumn(VideoHost, 1);
            Grid.SetColumnSpan(VideoHost, 1);
        }
    }

    private double EnsureCatalogWidth()
    {
        if (_savedCatalogWidth <= 0)
            _savedCatalogWidth = DefaultCatalogWidth;
        return _savedCatalogWidth;
    }

    private void PreviousLessonButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (DataContext is not PlayerViewModel vm) return;
        if (vm.SelectAdjacentLesson(-1) && vm.PlayLessonCommand.CanExecute(null))
            vm.PlayLessonCommand.Execute(null);
    }

    private void NextLessonButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (DataContext is not PlayerViewModel vm) return;
        if (vm.SelectAdjacentLesson(1) && vm.PlayLessonCommand.CanExecute(null))
            vm.PlayLessonCommand.Execute(null);
    }

    /// <summary>
    /// Nested ListBoxes swallow mouse-wheel; forward to the curriculum ScrollViewer so scroll works everywhere.
    /// </summary>
    private void CurriculumNested_OnPreviewMouseWheel(object sender, MouseWheelEventArgs e)
    {
        if (e.Handled || CurriculumScrollViewer is null)
            return;

        e.Handled = true;
        var args = new MouseWheelEventArgs(e.MouseDevice, e.Timestamp, e.Delta)
        {
            RoutedEvent = UIElement.MouseWheelEvent,
            Source = CurriculumScrollViewer,
        };
        CurriculumScrollViewer.RaiseEvent(args);
    }

    private void CurriculumExpander_OnExpandedCollapsed(object sender, RoutedEventArgs e)
    {
        // After expand/collapse, refresh layout so the outer ScrollViewer viewport stays correct on Windows.
        if (CurriculumScrollViewer is null) return;
        CurriculumScrollViewer.InvalidateMeasure();
        CurriculumScrollViewer.InvalidateArrange();
        CurriculumScrollViewer.UpdateLayout();
    }
}
