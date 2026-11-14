using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Windows.Data;
using System.Windows.Media.Imaging;

namespace ArkaLearnDesktop.App.Converters;

public sealed class StringToImageSourceConverter : IValueConverter
{
    private static readonly HttpClient Http = CreateClient();
    private static readonly Dictionary<string, BitmapImage> Cache = new(StringComparer.OrdinalIgnoreCase);

    public object? Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not string raw || string.IsNullOrWhiteSpace(raw)) return null;
        var key = raw.Trim();
        if (!Uri.TryCreate(key, UriKind.Absolute, out var uri)) return null;

        lock (Cache)
        {
            if (Cache.TryGetValue(key, out var cached))
                return cached;
        }

        try
        {
            BitmapImage image;
            if (uri.Scheme is "http" or "https")
            {
                var bytes = Http.GetByteArrayAsync(uri).GetAwaiter().GetResult();
                using var memory = new MemoryStream(bytes);
                image = new BitmapImage();
                image.BeginInit();
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.CreateOptions = BitmapCreateOptions.IgnoreColorProfile;
                image.StreamSource = memory;
                image.DecodePixelWidth = 160;
                image.EndInit();
            }
            else
            {
                image = new BitmapImage();
                image.BeginInit();
                image.UriSource = uri;
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.CreateOptions = BitmapCreateOptions.IgnoreColorProfile | BitmapCreateOptions.IgnoreImageCache;
                image.DecodePixelWidth = 160;
                image.EndInit();
            }

            if (image.CanFreeze) image.Freeze();
            lock (Cache) Cache[key] = image;
            return image;
        }
        catch
        {
            return null;
        }
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();

    private static HttpClient CreateClient()
    {
        var client = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ArkaLearnDesktop/2.6");
        return client;
    }
}

public sealed class DisplayInitialsConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not string name || string.IsNullOrWhiteSpace(name)) return "?";
        return name.Trim()[0].ToString();
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

public sealed class NullToCollapsedVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture) =>
        value is null || (value is string s && string.IsNullOrWhiteSpace(s))
            ? System.Windows.Visibility.Collapsed
            : System.Windows.Visibility.Visible;

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

public sealed class NullToVisibleVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture) =>
        value is null || (value is string s && string.IsNullOrWhiteSpace(s))
            ? System.Windows.Visibility.Visible
            : System.Windows.Visibility.Collapsed;

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}

public sealed class StringToUriConverter : IValueConverter
{
    public object? Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is not string raw || string.IsNullOrWhiteSpace(raw)) return null;
        return Uri.TryCreate(raw.Trim(), UriKind.Absolute, out var uri) ? uri : null;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        value is Uri uri ? uri.ToString() : string.Empty;
}
