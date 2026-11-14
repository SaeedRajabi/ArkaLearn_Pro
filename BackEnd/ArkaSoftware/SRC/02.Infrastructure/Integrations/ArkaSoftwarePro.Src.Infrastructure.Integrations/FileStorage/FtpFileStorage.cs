using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using FluentFTP;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;

/// <summary>
/// Stores objects on the download host via FTP. Public files are served by IIS static hosting
/// at https://msg.../public/... — no Agent required. Private/DRM are not browsable statically.
/// </summary>
public sealed partial class FtpFileStorage(
    IOptions<FileStorageOptions> options,
    ILogger<FtpFileStorage> logger) : IRemoteUploadStorage
{
    private readonly FileStorageOptions _options = options.Value;

    public async Task<StoredObjectResult> PutAsync(
        string objectKey,
        Stream content,
        string contentType,
        FileAccessTier tier,
        CancellationToken cancellationToken = default)
    {
        var key = FileStorageKeyHelper.EnsureTierPrefix(objectKey, tier);
        var remotePath = ToRemotePath(key);

        await using var client = await ConnectAsync(cancellationToken);

        var dir = remotePath.Contains('/') ? remotePath[..remotePath.LastIndexOf('/')] : "/";
        if (!string.IsNullOrWhiteSpace(dir) && dir != "/")
            await client.CreateDirectory(dir, true, cancellationToken);

        // FluentFTP may need a seekable stream for size; rewind if possible.
        if (content.CanSeek)
            content.Position = 0;

        var status = await client.UploadStream(content, remotePath, FtpRemoteExists.Overwrite, true, token: cancellationToken);
        if (status is not FtpStatus.Success)
            throw new InvalidOperationException($"FTP upload failed for '{remotePath}' with status {status}.");

        if (!await client.FileExists(remotePath, cancellationToken))
            throw new InvalidOperationException($"FTP upload reported success but file is missing at '{remotePath}'.");

        long size = 0;
        try
        {
            size = await client.GetFileSize(remotePath, -1, cancellationToken);
        }
        catch
        {
            // optional
        }

        logger.LogInformation(
            "FTP stored object Key={ObjectKey} RemotePath={RemotePath} Size={Size} Tier={Tier}",
            key, remotePath, size, tier);

        return new StoredObjectResult(key, GetPublicUrl(key), size, contentType);
    }

    public async Task<Stream?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(objectKey);
        var remotePath = ToRemotePath(key);

        await using var client = await ConnectAsync(cancellationToken);
        if (!await client.FileExists(remotePath, cancellationToken))
            return null;

        var length = await client.GetFileSize(remotePath, -1, cancellationToken);
        if (length < 0) throw new IOException("Could not determine remote file size.");
        return new RemoteRangeReadStream(length, async (offset, token) =>
        {
            var readClient = await ConnectAsync(token);
            try
            {
                var stream = await readClient.OpenRead(remotePath, restart: offset, token: token);
                return new OwnedFtpReadStream(stream, readClient);
            }
            catch { await readClient.DisposeAsync(); throw; }
        });
    }

    public async Task<bool> ExistsAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(objectKey);
        var remotePath = ToRemotePath(key);
        try
        {
            await using var client = await ConnectAsync(cancellationToken);
            return await client.FileExists(remotePath, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "FTP Exists check failed for {RemotePath}", remotePath);
            return false;
        }
    }

    public async Task DeleteAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(objectKey);
        var remotePath = ToRemotePath(key);
        await using var client = await ConnectAsync(cancellationToken);
        if (await client.FileExists(remotePath, cancellationToken))
            await client.DeleteFile(remotePath, cancellationToken);
        if (await client.FileExists(remotePath, cancellationToken))
            throw new IOException("Download host did not remove the file.");
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
        var exp = DateTimeOffset.UtcNow.Add(span).ToUnixTimeSeconds();
        var sig = FileStorageKeyHelper.CreateHmacSignature(key, exp, _options.SigningKey);
        var apiBase = (_options.SignedReadBaseUrl ?? string.Empty).TrimEnd('/');
        if (string.IsNullOrWhiteSpace(apiBase))
            apiBase = "https://api.arkasoftware.ir";
        return $"{apiBase}/api/Service/FileStorage/SignedRead?key={Uri.EscapeDataString(key)}&exp={exp}&sig={sig}";
    }

    public string ToObjectKey(string legacyWebPath, FileAccessTier? preferredTier = null)
        => FileStorageKeyHelper.LegacyWebPathToObjectKey(legacyWebPath, preferredTier);

    private async Task<AsyncFtpClient> ConnectAsync(CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.FtpHost))
            throw new InvalidOperationException("FileStorage:FtpHost is not configured.");
        if (string.IsNullOrWhiteSpace(_options.FtpUsername))
            throw new InvalidOperationException("FileStorage:FtpUsername is not configured.");

        // Prefer IP when msg DNS has multiple A records (main host + download host).
        var preferTls = _options.FtpUseTls;
        Exception? firstError = null;

        // Try configured mode first; only fall back once if connect/auth fails.
        foreach (var useTls in preferTls ? new[] { true, false } : new[] { false })
        {
            var client = CreateClient(useTls);
            try
            {
                await client.Connect(cancellationToken);
                if (useTls != preferTls)
                {
                    logger.LogWarning(
                        "FTP connected with UseTls={UseTls} (configured FtpUseTls={Configured}). Host={Host}",
                        useTls, preferTls, _options.FtpHost);
                }

                logger.LogInformation(
                    "FTP connected Host={Host} UseTls={UseTls} PWD={Pwd} RemoteRoot={Root}",
                    _options.FtpHost, useTls, await client.GetWorkingDirectory(cancellationToken), _options.FtpRemoteRoot);
                return client;
            }
            catch (Exception ex)
            {
                firstError ??= ex;
                logger.LogWarning(ex, "FTP connect failed Host={Host} UseTls={UseTls}", _options.FtpHost, useTls);
                try { await client.DisposeAsync(); } catch { /* ignore */ }
            }
        }

        throw new InvalidOperationException(
            $"FTP connect failed for host '{_options.FtpHost}'. Prefer download-host IP (not msg DNS) and valid FTP credentials. Inner: {firstError?.Message}",
            firstError);
    }

    private AsyncFtpClient CreateClient(bool useTls)
    {
        var client = new AsyncFtpClient(
            _options.FtpHost.Trim(),
            _options.FtpUsername.Trim(),
            _options.FtpPassword ?? string.Empty,
            _options.FtpPort <= 0 ? 21 : _options.FtpPort);

        client.Config.EncryptionMode = useTls
            ? FtpEncryptionMode.Explicit
            : FtpEncryptionMode.None;
        client.Config.ValidateAnyCertificate = true;
        client.Config.DataConnectionType = FtpDataConnectionType.AutoPassive;
        return client;
    }

    private string ToRemotePath(string objectKey)
    {
        var key = NormalizeKey(objectKey);
        var root = (_options.FtpRemoteRoot ?? string.Empty).Replace('\\', '/').Trim();
        if (root is "/" or ".")
            root = string.Empty;
        root = root.Trim('/');
        return string.IsNullOrEmpty(root) ? "/" + key : "/" + root + "/" + key;
    }

    private static string NormalizeKey(string objectKey)
        => objectKey.Replace('\\', '/').Trim().TrimStart('/');
}
