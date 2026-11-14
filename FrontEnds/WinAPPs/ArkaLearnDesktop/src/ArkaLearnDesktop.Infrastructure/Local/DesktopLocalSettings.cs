using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Infrastructure.Api;
using System.IO;
using System.Text.Json;

namespace ArkaLearnDesktop.Infrastructure.Local;

public sealed class DesktopLocalSettings : IDesktopLocalSettings
{
    private static readonly string SettingsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ArkaLearnDesktop",
        "settings.json");

    private readonly IWindowsStartupService _startup;
    private SettingsFile _file = new();

    public DesktopLocalSettings(IWindowsStartupService startup)
    {
        _startup = startup;
    }

    public string ApiBaseUrl =>
        DesktopApiDefaults.NormalizeApiBaseUrl(
            Environment.GetEnvironmentVariable("ARKASOFTWARE_API_BASE")
            ?? Environment.GetEnvironmentVariable("ARKALEARN_API_BASE")
            ?? _file.ApiBaseUrl);

    public string ClientWebsiteBaseUrl =>
        DesktopApiDefaults.ResolveClientWebsiteBaseUrl(
            Environment.GetEnvironmentVariable("ARKASOFTWARE_CLIENT_WEBSITE")
            ?? Environment.GetEnvironmentVariable("ARKALEARN_CLIENT_WEBSITE")
            ?? _file.ClientWebsiteBaseUrl,
            ApiBaseUrl);

    public string DeviceId => _file.DeviceId ?? string.Empty;

    public DesktopThemePreference ThemePreference =>
        Enum.IsDefined(typeof(DesktopThemePreference), _file.ThemePreference)
            ? (DesktopThemePreference)_file.ThemePreference
            : DesktopThemePreference.System;

    public bool StartWithWindows => _file.StartWithWindows;

    public string? LastUserNameOrEmail =>
        string.IsNullOrWhiteSpace(_file.LastUserNameOrEmail) ? null : _file.LastUserNameOrEmail.Trim();

    public async Task EnsureInitializedAsync(CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(SettingsPath)!);

        if (File.Exists(SettingsPath))
        {
            await using var stream = File.OpenRead(SettingsPath);
            _file = await JsonSerializer.DeserializeAsync<SettingsFile>(stream, cancellationToken: cancellationToken)
                ?? new SettingsFile();
        }

        var changed = false;
        var hardwareId = WindowsHardwareFingerprint.Compute();
        if (!string.Equals(_file.DeviceId, hardwareId, StringComparison.OrdinalIgnoreCase))
        {
            // Prefer hardware fingerprint so Windows reinstall on the same PC keeps licenses.
            _file.DeviceId = hardwareId;
            changed = true;
        }

        if (string.IsNullOrWhiteSpace(_file.DeviceId))
        {
            _file.DeviceId = Guid.NewGuid().ToString("N");
            changed = true;
        }

        var normalized = DesktopApiDefaults.NormalizeApiBaseUrl(_file.ApiBaseUrl);
        if (!string.Equals(_file.ApiBaseUrl, normalized, StringComparison.OrdinalIgnoreCase))
        {
            _file.ApiBaseUrl = normalized;
            changed = true;
        }

        var website = DesktopApiDefaults.ResolveClientWebsiteBaseUrl(_file.ClientWebsiteBaseUrl, normalized);
        if (!string.Equals(_file.ClientWebsiteBaseUrl, website, StringComparison.OrdinalIgnoreCase))
        {
            _file.ClientWebsiteBaseUrl = website;
            changed = true;
        }

        if (_file.StartWithWindowsConfigured is not true)
        {
            // First run / upgrade: enable autostart for tray readiness (AnyDesk-style).
            _file.StartWithWindows = true;
            _file.StartWithWindowsConfigured = true;
            changed = true;
        }

        if (changed)
            await SaveAsync(cancellationToken);

        try
        {
            _startup.SetEnabled(_file.StartWithWindows);
        }
        catch
        {
            // Registry may be restricted; UI can still toggle later.
        }
    }

    public async Task SaveApiBaseUrlAsync(string apiBaseUrl, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        _file.ApiBaseUrl = DesktopApiDefaults.NormalizeApiBaseUrl(apiBaseUrl);
        await SaveAsync(cancellationToken);
    }

    public async Task SaveThemePreferenceAsync(DesktopThemePreference preference, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        _file.ThemePreference = (int)preference;
        await SaveAsync(cancellationToken);
    }

    public async Task SaveStartWithWindowsAsync(bool enabled, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        _file.StartWithWindows = enabled;
        _file.StartWithWindowsConfigured = true;
        await SaveAsync(cancellationToken);
        _startup.SetEnabled(enabled);
    }

    public async Task SaveLastUserNameOrEmailAsync(string? userNameOrEmail, CancellationToken cancellationToken = default)
    {
        await EnsureInitializedAsync(cancellationToken);
        _file.LastUserNameOrEmail = string.IsNullOrWhiteSpace(userNameOrEmail)
            ? null
            : userNameOrEmail.Trim();
        await SaveAsync(cancellationToken);
    }

    private async Task SaveAsync(CancellationToken cancellationToken)
    {
        await using var stream = File.Create(SettingsPath);
        await JsonSerializer.SerializeAsync(stream, _file, cancellationToken: cancellationToken);
    }

    private sealed class SettingsFile
    {
        public string? ApiBaseUrl { get; set; }
        public string? ClientWebsiteBaseUrl { get; set; }
        public string? DeviceId { get; set; }
        public int ThemePreference { get; set; }
        public bool StartWithWindows { get; set; } = true;
        public bool? StartWithWindowsConfigured { get; set; }
        public string? LastUserNameOrEmail { get; set; }
    }
}
