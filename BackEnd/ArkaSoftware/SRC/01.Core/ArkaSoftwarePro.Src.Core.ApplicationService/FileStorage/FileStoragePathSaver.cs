using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage;

/// <summary>
/// Saves form uploads through <see cref="IFileStorage"/> and returns a DB-friendly web path.
/// </summary>
public sealed class FileStoragePathSaver(IFileStorage fileStorage)
{
    public async Task<string> SavePublicAsync(
        IFormFile file,
        string wwwrootOrRelativeDirectory,
        string? customFileName = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);
        var relativeDir = StripWwwroot(wwwrootOrRelativeDirectory).Trim('/').Replace('\\', '/');
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) && !string.IsNullOrWhiteSpace(customFileName))
            ext = Path.GetExtension(customFileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".bin";

        var fileName = string.IsNullOrWhiteSpace(customFileName)
            ? $"{Guid.NewGuid():N}{ext}"
            : Path.GetFileName(customFileName);
        if (string.IsNullOrWhiteSpace(Path.GetExtension(fileName)))
            fileName += ext;

        var objectKey = $"{relativeDir}/{fileName}";
        await using var stream = file.OpenReadStream();
        var stored = await fileStorage.PutAsync(
            objectKey,
            stream,
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileAccessTier.Public,
            cancellationToken);

        return ToDbStoredPath(stored);
    }

    public async Task<string> SavePrivateAsync(
        IFormFile file,
        string relativeDirectory,
        string? customFileName = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);
        var relativeDir = StripWwwroot(relativeDirectory).Trim('/').Replace('\\', '/');
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".bin";
        var fileName = string.IsNullOrWhiteSpace(customFileName)
            ? $"{Guid.NewGuid():N}{ext}"
            : Path.GetFileName(customFileName);
        var objectKey = $"{relativeDir}/{fileName}";
        await using var stream = file.OpenReadStream();
        var stored = await fileStorage.PutAsync(
            objectKey,
            stream,
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            FileAccessTier.Private,
            cancellationToken);
        return stored.ObjectKey;
    }

    public static string ToDbStoredPath(StoredObjectResult stored)
    {
        var url = stored.PublicOrAbsoluteUrl?.Trim() ?? string.Empty;
        if (url.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            && Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            // Keep /public/... path so msg static base resolves without host lock-in.
            return uri.AbsolutePath + uri.Query;
        }

        if (string.IsNullOrWhiteSpace(url))
        {
            var key = stored.ObjectKey.Replace('\\', '/').TrimStart('/');
            if (key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
                return "/" + key;
            return "/" + key;
        }

        return url.StartsWith('/') ? url : "/" + url;
    }

    private static string StripWwwroot(string path)
    {
        var p = (path ?? string.Empty).Replace('\\', '/').Trim();
        if (p.StartsWith("wwwroot/", StringComparison.OrdinalIgnoreCase))
            return p["wwwroot/".Length..];
        if (p.Equals("wwwroot", StringComparison.OrdinalIgnoreCase))
            return string.Empty;
        return p;
    }
}
