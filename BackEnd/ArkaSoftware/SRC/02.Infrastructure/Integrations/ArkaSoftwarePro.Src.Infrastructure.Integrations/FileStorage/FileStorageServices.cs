using System.Security.Cryptography;
using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;

public static class FileStorageKeyHelper
{
    public static string EnsureTierPrefix(string objectKey, FileAccessTier tier)
    {
        var key = (objectKey ?? string.Empty).Replace('\\', '/').Trim().TrimStart('/');
        var prefix = tier switch
        {
            FileAccessTier.Private => "private/",
            FileAccessTier.Drm => "drm/",
            _ => "public/",
        };
        if (key.StartsWith("public/", StringComparison.OrdinalIgnoreCase)
            || key.StartsWith("private/", StringComparison.OrdinalIgnoreCase)
            || key.StartsWith("drm/", StringComparison.OrdinalIgnoreCase))
            return key;

        return prefix + key;
    }

    public static string LegacyWebPathToObjectKey(string legacyWebPath, FileAccessTier? preferredTier = null)
    {
        var path = (legacyWebPath ?? string.Empty).Replace('\\', '/').Trim();
        if (path.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            if (Uri.TryCreate(path, UriKind.Absolute, out var uri))
                path = uri.AbsolutePath;
        }

        path = path.TrimStart('/');
        if (path.StartsWith("wwwroot/", StringComparison.OrdinalIgnoreCase))
            path = path["wwwroot/".Length..];

        var tier = preferredTier ?? InferTier(path);
        return EnsureTierPrefix(path, tier);
    }

    public static FileAccessTier InferTier(string relativePath)
    {
        var p = relativePath.Replace('\\', '/').ToLowerInvariant();
        if (p.EndsWith(".arka") || p.Contains("/media/") && p.Contains(".arka"))
            return FileAccessTier.Drm;
        if (p.StartsWith("seminars/recordings") || p.StartsWith("users/files") || p.StartsWith("rooms/files"))
            return FileAccessTier.Private;
        if (p.StartsWith("drm/") || p.Contains("/drm/"))
            return FileAccessTier.Drm;
        if (p.StartsWith("private/") || p.Contains("/private/"))
            return FileAccessTier.Private;
        return FileAccessTier.Public;
    }

    public static string CreateHmacSignature(string objectKey, long expUnix, string signingKey)
    {
        var payload = $"{objectKey}\n{expUnix}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(signingKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static string BuildSignedUrl(string agentBaseUrl, string objectKey, string signingKey, TimeSpan ttl)
    {
        var baseUrl = agentBaseUrl.TrimEnd('/');
        var exp = DateTimeOffset.UtcNow.Add(ttl).ToUnixTimeSeconds();
        var sig = CreateHmacSignature(objectKey, exp, signingKey);
        return $"{baseUrl}/v1/objects/{objectKey}?exp={exp}&sig={sig}";
    }
}

public sealed class LocalWwwrootFileStorage(
    IWebHostEnvironment env,
    IOptions<FileStorageOptions> options) : IFileStorage
{
    private readonly FileStorageOptions _options = options.Value;

    private string WwwRoot =>
        Path.GetFullPath(Path.Combine(env.ContentRootPath, _options.LocalWwwRootRelative));

    public Task<StoredObjectResult> PutAsync(
        string objectKey,
        Stream content,
        string contentType,
        FileAccessTier tier,
        CancellationToken cancellationToken = default)
    {
        var key = FileStorageKeyHelper.EnsureTierPrefix(objectKey, tier);
        var relative = StripTierForLocal(key);
        var physical = Path.Combine(WwwRoot, relative.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(physical)!);
        return PutCoreAsync(key, physical, content, contentType, cancellationToken);
    }

    private static async Task<StoredObjectResult> PutCoreAsync(
        string key,
        string physical,
        Stream content,
        string contentType,
        CancellationToken cancellationToken)
    {
        await using var output = new FileStream(physical, FileMode.Create, FileAccess.Write, FileShare.None, 64 * 1024, true);
        await content.CopyToAsync(output, cancellationToken);
        var len = new FileInfo(physical).Length;
        var webPath = "/" + StripTierForLocal(key).TrimStart('/');
        return new StoredObjectResult(key, webPath, len, contentType);
    }

    public Task<Stream?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var physical = ResolvePhysical(objectKey);
        if (physical is null || !File.Exists(physical))
            return Task.FromResult<Stream?>(null);
        Stream stream = new FileStream(physical, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, true);
        return Task.FromResult<Stream?>(stream);
    }

