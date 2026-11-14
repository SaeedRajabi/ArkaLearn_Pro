using ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Domain.FileStorageAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.FileStorage;

public sealed class FileStorageMigrationBackgroundService(
    IServiceScopeFactory scopeFactory,
    IWebHostEnvironment env,
    IOptions<FileStorageOptions> options,
    ILogger<FileStorageMigrationBackgroundService> logger) : BackgroundService
{
    private static readonly string[] ScanRoots =
    [
        "media", "images", "videos", "seminars", "files", "users", "rooms", "projects", "audio",
    ];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Delay startup so the API can finish bootstrapping.
        try { await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (options.Value.MigrationEnabled)
                    await RunMigrationBatchAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "File storage migration batch failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task RunMigrationBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ArkaSoftwareCommandDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorage>();
        var opts = scope.ServiceProvider.GetRequiredService<IOptions<FileStorageOptions>>().Value;

        var webRoot = env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
            webRoot = Path.Combine(env.ContentRootPath, "wwwroot");
        if (!Directory.Exists(webRoot))
            return;

        // Discover a limited batch of untracked files each cycle.
        var existing = await db.Set<FileStorageMigration>()
            .AsNoTracking()
            .Select(x => x.SourcePath)
            .ToListAsync(cancellationToken);
        var known = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);

        var discovered = 0;
        foreach (var root in ScanRoots)
        {
            var physicalRoot = Path.Combine(webRoot, root);
            if (!Directory.Exists(physicalRoot))
                continue;

            foreach (var file in Directory.EnumerateFiles(physicalRoot, "*", SearchOption.AllDirectories))
            {
                if (discovered >= 200)
                    break;

                var relative = Path.GetRelativePath(webRoot, file).Replace('\\', '/');
                var sourcePath = "/" + relative.TrimStart('/');
                if (known.Contains(sourcePath))
                    continue;

                var tier = FileStorageKeyHelper.InferTier(relative);
                var objectKey = FileStorageKeyHelper.LegacyWebPathToObjectKey(sourcePath, tier);
                db.Set<FileStorageMigration>().Add(FileStorageMigration.Create(sourcePath, objectKey, tier.ToString().ToLowerInvariant()));
                known.Add(sourcePath);
                discovered++;
            }

            if (discovered >= 200)
                break;
        }

        if (discovered > 0)
            await db.SaveChangesAsync(cancellationToken);

        // Process pending/failed rows (retry failed lightly).
        var pending = await db.Set<FileStorageMigration>()
            .Where(x => x.Status == "Pending" || x.Status == "Failed")
            .OrderBy(x => x.Id)
            .Take(25)
            .ToListAsync(cancellationToken);

        foreach (var row in pending)
        {
            cancellationToken.ThrowIfCancellationRequested();
            row.MarkRunning();
            await db.SaveChangesAsync(cancellationToken);

            try
            {
                var relative = row.SourcePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var physical = Path.GetFullPath(Path.Combine(webRoot, relative));
                var webRootFull = Path.GetFullPath(webRoot);
                if (!physical.StartsWith(webRootFull, StringComparison.OrdinalIgnoreCase) || !File.Exists(physical))
                {
                    row.MarkFailed("Local source file missing.");
                    await db.SaveChangesAsync(cancellationToken);
                    continue;
                }

                if (await storage.ExistsAsync(row.ObjectKey, cancellationToken))
                {
                    var info = new FileInfo(physical);
                    row.MarkCompleted(info.Length);
                    await db.SaveChangesAsync(cancellationToken);
                    if (opts.DeleteLocalAfterMigrate)
                        TryDelete(physical);
                    continue;
                }

                await using (var fs = File.OpenRead(physical))
                {
                    var tier = Enum.TryParse<FileAccessTier>(row.AccessTier, true, out var parsed)
                        ? parsed
                        : FileAccessTier.Public;
                    var contentType = GuessContentType(physical);
                    var stored = await storage.PutAsync(row.ObjectKey, fs, contentType, tier, cancellationToken);
                    row.MarkCompleted(stored.SizeBytes > 0 ? stored.SizeBytes : new FileInfo(physical).Length);
                }

                await db.SaveChangesAsync(cancellationToken);
                if (opts.DeleteLocalAfterMigrate)
                    TryDelete(physical);

                // Soft rate-limit between uploads.
                await Task.Delay(150, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed migrating {SourcePath}", row.SourcePath);
                row.MarkFailed(ex.Message);
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }

    private static void TryDelete(string path)
    {
        try { File.Delete(path); } catch { /* best effort */ }
    }

    private static string GuessContentType(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".pdf" => "application/pdf",
            ".arka" => "application/octet-stream",
            _ => "application/octet-stream",
        };
    }
}
