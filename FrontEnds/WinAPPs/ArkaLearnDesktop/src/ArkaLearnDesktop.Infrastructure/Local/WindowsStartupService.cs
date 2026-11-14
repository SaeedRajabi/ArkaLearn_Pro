using System.Diagnostics;
using System.IO;
using ArkaLearnDesktop.Application.Abstractions;
using Microsoft.Win32;

namespace ArkaLearnDesktop.Infrastructure.Local;

public sealed class WindowsStartupService : IWindowsStartupService
{
    private const string RunKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string ValueName = "ArkaSoftwareDesktop";
    private const string LegacyValueName = "ArkaLearnDesktop";
    public const string AutostartArg = "--autostart";

    public bool IsEnabled
    {
        get
        {
            using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: false);
            return key?.GetValue(ValueName) is string
                || key?.GetValue(LegacyValueName) is string;
        }
    }

    public void SetEnabled(bool enabled)
    {
        using var key = Registry.CurrentUser.OpenSubKey(RunKeyPath, writable: true)
            ?? Registry.CurrentUser.CreateSubKey(RunKeyPath);

        key.DeleteValue(LegacyValueName, throwOnMissingValue: false);

        if (!enabled)
        {
            key.DeleteValue(ValueName, throwOnMissingValue: false);
            return;
        }

        var exe = ResolveExecutablePath();
        if (string.IsNullOrWhiteSpace(exe))
            throw new InvalidOperationException("مسیر اجرایی برنامه پیدا نشد.");

        key.SetValue(ValueName, $"\"{exe}\" {AutostartArg}");
    }

    private static string? ResolveExecutablePath()
    {
        var processPath = Environment.ProcessPath;
        if (!string.IsNullOrWhiteSpace(processPath) && File.Exists(processPath))
            return processPath;

        var main = Process.GetCurrentProcess().MainModule?.FileName;
        if (!string.IsNullOrWhiteSpace(main) && File.Exists(main))
            return main;

        return null;
    }
}