    public Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var physical = ResolvePhysical(objectKey);
        return Task.FromResult(physical is not null && File.Exists(physical));
    }

    public Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var physical = ResolvePhysical(objectKey);
        if (physical is not null && File.Exists(physical))
            File.Delete(physical);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string objectKey)
    {
        var key = objectKey.Replace('\\', '/').Trim().TrimStart('/');
        if (key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            return "/" + key["public/".Length..];
        return "/" + StripTierForLocal(key);
    }

    public string CreateSignedReadUrl(string objectKey, TimeSpan? ttl = null)
        => GetPublicUrl(objectKey);

    public string ToObjectKey(string legacyWebPath, FileAccessTier? preferredTier = null)
        => FileStorageKeyHelper.LegacyWebPathToObjectKey(legacyWebPath, preferredTier);

    private string? ResolvePhysical(string objectKey)
    {
        var key = objectKey.Replace('\\', '/').Trim().TrimStart('/');
        // Try with and without tier prefix under wwwroot
        var candidates = new List<string>
        {
            Path.Combine(WwwRoot, StripTierForLocal(key).Replace('/', Path.DirectorySeparatorChar)),
            Path.Combine(WwwRoot, key.Replace('/', Path.DirectorySeparatorChar)),
        };
        if (key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            candidates.Add(Path.Combine(WwwRoot, key["public/".Length..].Replace('/', Path.DirectorySeparatorChar)));

        foreach (var c in candidates)
        {
            var full = Path.GetFullPath(c);
            if (!full.StartsWith(WwwRoot, StringComparison.OrdinalIgnoreCase)) continue;
            if (File.Exists(full)) return full;
        }
        return candidates.Select(Path.GetFullPath).FirstOrDefault(f => f.StartsWith(WwwRoot, StringComparison.OrdinalIgnoreCase));
    }

    private static string StripTierForLocal(string key)
    {
        var k = key.Replace('\\', '/').Trim().TrimStart('/');
        foreach (var tier in new[] { "public/", "private/", "drm/" })
        {
            if (k.StartsWith(tier, StringComparison.OrdinalIgnoreCase))
                return k[tier.Length..];
        }
        return k;
    }
}

public sealed class MsgHttpFileStorage : IFileStorage
{
    private readonly HttpClient _http;
    private readonly FileStorageOptions _options;

    public MsgHttpFileStorage(HttpClient http, IOptions<FileStorageOptions> options)
    {
        _http = http;
        _options = options.Value;
        if (_http.BaseAddress is null && !string.IsNullOrWhiteSpace(_options.AgentBaseUrl))
            _http.BaseAddress = new Uri(_options.AgentBaseUrl.TrimEnd('/') + "/");
    }

    public async Task<StoredObjectResult> PutAsync(
        string objectKey,
        Stream content,
        string contentType,
        FileAccessTier tier,
        CancellationToken cancellationToken = default)
    {
        var key = FileStorageKeyHelper.EnsureTierPrefix(objectKey, tier);
        using var request = new HttpRequestMessage(HttpMethod.Put, $"v1/objects/{key}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.AgentToken);
        request.Headers.TryAddWithoutValidation("X-Content-Type", contentType);
        request.Headers.TryAddWithoutValidation("X-Access-Tier", tier.ToString().ToLowerInvariant());
        request.Content = new StreamContent(content);
        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

        using var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();
        var size = response.Content.Headers.ContentLength ?? 0;
        try
        {
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            // best-effort parse size from body
            var sizeIdx = json.IndexOf("\"size\"", StringComparison.OrdinalIgnoreCase);
            if (sizeIdx >= 0)
            {
                var colon = json.IndexOf(':', sizeIdx);
                var end = json.IndexOfAny([',', '}'], colon + 1);
                if (colon > 0 && end > colon && long.TryParse(json[(colon + 1)..end].Trim(), out var parsed))
                    size = parsed;
            }
        }
        catch { /* ignore */ }

        return new StoredObjectResult(key, GetPublicUrl(key), size, contentType);
    }

    public async Task<Stream?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(objectKey);
        var request = new HttpRequestMessage(HttpMethod.Get, BuildReadPath(key));
        if (!key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.AgentToken);

        var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            response.Dispose();
            return null;
        }

        if (!response.IsSuccessStatusCode)
        {
            response.Dispose();
            response.EnsureSuccessStatusCode();
        }

        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return new HttpResponseMessageStream(response, stream);
    }

    public async Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(objectKey);
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Head, BuildReadPath(key));
            if (!key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.AgentToken);
            using var response = await _http.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(objectKey);
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"v1/objects/{key}");
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.AgentToken);
        using var response = await _http.SendAsync(request, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return;
        response.EnsureSuccessStatusCode();
    }

    public string GetPublicUrl(string objectKey)
    {
        var key = NormalizeKey(objectKey);
        var baseUrl = _options.PublicBaseUrl.TrimEnd('/');
        if (key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            return $"{baseUrl}/{key}";
        return CreateSignedReadUrl(key);
    }

    public string CreateSignedReadUrl(string objectKey, TimeSpan? ttl = null)
    {
        var key = NormalizeKey(objectKey);
        var span = ttl ?? TimeSpan.FromSeconds(Math.Max(60, _options.SignedUrlTtlSeconds));
        return FileStorageKeyHelper.BuildSignedUrl(_options.AgentBaseUrl, key, _options.SigningKey, span);
    }

    public string ToObjectKey(string legacyWebPath, FileAccessTier? preferredTier = null)
        => FileStorageKeyHelper.LegacyWebPathToObjectKey(legacyWebPath, preferredTier);

    private static string NormalizeKey(string objectKey)
        => objectKey.Replace('\\', '/').Trim().TrimStart('/');

    private string BuildReadPath(string key)
    {
        if (key.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
            return key; // /public/...
        return $"v1/objects/{key}";
    }
}

/// <summary>Writes to Msg; reads Msg first then local wwwroot fallback.</summary>
public sealed class CompositeFileStorage(IFileStorage primary, IFileStorage fallback) : IFileStorage
{
    public Task<StoredObjectResult> PutAsync(
        string objectKey,
        Stream content,
        string contentType,
        FileAccessTier tier,
        CancellationToken cancellationToken = default)
        => primary.PutAsync(objectKey, content, contentType, tier, cancellationToken);

    public async Task<Stream?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default)
        => await primary.OpenReadAsync(objectKey, cancellationToken)
           ?? await fallback.OpenReadAsync(objectKey, cancellationToken);

    public async Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken = default)
        => await primary.ExistsAsync(objectKey, cancellationToken)
           || await fallback.ExistsAsync(objectKey, cancellationToken);

    public async Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        await primary.DeleteAsync(objectKey, cancellationToken);
        try { await fallback.DeleteAsync(objectKey, cancellationToken); } catch { /* ignore */ }
    }

    public string GetPublicUrl(string objectKey) => primary.GetPublicUrl(objectKey);

    public string CreateSignedReadUrl(string objectKey, TimeSpan? ttl = null)
        => primary.CreateSignedReadUrl(objectKey, ttl);

    public string ToObjectKey(string legacyWebPath, FileAccessTier? preferredTier = null)
        => primary.ToObjectKey(legacyWebPath, preferredTier);
}
