using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace ArkaLearnDesktop.App.Native;

internal static class DisplayCaptureProtection
{
    private const uint WdaExcludeFromCapture = 0x00000011;

    [DllImport("user32.dll")]
    private static extern bool SetWindowDisplayAffinity(IntPtr hwnd, uint dwAffinity);

    public static void EnableForWindow(Window window)
    {
        if (!window.IsLoaded)
        {
            window.Loaded += (_, _) => Apply(window);
            return;
        }

        Apply(window);
    }

    private static void Apply(Window window)
    {
        var handle = new WindowInteropHelper(window).Handle;
        if (handle == IntPtr.Zero) return;
        SetWindowDisplayAffinity(handle, WdaExcludeFromCapture);
    }
}
