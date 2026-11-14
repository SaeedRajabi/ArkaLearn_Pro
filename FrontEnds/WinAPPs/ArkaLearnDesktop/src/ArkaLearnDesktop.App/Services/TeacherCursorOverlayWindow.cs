using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Media;

namespace ArkaLearnDesktop.App.Services;

internal sealed class TeacherCursorOverlayWindow : Window, IDisposable
{
    private const int GwlExStyle = -20;
    private const long WsExTransparent = 0x00000020L;
    private const long WsExToolWindow = 0x00000080L;
    private const long WsExLayered = 0x00080000L;
    private const long WsExNoActivate = 0x08000000L;
    private const uint WdaExcludeFromCapture = 0x00000011;
    private const uint SwpNoSize = 0x0001;
    private const uint SwpNoActivate = 0x0010;
    private const uint SwpShowWindow = 0x0040;
    private static readonly IntPtr HwndTopmost = new(-1);

    private readonly TextBlock _label;
    private IntPtr _handle;

    public TeacherCursorOverlayWindow()
    {
        AllowsTransparency = true;
        Background = Brushes.Transparent;
        ShowActivated = false;
        ShowInTaskbar = false;
        SizeToContent = SizeToContent.WidthAndHeight;
        WindowStyle = WindowStyle.None;
        ResizeMode = ResizeMode.NoResize;
        IsHitTestVisible = false;

        _label = new TextBlock
        {
            Foreground = Brushes.White,
            FontSize = 13,
            FontWeight = FontWeights.SemiBold,
            FlowDirection = FlowDirection.RightToLeft,
        };

        Content = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(220, 31, 41, 55)),
            BorderBrush = new SolidColorBrush(Color.FromArgb(190, 96, 165, 250)),
            BorderThickness = new Thickness(1),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(9, 4, 9, 5),
            Child = _label,
        };

        SourceInitialized += OnSourceInitialized;
    }

    public void ShowNearCursor(string displayName)
    {
        _label.Text = string.IsNullOrWhiteSpace(displayName) ? "استاد" : displayName.Trim();
        if (!IsVisible)
            Show();

        if (GetCursorPos(out var point))
            MoveTo(point.X, point.Y);
    }

    public void MoveTo(int screenX, int screenY)
    {
        if (!IsVisible || _handle == IntPtr.Zero) return;
        SetWindowPos(
            _handle,
            HwndTopmost,
            screenX + 16,
            screenY + 20,
            0,
            0,
            SwpNoSize | SwpNoActivate | SwpShowWindow);
    }

    public void HideOverlay()
    {
        if (IsVisible)
            Hide();
    }

    private void OnSourceInitialized(object? sender, EventArgs e)
    {
        _handle = new WindowInteropHelper(this).Handle;
        var extendedStyle = GetWindowLongPtr(_handle, GwlExStyle).ToInt64();
        SetWindowLongPtr(
            _handle,
            GwlExStyle,
            new IntPtr(extendedStyle | WsExTransparent | WsExLayered | WsExToolWindow | WsExNoActivate));

        // Supported on Windows 10 2004+; failure simply leaves ToolWindow as the capture safeguard.
        _ = SetWindowDisplayAffinity(_handle, WdaExcludeFromCapture);
    }

    public void Dispose()
    {
        SourceInitialized -= OnSourceInitialized;
        Close();
    }

    [DllImport("user32.dll")]
    private static extern bool GetCursorPos(out Point point);

    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")]
    private static extern IntPtr GetWindowLongPtr(IntPtr window, int index);

    [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")]
    private static extern IntPtr SetWindowLongPtr(IntPtr window, int index, IntPtr newLong);

    [DllImport("user32.dll")]
    private static extern bool SetWindowDisplayAffinity(IntPtr window, uint affinity);

    [DllImport("user32.dll")]
    private static extern bool SetWindowPos(
        IntPtr window,
        IntPtr insertAfter,
        int x,
        int y,
        int width,
        int height,
        uint flags);

    [StructLayout(LayoutKind.Sequential)]
    private struct Point
    {
        public int X;
        public int Y;
    }
}
