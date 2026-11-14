using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Security.Cryptography;
using System.Windows.Forms;
using System.Windows.Threading;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.RemoteAssist;

public sealed class WindowsScreenShareAdapter : IRemoteScreenShareAdapter
{
    private readonly Dispatcher _dispatcher;
    private DispatcherTimer? _timer;
    private long _sessionId;
    private int _monitorIndex;
    private Func<long, string, Task>? _framePublisher;
    private Action<byte[]?>? _localPreview;
    private string? _lastFrameHash;
    private int _unchangedSkips;
    private bool _isCapturing;

    // Keep frames comfortably below SignalR message limits while sustaining ~6–7 FPS.
    private const int CaptureIntervalMs = 150;
    private const int MaxWidth = 1280;
    private const long JpegQuality = 70L;
    private const int MaxUnchangedSkipsBeforeForceSend = 20; // ~3s keep-alive

    public WindowsScreenShareAdapter()
    {
        _dispatcher = System.Windows.Application.Current?.Dispatcher ?? Dispatcher.CurrentDispatcher;
    }

    public bool IsSharing => _timer is not null;

    public IReadOnlyList<DesktopMonitorInfo> GetMonitors()
    {
        var screens = Screen.AllScreens;
        var list = new List<DesktopMonitorInfo>(screens.Length);
        for (var i = 0; i < screens.Length; i++)
        {
            var screen = screens[i];
            var label = screen.Primary
                ? $"مانیتور {i + 1} (اصلی) — {screen.Bounds.Width}×{screen.Bounds.Height}"
                : $"مانیتور {i + 1} — {screen.Bounds.Width}×{screen.Bounds.Height}";
            list.Add(new DesktopMonitorInfo(
                i,
                label,
                screen.Bounds.Width,
                screen.Bounds.Height,
                screen.Primary,
                screen.Bounds.X,
                screen.Bounds.Y));
        }

        return list;
    }

    public void Start(
        long sessionId,
        int monitorIndex,
        Func<long, string, Task> framePublisher,
        Action<byte[]?> localPreviewJpeg)
    {
        Stop();
        _sessionId = sessionId;
        _monitorIndex = monitorIndex;
        _framePublisher = framePublisher;
        _localPreview = localPreviewJpeg;
        _lastFrameHash = null;
        _unchangedSkips = 0;

        _timer = new DispatcherTimer(DispatcherPriority.Background, _dispatcher)
        {
            Interval = TimeSpan.FromMilliseconds(CaptureIntervalMs),
        };
        _timer.Tick += OnCaptureTick;
        _timer.Start();
    }

    public void Stop()
    {
        if (_timer is not null)
        {
            _timer.Stop();
            _timer.Tick -= OnCaptureTick;
            _timer = null;
        }

        _sessionId = 0;
        _framePublisher = null;
        _localPreview?.Invoke(null);
        _localPreview = null;
        _lastFrameHash = null;
        _unchangedSkips = 0;
        _isCapturing = false;
    }

    private async void OnCaptureTick(object? sender, EventArgs e)
    {
        if (_isCapturing || _framePublisher is null || _sessionId <= 0) return;
        _isCapturing = true;
        try
        {
            var jpegBytes = CaptureMonitorJpeg(_monitorIndex);
            if (jpegBytes is null || jpegBytes.Length == 0) return;

            var hash = Convert.ToHexString(SHA256.HashData(jpegBytes));
            if (hash == _lastFrameHash)
            {
                _unchangedSkips++;
                if (_unchangedSkips < MaxUnchangedSkipsBeforeForceSend)
                    return;
            }

            _lastFrameHash = hash;
            _unchangedSkips = 0;
            _localPreview?.Invoke(jpegBytes);
            await _framePublisher(_sessionId, Convert.ToBase64String(jpegBytes));
        }
        catch
        {
            // ignore capture failures
        }
        finally
        {
            _isCapturing = false;
        }
    }

    private static byte[]? CaptureMonitorJpeg(int monitorIndex)
    {
        var screens = Screen.AllScreens;
        if (screens.Length == 0) return null;

        var index = Math.Clamp(monitorIndex, 0, screens.Length - 1);
        var bounds = screens[index].Bounds;
        var width = bounds.Width;
        var height = bounds.Height;
        if (width <= 0 || height <= 0) return null;

        var scale = width > MaxWidth ? MaxWidth / (double)width : 1.0;
        var targetWidth = Math.Max(1, (int)(width * scale));
        var targetHeight = Math.Max(1, (int)(height * scale));

        using var bitmap = new Bitmap(width, height, PixelFormat.Format32bppArgb);
        using (var graphics = Graphics.FromImage(bitmap))
        {
            graphics.CopyFromScreen(bounds.X, bounds.Y, 0, 0, new System.Drawing.Size(width, height), CopyPixelOperation.SourceCopy);
        }

        using var resized = new Bitmap(targetWidth, targetHeight, PixelFormat.Format24bppRgb);
        using (var graphics = Graphics.FromImage(resized))
        {
            graphics.CompositingMode = System.Drawing.Drawing2D.CompositingMode.SourceCopy;
            graphics.CompositingQuality = System.Drawing.Drawing2D.CompositingQuality.HighQuality;
            graphics.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.HighQuality;
            graphics.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.HighQuality;
            graphics.DrawImage(bitmap, 0, 0, targetWidth, targetHeight);
        }

        using var stream = new MemoryStream();
        var encoder = ImageCodecInfo.GetImageEncoders().FirstOrDefault(x => x.FormatID == ImageFormat.Jpeg.Guid);
        if (encoder is null)
        {
            resized.Save(stream, ImageFormat.Jpeg);
        }
        else
        {
            using var parameters = new EncoderParameters(1);
            parameters.Param[0] = new EncoderParameter(Encoder.Quality, JpegQuality);
            resized.Save(stream, encoder, parameters);
        }

        return stream.ToArray();
    }
}
