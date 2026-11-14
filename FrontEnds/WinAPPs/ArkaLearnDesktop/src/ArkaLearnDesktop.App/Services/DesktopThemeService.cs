using System.Windows;
using ArkaLearnDesktop.Application.Abstractions;
using Microsoft.Win32;

namespace ArkaLearnDesktop.App.Services;

public interface IDesktopThemeService
{
    DesktopThemePreference CurrentPreference { get; }
    void Apply(DesktopThemePreference preference);
    void ApplyFromSettings();
}

public sealed class DesktopThemeService : IDesktopThemeService
{
    private readonly IDesktopLocalSettings _settings;
    private DesktopThemePreference _current = DesktopThemePreference.System;

    public DesktopThemeService(IDesktopLocalSettings settings)
    {
        _settings = settings;
    }

    public DesktopThemePreference CurrentPreference => _current;

    public void ApplyFromSettings() => Apply(_settings.ThemePreference);

    public void Apply(DesktopThemePreference preference)
    {
        _current = preference;
        var useLight = preference switch
        {
            DesktopThemePreference.Light => true,
            DesktopThemePreference.Dark => false,
            _ => IsOsLightTheme(),
        };

        var uri = new Uri(
            useLight
                ? "pack://application:,,,/Themes/LightTheme.xaml"
                : "pack://application:,,,/Themes/DarkTheme.xaml",
            UriKind.Absolute);

        var app = System.Windows.Application.Current;
        if (app is null) return;

        var dicts = app.Resources.MergedDictionaries;
        ResourceDictionary? existing = null;
        foreach (var dict in dicts)
        {
            if (dict.Source?.OriginalString.Contains("Theme.xaml", StringComparison.OrdinalIgnoreCase) == true)
            {
                existing = dict;
                break;
            }
        }

        var next = new ResourceDictionary { Source = uri };
        if (existing is not null)
        {
            var index = dicts.IndexOf(existing);
            dicts.RemoveAt(index);
            dicts.Insert(index, next);
        }
        else
        {
            dicts.Insert(0, next);
        }
    }

    private static bool IsOsLightTheme()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");
            var value = key?.GetValue("AppsUseLightTheme");
            if (value is int i) return i != 0;
            if (value is long l) return l != 0;
        }
        catch
        {
            // fall through
        }

        return false;
    }
}
