using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.FileStorage;

public sealed class UploadCleanupBackgroundService(IServiceScopeFactory scopes, IWebHostEnvironment environment,
    ILogger<UploadCleanupBackgroundService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(15));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                CleanupLegacyLocalChunks(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"),
                    TimeSpan.FromHours(6));
            }
            catch (Exception error) { logger.LogWarning(error, "Legacy local upload cleanup failed; it will be retried."); }
            try
            {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IRemoteUploadStorage>()
                    .CleanupExpiredUploadsAsync(TimeSpan.FromHours(6), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception error) { logger.LogWarning(error, "Download-host abandoned-upload cleanup failed; it will be retried."); }
        }
    }

    internal static void CleanupLegacyLocalChunks(string webRoot, TimeSpan maxAge)
    {
        var webDirectory = new DirectoryInfo(Path.GetFullPath(webRoot));
        if (!webDirectory.Exists || webDirectory.Attributes.HasFlag(FileAttributes.ReparsePoint)) return;
        foreach (var scope in new[] { "users", "rooms" })
        {
            var scopeDirectory = new DirectoryInfo(Path.Combine(webDirectory.FullName, scope));
            if (!scopeDirectory.Exists || scopeDirectory.Attributes.HasFlag(FileAttributes.ReparsePoint)) continue;
            var root = new DirectoryInfo(Path.Combine(scopeDirectory.FullName, "upload-chunks"));
            if (!root.Exists || root.Attributes.HasFlag(FileAttributes.ReparsePoint)) continue;
            var prefix = root.FullName.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            foreach (var directory in root.EnumerateDirectories())
            {
                if (!Guid.TryParseExact(directory.Name, "N", out _) || directory.Attributes.HasFlag(FileAttributes.ReparsePoint)
                    || !Path.GetFullPath(directory.FullName).StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) continue;
                var entries = directory.EnumerateFileSystemInfos().ToArray();
                if (entries.Any(entry => entry is not FileInfo || entry.Attributes.HasFlag(FileAttributes.ReparsePoint)
                    || !entry.Name.EndsWith(".part", StringComparison.OrdinalIgnoreCase))) continue;
                var lastWrite = entries.Select(entry => entry.LastWriteTimeUtc).Append(directory.LastWriteTimeUtc).Max();
                if (lastWrite >= DateTime.UtcNow - maxAge) continue;
                foreach (var entry in entries) File.Delete(entry.FullName);
                directory.Delete();
            }
        }
    }
}
