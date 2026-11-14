using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Endpoints.API.Adapters.Uploads;

public static class FileStorageUploadExtensions
{
    public static async Task<StoredObjectResult> SaveFormFileAsync(
        this IFileStorage storage,
        IFormFile file,
        string objectKeyOrDirectory,
        FileAccessTier tier,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);
        var ext = Path.GetExtension(file.FileName);
        var key = objectKeyOrDirectory.Replace('\\', '/').Trim().TrimStart('/');
        if (!Path.HasExtension(key) || key.EndsWith('/'))
        {
            key = key.TrimEnd('/') + "/" + $"{Guid.NewGuid():N}{ext}";
        }

        await using var stream = file.OpenReadStream();
        return await storage.PutAsync(
            key,
            stream,
            string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            tier,
            cancellationToken);
    }

    /// <summary>
    /// Returns a browser-facing URL: absolute msg URL for public, or relative legacy path when local.
    /// </summary>
    public static string ToClientUrl(this StoredObjectResult stored)
    {
        if (stored.PublicOrAbsoluteUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return stored.PublicOrAbsoluteUrl;
        return stored.PublicOrAbsoluteUrl.StartsWith('/')
            ? stored.PublicOrAbsoluteUrl
            : "/" + stored.PublicOrAbsoluteUrl;
    }
}

