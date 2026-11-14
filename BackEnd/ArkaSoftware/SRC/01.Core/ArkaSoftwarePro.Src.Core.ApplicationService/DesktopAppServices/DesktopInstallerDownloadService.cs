using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices;

public sealed class DesktopInstallerDownloadService(IConfiguration configuration, IDownloadReadRepository downloads,
    IFileStorage fileStorage, ILegacyFileStore legacyFiles, IOptions<FileStorageOptions> fileStorageOptions)
{
    private static readonly Regex GuidFileNameRegex = new(@"^[0-9a-f]{32}$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    public async Task<FileOperationResult> Download(string? version, CancellationToken cancellationToken)
    {
        var release = await downloads.GetPublishedInstallerAsync(version, cancellationToken);

        if (release is null || string.IsNullOrWhiteSpace(release.InstallerUrl))
            return FileOperationResult.Missing("No published desktop installer is available.");

        var installerUrl = release.InstallerUrl.Trim();
        var downloadName = await ResolveDownloadFileNameAsync(installerUrl, release.Version, cancellationToken);

        // External CDN / absolute URL that is not hosted under this API wwwroot → redirect.
        if (Uri.TryCreate(installerUrl, UriKind.Absolute, out var absolute)
            && (absolute.Scheme == Uri.UriSchemeHttp || absolute.Scheme == Uri.UriSchemeHttps)
            && !IsLocalMediaUrl(absolute))
        {
            return FileOperationResult.Redirect(installerUrl);
        }

        // Legacy: installer still on API wwwroot (pre–download-host migration).
        var legacy = OpenLegacyInstaller(installerUrl);
        if (legacy is not null)
        {
            var contentType = ResolveContentType(installerUrl);
            return FileOperationResult.Download(legacy, contentType, downloadName);
        }

        // Installers are published via media upload to the download host (msg/FTP).
        // API wwwroot no longer holds them — redirect to the public static URL.
        var remoteUrl = ResolveRemotePublicInstallerUrl(installerUrl);
        if (!string.IsNullOrWhiteSpace(remoteUrl))
            return FileOperationResult.Redirect(remoteUrl);

        return FileOperationResult.Missing("Installer file was not found on the server.");
    }

    private Stream? OpenLegacyInstaller(string installerUrl)
    {
        var relative = ExtractPath(installerUrl);
        if (string.IsNullOrWhiteSpace(relative)) return null;
        var candidates = new List<string> { relative };
        if (relative.StartsWith("public" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            candidates.Add(relative["public".Length..].TrimStart(Path.DirectorySeparatorChar));
        else
            candidates.Add(Path.Combine("public", relative));
        foreach (var candidate in candidates)
        {
            var stream = legacyFiles.OpenRead(candidate);
            if (stream is not null) return stream;
        }
        return null;
    }

    private async Task<string> ResolveDownloadFileNameAsync(
        string installerUrl,
        string version,
        CancellationToken cancellationToken)
    {
        var ext = Path.GetExtension(ExtractPath(installerUrl));
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".msi";

        var relativePath = "/" + ExtractPath(installerUrl).Replace('\\', '/').TrimStart('/');
        var original = await downloads.GetOriginalMediaFileNameAsync(relativePath, cancellationToken);

        var candidate = SanitizeFileName(original);
        if (!string.IsNullOrWhiteSpace(candidate))
        {
            var candidateBase = Path.GetFileNameWithoutExtension(candidate);
            if (!GuidFileNameRegex.IsMatch(candidateBase))
            {
                if (string.IsNullOrWhiteSpace(Path.GetExtension(candidate)))
                    candidate += ext;
                return candidate;
            }
        }

        var safeVersion = SanitizeFileName(version) ?? "latest";
        return $"ArkaSoftwareDesktop-{safeVersion}{ext}";
    }

    private string? ResolveRemotePublicInstallerUrl(string installerUrl)
    {
        try
        {
            var objectKey = fileStorage.ToObjectKey(installerUrl, FileAccessTier.Public);
            if (string.IsNullOrWhiteSpace(objectKey))
                return null;

            var publicUrl = fileStorage.GetPublicUrl(objectKey)?.Trim();
            if (string.IsNullOrWhiteSpace(publicUrl))
                return null;

            if (publicUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || publicUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return publicUrl;

            var baseUrl = (fileStorageOptions.Value.PublicBaseUrl ?? string.Empty).TrimEnd('/');
            if (string.IsNullOrWhiteSpace(baseUrl))
                return null;

            var path = publicUrl.StartsWith('/') ? publicUrl : "/" + publicUrl.TrimStart('/');
            if (!path.StartsWith("/public/", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWith("/private/", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWith("/drm/", StringComparison.OrdinalIgnoreCase))
            {
                path = "/public" + path;
            }

            return baseUrl + path;
        }
        catch
        {
            return null;
        }
    }

    private bool IsLocalMediaUrl(Uri absolute)
    {
        var publicBase =
            configuration["PaymentGateway:PublicApiBaseUrl"]
            ?? configuration["PublicApiBaseUrl"];

        if (!string.IsNullOrWhiteSpace(publicBase)
            && Uri.TryCreate(publicBase, UriKind.Absolute, out var baseUri)
            && string.Equals(absolute.Host, baseUri.Host, StringComparison.OrdinalIgnoreCase))
        {
            return absolute.AbsolutePath.Contains("/media/", StringComparison.OrdinalIgnoreCase)
                   || absolute.AbsolutePath.Contains("/api/Service/DesktopApp/Download", StringComparison.OrdinalIgnoreCase);
        }

        return absolute.AbsolutePath.Contains("/media/", StringComparison.OrdinalIgnoreCase);
    }

    private static string ExtractPath(string installerUrl)
    {
        var normalized = installerUrl.Trim();
        if (Uri.TryCreate(normalized, UriKind.Absolute, out var absolute))
            normalized = absolute.AbsolutePath;

        // Strip optional virtual dirs before /media/
        var mediaIdx = normalized.IndexOf("/media/", StringComparison.OrdinalIgnoreCase);
        if (mediaIdx >= 0)
            normalized = normalized[mediaIdx..];

        return normalized.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
    }

    private static string ResolveContentType(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".msi" => "application/x-msi",
            ".exe" => "application/vnd.microsoft.portable-executable",
            ".zip" => "application/zip",
            _ => "application/octet-stream",
        };
    }

    private static string? SanitizeFileName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return null;

        var fileName = Path.GetFileName(name.Trim());
        foreach (var character in Path.GetInvalidFileNameChars())
            fileName = fileName.Replace(character, '_');

        fileName = fileName.Trim('.', ' ');
        return string.IsNullOrWhiteSpace(fileName) ? null : fileName;
    }
}
