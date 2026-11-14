using System.IO;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Domain.Drm;

namespace ArkaLearnDesktop.Infrastructure.Local;

/// <summary>Indexes encrypted payload files on disk. Metadata comes from API when playing.</summary>
public sealed class FileEncryptedMediaCacheStore : IEncryptedMediaCacheStore
{
    private static string CacheDir => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ArkaLearnDesktop",
        "encrypted-cache");

    public Task<IReadOnlyList<LocalEncryptedMediaCache>> ListAsync(CancellationToken cancellationToken = default)
    {
        if (!Directory.Exists(CacheDir)) return Task.FromResult<IReadOnlyList<LocalEncryptedMediaCache>>([]);

        var items = Directory.EnumerateFiles(CacheDir)
            .Where(path =>
            {
                var ext = Path.GetExtension(path);
                return ext.Equals(".enc", StringComparison.OrdinalIgnoreCase)
                       || ext.Equals(".arka", StringComparison.OrdinalIgnoreCase);
            })
            .Select(path =>
            {
                var name = Path.GetFileNameWithoutExtension(path);
                if (!long.TryParse(name, out var mediaAssetId) || mediaAssetId <= 0) return null;
                var info = new FileInfo(path);
                return new LocalEncryptedMediaCache
                {
                    MediaAssetId = mediaAssetId,
                    LocalEncryptedPath = path,
                    FileSizeBytes = info.Length,
                    DownloadedAtUtc = info.LastWriteTimeUtc,
                    Title = $"مدیا {mediaAssetId}",
                    MimeType = "video/mp4",
                };
            })
            .Where(x => x is not null)
            .Cast<LocalEncryptedMediaCache>()
            .OrderByDescending(x => x.DownloadedAtUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<LocalEncryptedMediaCache>>(items);
    }

    public Task<LocalEncryptedMediaCache?> GetByMediaIdAsync(long mediaAssetId, CancellationToken cancellationToken = default)
    {
        var encPath = Path.Combine(CacheDir, $"{mediaAssetId}.enc");
        var arkaPath = Path.Combine(CacheDir, $"{mediaAssetId}.arka");
        var path = File.Exists(arkaPath) ? arkaPath : File.Exists(encPath) ? encPath : null;
        if (path is null) return Task.FromResult<LocalEncryptedMediaCache?>(null);

        var info = new FileInfo(path);
        return Task.FromResult<LocalEncryptedMediaCache?>(new LocalEncryptedMediaCache
        {
            MediaAssetId = mediaAssetId,
            LocalEncryptedPath = path,
            FileSizeBytes = info.Length,
            DownloadedAtUtc = info.LastWriteTimeUtc,
            Title = $"مدیا {mediaAssetId}",
            MimeType = "video/mp4",
        });
    }

    public Task UpsertAsync(LocalEncryptedMediaCache item, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(CacheDir);
        if (!string.IsNullOrWhiteSpace(item.LocalEncryptedPath) && File.Exists(item.LocalEncryptedPath))
            return Task.CompletedTask;

        item.LocalEncryptedPath = Path.Combine(CacheDir, $"{item.MediaAssetId}.enc");
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(long mediaAssetId, CancellationToken cancellationToken = default)
    {
        var deleted = false;
        foreach (var ext in new[] { ".enc", ".arka", ".enc.partial", ".arka.partial" })
        {
            var path = Path.Combine(CacheDir, $"{mediaAssetId}{ext}");
            if (!File.Exists(path)) continue;
            File.Delete(path);
            deleted = true;
        }

        return Task.FromResult(deleted);
    }
}
