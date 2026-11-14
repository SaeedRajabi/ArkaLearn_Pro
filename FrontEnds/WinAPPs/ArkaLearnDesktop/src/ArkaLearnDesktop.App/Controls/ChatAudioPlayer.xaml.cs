using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;

namespace ArkaLearnDesktop.App.Controls;

public partial class ChatAudioPlayer : UserControl
{
    public static readonly DependencyProperty SourceUrlProperty = DependencyProperty.Register(
        nameof(SourceUrl),
        typeof(string),
        typeof(ChatAudioPlayer),
        new PropertyMetadata(null, OnSourceUrlChanged));

    private readonly DispatcherTimer _timer;
    private bool _isPlaying;
    private bool _scrubbing;

    public ChatAudioPlayer()
    {
        InitializeComponent();
        _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(250) };
        _timer.Tick += (_, _) => UpdateProgress();
        Unloaded += (_, _) =>
        {
            _timer.Stop();
            try { Media.Stop(); } catch { /* ignore */ }
        };
    }

    public string? SourceUrl
    {
        get => (string?)GetValue(SourceUrlProperty);
        set => SetValue(SourceUrlProperty, value);
    }

    private static void OnSourceUrlChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is not ChatAudioPlayer player) return;
        player.LoadSource(e.NewValue as string);
    }

    private void LoadSource(string? url)
    {
        _timer.Stop();
        _isPlaying = false;
        SetPlayIcon(false);
        ProgressSlider.Value = 0;
        TimeLabel.Text = "0:00 / 0:00";

        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            Media.Source = null;
            return;
        }

        Media.Source = uri;
    }

    private void PlayPauseButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (Media.Source is null) return;

        if (_isPlaying)
        {
            Media.Pause();
            _timer.Stop();
            _isPlaying = false;
            SetPlayIcon(false);
        }
        else
        {
            Media.Play();
            _timer.Start();
            _isPlaying = true;
            SetPlayIcon(true);
        }
    }

    private void Media_OnMediaOpened(object sender, RoutedEventArgs e) => UpdateProgress();

    private void Media_OnMediaEnded(object sender, RoutedEventArgs e)
    {
        _timer.Stop();
        _isPlaying = false;
        SetPlayIcon(false);
        Media.Stop();
        ProgressSlider.Value = 0;
        UpdateProgress();
    }

    private void Media_OnMediaFailed(object sender, ExceptionRoutedEventArgs e)
    {
        _timer.Stop();
        _isPlaying = false;
        SetPlayIcon(false);
        TimeLabel.Text = "پخش صوت ممکن نیست";
    }

    private void ProgressSlider_OnPreviewMouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e) =>
        _scrubbing = true;

    private void ProgressSlider_OnPreviewMouseLeftButtonUp(object sender, System.Windows.Input.MouseButtonEventArgs e)
    {
        _scrubbing = false;
        if (Media.NaturalDuration.HasTimeSpan)
            Media.Position = TimeSpan.FromSeconds(ProgressSlider.Value);
        UpdateProgress();
    }

    private void ProgressSlider_OnValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
    {
        if (!_scrubbing || !Media.NaturalDuration.HasTimeSpan) return;
        Media.Position = TimeSpan.FromSeconds(ProgressSlider.Value);
    }

    private void UpdateProgress()
    {
        if (!Media.NaturalDuration.HasTimeSpan) return;
        var total = Media.NaturalDuration.TimeSpan;
        ProgressSlider.Maximum = Math.Max(total.TotalSeconds, 0.1);
        if (!_scrubbing)
            ProgressSlider.Value = Media.Position.TotalSeconds;
        TimeLabel.Text = $"{Format(Media.Position)} / {Format(total)}";
    }

    private void SetPlayIcon(bool playing)
    {
        // Template Path is named Icon — update via visual tree when available.
        if (PlayPauseButton.Template?.FindName("Icon", PlayPauseButton) is System.Windows.Shapes.Path icon)
        {
            icon.Data = System.Windows.Media.Geometry.Parse(
                playing
                    ? "M14,19H18V5H14M6,19H10V5H6V19Z"
                    : "M8,5.14V19.14L19,12.14L8,5.14Z");
            icon.Margin = playing ? new Thickness(0) : new Thickness(2, 0, 0, 0);
        }
    }

    private static string Format(TimeSpan t) =>
        t.TotalHours >= 1
            ? $"{(int)t.TotalHours}:{t.Minutes:00}:{t.Seconds:00}"
            : $"{(int)t.TotalMinutes}:{t.Seconds:00}";
}
