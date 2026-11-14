using System.Net;
using System.Text.RegularExpressions;

namespace ArkaLearnDesktop.App.Services;

/// <summary>
/// Resolves chat/story/avatar media URLs the same way as the web clients:
/// static assets live on https://msg.arkasoftware.ir (often under /public/...).
/// </summary>
public static class DesktopMediaUriHelper
{
    public const string ProductionStaticAssetBaseUrl = "https://msg.arkasoftware.ir";

    private static readonly Regex MediaFolderPrefix = new(
        @"^/(?:images|videos|seminars|rooms|users|projects|files|media|audio)/",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static Uri? Resolve(string? relativeOrAbsolute, string apiBaseUrl) =>
        ResolveCandidates(relativeOrAbsolute, apiBaseUrl).FirstOrDefault();

    /// <summary>
    /// Ordered candidates: msg/public first, then API origin variants (web-style fallback).
    /// </summary>
    public static IReadOnlyList<Uri> ResolveCandidates(string? relativeOrAbsolute, string apiBaseUrl)
    {
        var results = new List<Uri>();
        if (string.IsNullOrWhiteSpace(relativeOrAbsolute)) return results;

        var decoded = WebUtility.HtmlDecode(relativeOrAbsolute).Trim();
        if (string.IsNullOrWhiteSpace(decoded)) return results;

        var staticBase = ProductionStaticAssetBaseUrl.TrimEnd('/');
        var apiAuthority = SafeAuthority(apiBaseUrl);

        void Add(Uri? uri)
        {
            if (uri is null) return;
            if (results.Any(x => string.Equals(x.AbsoluteUri, uri.AbsoluteUri, StringComparison.OrdinalIgnoreCase)))
                return;
            results.Add(uri);
        }

        if (Uri.TryCreate(decoded, UriKind.Absolute, out var absolute))
        {
            Add(RewriteAbsoluteMediaUri(absolute, staticBase));
            Add(absolute);

            var normalized = NormalizeAssetPath(absolute.AbsolutePath);
            if (!string.IsNullOrWhiteSpace(normalized))
            {
                Add(new Uri(staticBase + EnsureMsgPublicPrefix(normalized) + absolute.Query));
                if (apiAuthority is not null)
                {
                    Add(new Uri(apiAuthority.TrimEnd('/') + EnsureMsgPublicPrefix(normalized) + absolute.Query));
                    Add(new Uri(apiAuthority.TrimEnd('/') + normalized + absolute.Query));
                }
            }

            return results;
        }

        var path = NormalizeAssetPath(decoded);
        if (string.IsNullOrWhiteSpace(path)) return results;

        var publicPath = EnsureMsgPublicPrefix(path);
        if (IsStaticMediaPath(path) || IsStaticMediaPath(publicPath))
            Add(new Uri(staticBase + publicPath));

        if (apiAuthority is not null)
        {
            Add(new Uri(apiAuthority.TrimEnd('/') + publicPath));
            Add(new Uri(apiAuthority.TrimEnd('/') + path));
        }

        if (results.Count == 0)
            Add(new Uri((apiAuthority ?? staticBase).TrimEnd('/') + path));

        return results;
    }

    private static Uri RewriteAbsoluteMediaUri(Uri absolute, string staticBase)
    {
        var host = absolute.Host;
        var pathOnly = absolute.AbsolutePath;

        if (IsMsgHost(host) && pathOnly.StartsWith("/public/", StringComparison.OrdinalIgnoreCase))
            return absolute;

        if (!IsArkaRelatedHost(host) && !IsMsgHost(host))
            return absolute;

        var normalizedPath = NormalizeAssetPath(pathOnly);
        if (!IsStaticMediaPath(normalizedPath) && !IsMsgHost(host))
            return absolute;

        if (IsStaticMediaPath(normalizedPath) || IsMsgHost(host))
        {
            normalizedPath = EnsureMsgPublicPrefix(normalizedPath);
            return new Uri(staticBase + normalizedPath + absolute.Query);
        }

        return absolute;
    }

    private static string NormalizeAssetPath(string raw)
    {
        var path = raw.Trim().Replace('\\', '/');
        if (string.IsNullOrWhiteSpace(path)) return string.Empty;
        if (!path.StartsWith('/')) path = "/" + path;

        path = Regex.Replace(path, @"^/api/api/(?=(?:images|videos|seminars|rooms|media|audio|users|files)\b)", "/api/", RegexOptions.IgnoreCase);
        path = Regex.Replace(path, @"^/api/(?=(?:images|videos|seminars|rooms|media|audio|users|files)\b)", "/", RegexOptions.IgnoreCase);
        path = Regex.Replace(path, @"^/api/Service/(?=(?:images|videos|seminars|rooms|media|audio|users|files)\b)", "/", RegexOptions.IgnoreCase);
        path = Regex.Replace(path, @"^/wwwroot(?=/)", "", RegexOptions.IgnoreCase);

        return path;
    }

    private static string EnsureMsgPublicPrefix(string assetPath)
    {
        if (string.IsNullOrWhiteSpace(assetPath)) return assetPath;
        if (Regex.IsMatch(assetPath, @"^/(?:public|private|drm)/", RegexOptions.IgnoreCase))
            return assetPath;
        if (MediaFolderPrefix.IsMatch(assetPath))
            return "/public" + assetPath;
        return assetPath;
    }

    private static bool IsStaticMediaPath(string path) =>
        MediaFolderPrefix.IsMatch(path)
        || path.StartsWith("/public/", StringComparison.OrdinalIgnoreCase);

    private static bool IsMsgHost(string host)
    {
        host = host.ToLowerInvariant();
        return host == "msg.arkasoftware.ir" || host.StartsWith("msg.", StringComparison.Ordinal);
    }

    private static bool IsArkaRelatedHost(string host)
    {
        host = host.ToLowerInvariant();
        return host == "api.arkasoftware.ir"
               || host == "arkasoftware.ir"
               || host == "www.arkasoftware.ir"
               || host.EndsWith(".arkasoftware.ir", StringComparison.Ordinal);
    }

    private static string? SafeAuthority(string? apiBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(apiBaseUrl)) return null;
        try
        {
            return new Uri(apiBaseUrl.TrimEnd('/') + "/").GetLeftPart(UriPartial.Authority);
        }
        catch
        {
            return null;
        }
    }
}
