using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;

public sealed class LegacyFileStore(IWebHostEnvironment environment) : ILegacyFileStore
{
    public Stream? OpenRead(string relativeUrl)
    {
        var path = ResolvePath(relativeUrl);
        return path is not null && File.Exists(path)
            ? new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, FileOptions.Asynchronous)
            : null;
    }

    public void Delete(string relativeUrl)
    {
        try
        {
            var path = ResolvePath(relativeUrl);
            if (path is not null && File.Exists(path)) File.Delete(path);
        }
        catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }

    private string? ResolvePath(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return null;
        var relative = relativeUrl.Trim().Replace('\\', '/').TrimStart('/');
        if (relative.StartsWith("private/", StringComparison.OrdinalIgnoreCase)) relative = relative[8..];
        var root = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"))
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        var path = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
        return path.StartsWith(root, StringComparison.OrdinalIgnoreCase) ? path : null;
    }
}
