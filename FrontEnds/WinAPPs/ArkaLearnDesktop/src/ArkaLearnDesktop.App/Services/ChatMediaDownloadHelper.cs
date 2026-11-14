using System.IO;
using System.Net.Http;
using Microsoft.Win32;

namespace ArkaLearnDesktop.App.Services;

internal static class ChatMediaDownloadHelper
{
    private static readonly HttpClient Http = new();

    public static async Task<string?> DownloadAsync(string url, string? suggestedFileName)
    {
        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out _))
            return null;

        var extension = GuessExtension(url, suggestedFileName);
        var dialog = new SaveFileDialog
        {
            Title = "ذخیره فایل",
            FileName = SanitizeFileName(suggestedFileName) ?? $"download-{DateTime.Now:yyyyMMdd-HHmmss}{extension}",
            Filter = $"فایل|*{extension}|همه فایل‌ها|*.*",
        };

        if (dialog.ShowDialog() != true) return null;

        await using var remote = await Http.GetStreamAsync(url);
        await using var local = File.Create(dialog.FileName);
        await remote.CopyToAsync(local);
        return dialog.FileName;
    }

    private static string GuessExtension(string url, string? fileName)
    {
        var fromName = Path.GetExtension(fileName ?? string.Empty);
        if (!string.IsNullOrWhiteSpace(fromName)) return fromName;

        try
        {
            var path = new Uri(url).AbsolutePath;
            var ext = Path.GetExtension(path);
            if (!string.IsNullOrWhiteSpace(ext) && ext.Length <= 8) return ext;
        }
        catch
        {
            // ignore
        }

        return ".bin";
    }

    private static string? SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        foreach (var c in Path.GetInvalidFileNameChars())
            name = name.Replace(c, '_');
        return name.Trim();
    }
}
