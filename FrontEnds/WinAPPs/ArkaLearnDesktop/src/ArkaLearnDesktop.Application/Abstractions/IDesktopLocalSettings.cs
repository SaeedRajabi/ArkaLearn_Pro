namespace ArkaLearnDesktop.Application.Abstractions;

public enum DesktopThemePreference
{
    System = 0,
    Light = 1,
    Dark = 2,
}

/// <summary>Client-only settings (API URL, device id, theme). Business data lives on SQL Server via API.</summary>
public interface IDesktopLocalSettings
{
    string ApiBaseUrl { get; }
    string ClientWebsiteBaseUrl { get; }
    string DeviceId { get; }
    DesktopThemePreference ThemePreference { get; }
    bool StartWithWindows { get; }
    /// <summary>Last successful login username/email (persists across logout).</summary>
    string? LastUserNameOrEmail { get; }
    Task EnsureInitializedAsync(CancellationToken cancellationToken = default);
    Task SaveApiBaseUrlAsync(string apiBaseUrl, CancellationToken cancellationToken = default);
    Task SaveThemePreferenceAsync(DesktopThemePreference preference, CancellationToken cancellationToken = default);
    Task SaveStartWithWindowsAsync(bool enabled, CancellationToken cancellationToken = default);
    Task SaveLastUserNameOrEmailAsync(string? userNameOrEmail, CancellationToken cancellationToken = default);
}

public interface IWindowsStartupService
{
    bool IsEnabled { get; }
    void SetEnabled(bool enabled);
}
