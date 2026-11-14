using System.IO;
using System.Net.Http;
using System.Windows.Media.Imaging;

namespace ArkaLearnDesktop.App.Services;

/// <summary>
/// Loads remote images reliably for WPF (HttpClient + stream), with URL fallbacks
/// matching web (msg /public and API origin).
/// </summary>
internal static class DesktopRemoteImageLoader
{
    private static readonly HttpClient Http = CreateClient();

    public static async Task<BitmapImage?> LoadAsync(string? relativeOrAbsolute, string apiBaseUrl, CancellationToken cancellationToken = default)
    {
        foreach (var uri in DesktopMediaUriHelper.ResolveCandidates(relativeOrAbsolute, apiBaseUrl))
        {
            try
            {
                using var response = await Http.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (!response.IsSuccessStatusCode) continue;

                await using var remote = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var memory = new MemoryStream();
                await remote.CopyToAsync(memory, cancellationToken);
                if (memory.Length == 0) continue;
                memory.Position = 0;

                var image = new BitmapImage();
                image.BeginInit();
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.CreateOptions = BitmapCreateOptions.IgnoreColorProfile;
                image.StreamSource = memory;
                image.EndInit();
                image.Freeze();
                return image;
            }
            catch
            {
                // try next candidate
            }
        }

        return null;
    }

    private static HttpClient CreateClient()
    {
        var client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(45),
        };
        client.DefaultRequestHeaders.UserAgent.ParseAdd(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ArkaLearnDesktop/2.6");
        client.DefaultRequestHeaders.Accept.ParseAdd("image/*,*/*");
        return client;
    }
}
