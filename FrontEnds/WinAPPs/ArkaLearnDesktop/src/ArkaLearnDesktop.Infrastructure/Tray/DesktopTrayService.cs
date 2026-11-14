using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Forms;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Tray;

public sealed class DesktopTrayService : IDesktopTrayService
{
    private NotifyIcon? _notifyIcon;
    private Window? _window;
    private Action? _openRemoteAssist;
    private bool _forceExit;
    private bool _disposed;
    private readonly List<IDisposable> _menuImages = [];

    public bool IsForceExit => _forceExit;

    public void Attach(Window window, Action? openRemoteAssist = null)
    {
        _window = window;
        _openRemoteAssist = openRemoteAssist;
        _window.Closing -= OnWindowClosing;
        _window.Closing += OnWindowClosing;
        EnsureTrayIcon();
    }

    public void ShowMainWindow()
    {
        if (_window is null) return;

        _window.Show();
        _window.WindowState = WindowState.Normal;
        _window.Activate();
        _window.Topmost = true;
        _window.Topmost = false;
        _window.Focus();
    }

    public void HideToTray(bool balloon = false)
    {
        if (_window is null) return;
        _window.Hide();
        // Balloon tip intentionally disabled — user asked not to notify on minimize-to-tray.
        _ = balloon;
    }

    public void RequestExit()
    {
        _forceExit = true;
        DisposeTrayIcon();
        System.Windows.Application.Current?.Shutdown();
    }

    private void OnWindowClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        if (_forceExit) return;
        e.Cancel = true;
        HideToTray(balloon: false);
    }

    private void EnsureTrayIcon()
    {
        if (_notifyIcon is not null) return;

        var menu = new ContextMenuStrip
        {
            ImageScalingSize = new System.Drawing.Size(16, 16),
            RightToLeft = RightToLeft.Yes,
        };

        menu.Items.Add(CreateMenuItem(
            "نمایش آرکانرم افزار",
            CreateMenuIcon(ShellStockIcon.Application),
            (_, _) => ShowMainWindow()));

        menu.Items.Add(CreateMenuItem(
            "کمک از راه دور",
            CreateMenuIcon(ShellStockIcon.Monitor),
            (_, _) =>
            {
                ShowMainWindow();
                _openRemoteAssist?.Invoke();
            }));

        menu.Items.Add(new ToolStripSeparator());

        menu.Items.Add(CreateMenuItem(
            "خروج کامل",
            CreateMenuIcon(ShellStockIcon.Exit),
            (_, _) => RequestExit()));

        _notifyIcon = new NotifyIcon
        {
            Text = "آرکانرم افزار — دسکتاپ",
            Visible = true,
            ContextMenuStrip = menu,
            Icon = LoadAppIcon(),
        };
        _notifyIcon.DoubleClick += (_, _) => ShowMainWindow();
    }

    private ToolStripMenuItem CreateMenuItem(string text, Image? image, EventHandler onClick)
    {
        if (image is IDisposable disposable)
            _menuImages.Add(disposable);

        var item = new ToolStripMenuItem(text, image);
        item.Click += onClick;
        return item;
    }

    private static Image CreateMenuIcon(ShellStockIcon kind)
    {
        try
        {
            using var icon = ExtractShellIcon(kind);
            if (icon is not null)
                return new Bitmap(icon.ToBitmap(), 16, 16);
        }
        catch
        {
            // fall through to system icons
        }

        var fallback = kind switch
        {
            ShellStockIcon.Monitor => SystemIcons.Shield,
            ShellStockIcon.Exit => SystemIcons.Error,
            _ => SystemIcons.Application,
        };
        return new Bitmap(fallback.ToBitmap(), 16, 16);
    }

    private static Icon? ExtractShellIcon(ShellStockIcon kind)
    {
        // shell32.dll stock icon indexes (stable on modern Windows).
        var index = kind switch
        {
            ShellStockIcon.Application => 2,  // generic app
            ShellStockIcon.Monitor => 15,     // computer / monitor
            ShellStockIcon.Exit => 27,        // power / shutdown
            _ => 0,
        };

        var large = IntPtr.Zero;
        var small = IntPtr.Zero;
        try
        {
            var count = ExtractIconEx("shell32.dll", index, ref large, ref small, 1);
            if (count <= 0) return null;

            var handle = small != IntPtr.Zero ? small : large;
            if (handle == IntPtr.Zero) return null;

            using var temp = Icon.FromHandle(handle);
            return (Icon)temp.Clone();
        }
        finally
        {
            if (large != IntPtr.Zero) DestroyIcon(large);
            if (small != IntPtr.Zero) DestroyIcon(small);
        }
    }

    private static Icon LoadAppIcon()
    {
        try
        {
            var exePath = Environment.ProcessPath;
            if (!string.IsNullOrWhiteSpace(exePath) && File.Exists(exePath))
            {
                var associated = Icon.ExtractAssociatedIcon(exePath);
                if (associated is not null)
                    return associated;
            }
        }
        catch
        {
            // fall through
        }

        foreach (var path in CandidateIconPaths())
        {
            try
            {
                if (!File.Exists(path)) continue;
                using var fileIcon = new Icon(path);
                return (Icon)new Icon(fileIcon, 16, 16).Clone();
            }
            catch
            {
                // try next candidate
            }
        }

        return SystemIcons.Application;
    }

    private static IEnumerable<string> CandidateIconPaths()
    {
        var baseDir = AppContext.BaseDirectory;
        yield return Path.Combine(baseDir, "logo.ico");
        yield return Path.Combine(baseDir, "Assets", "logo.ico");

        var exeDir = Path.GetDirectoryName(Environment.ProcessPath);
        if (!string.IsNullOrWhiteSpace(exeDir))
            yield return Path.Combine(exeDir, "logo.ico");
    }

    private void DisposeTrayIcon()
    {
        if (_notifyIcon is not null)
        {
            var menu = _notifyIcon.ContextMenuStrip;
            _notifyIcon.Visible = false;
            _notifyIcon.ContextMenuStrip = null;
            _notifyIcon.Dispose();
            _notifyIcon = null;
            menu?.Dispose();
        }

        foreach (var image in _menuImages)
            image.Dispose();
        _menuImages.Clear();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        if (_window is not null)
            _window.Closing -= OnWindowClosing;
        DisposeTrayIcon();
    }

    private enum ShellStockIcon
    {
        Application,
        Monitor,
        Exit,
    }

    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern uint ExtractIconEx(string lpszFile, int nIconIndex, ref IntPtr phiconLarge, ref IntPtr phiconSmall, uint nIcons);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr hIcon);
}
