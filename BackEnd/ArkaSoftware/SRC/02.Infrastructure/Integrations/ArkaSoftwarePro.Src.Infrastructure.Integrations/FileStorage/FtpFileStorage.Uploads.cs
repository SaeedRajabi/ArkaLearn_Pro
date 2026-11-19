using System.Globalization;
using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using FluentFTP;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;

public sealed partial class FtpFileStorage
{
    private static string UploadKey(string scope, string uploadId)
    {
        if (scope is not ("users" or "rooms") || !Guid.TryParseExact(uploadId, "N", out _))
            throw new ArgumentException("Invalid upload identifier.");
        return $"private/{scope}/upload-chunks/{uploadId}";
    }

    private static string PartName(int index) => $"{index:D8}.part";

    public async Task InitializeUploadAsync(string scope, string uploadId, CancellationToken cancellationToken = default)
    {
        var directory = ToRemotePath(UploadKey(scope, uploadId));
        await using var client = await ConnectAsync(cancellationToken);
        await client.CreateDirectory(directory, true, cancellationToken);
        await TouchUploadAsync(client, directory, cancellationToken);
    }

    private static async Task TouchUploadAsync(AsyncFtpClient client, string directory, CancellationToken token)
    {
        await using var marker = new MemoryStream(Encoding.UTF8.GetBytes(DateTime.UtcNow.ToString("O", CultureInfo.InvariantCulture)));
        if (await client.UploadStream(marker, directory + "/activity.utc", FtpRemoteExists.Overwrite, token: token) != FtpStatus.Success)
            throw new IOException("Could not update download-host upload activity.");
    }

    public async Task PutChunkAsync(string scope, string uploadId, int index, Stream content, long expectedSize, int chunkSize, long fileSize,
        CancellationToken cancellationToken = default)
    {
        if (index < 0 || expectedSize <= 0 || chunkSize <= 0 || fileSize <= 0 ||
            (long)index * chunkSize >= fileSize || expectedSize != Math.Min(chunkSize, fileSize - (long)index * chunkSize))
            throw new ArgumentOutOfRangeException(nameof(index));
        var directory = ToRemotePath(UploadKey(scope, uploadId));
        var target = directory + "/" + PartName(index);
        var temporary = target + "." + Guid.NewGuid().ToString("N") + ".uploading";
        await using var client = await ConnectAsync(cancellationToken);
        try
        {
            await client.CreateDirectory(directory, true, cancellationToken);
            // A retry can replace an already incorporated part. Invalidate the cached
            // assembly before changing that part so it can never contain stale bytes.
            var assembled = directory + "/assembled.uploading";
            var assembledSize = await client.GetFileSize(assembled, -1, cancellationToken);
            if (assembledSize > (long)index * chunkSize)
            {
                await ClearAssemblyCheckpointAsync(client, directory, cancellationToken);
                await client.DeleteFile(assembled, cancellationToken);
            }
            var status = await client.UploadStream(content, temporary, FtpRemoteExists.Overwrite, token: cancellationToken);
            if (status != FtpStatus.Success || await client.GetFileSize(temporary, -1, cancellationToken) != expectedSize)
                throw new IOException("The download-host chunk did not pass size verification.");
            if (!await client.MoveFile(temporary, target, FtpRemoteExists.Overwrite, cancellationToken))
                throw new IOException("Could not finalize the download-host chunk.");
            await TouchUploadAsync(client, directory, cancellationToken);
            try
            {
                await AppendAvailableChunksAsync(client, directory, chunkSize, fileSize, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                // Parts remain authoritative. A later chunk or completion can rebuild.
                logger.LogWarning(ex, "Could not incrementally assemble upload {UploadId}", uploadId);
                try
                {
                    await ClearAssemblyCheckpointAsync(client, directory, CancellationToken.None);
                    await client.DeleteFile(assembled, CancellationToken.None);
                }
                catch { }
            }
        }
        catch
        {
            try { if (await client.FileExists(temporary, CancellationToken.None)) await client.DeleteFile(temporary, CancellationToken.None); }
            catch { }
            throw;
        }
    }

    // Called under the upload session gate. Keep individual parts until finalization
    // so interrupted transfers and out-of-order arrivals can always be recovered.
    private async Task AppendAvailableChunksAsync(AsyncFtpClient writer, string directory, int chunkSize,
        long fileSize, CancellationToken token)
    {
        var path = directory + "/assembled.uploading";
        var size = Math.Max(0, await writer.GetFileSize(path, -1, token));
        var committed = await ReadAssemblyCheckpointAsync(writer, directory, token);
        if (size != committed || size > fileSize || (size != fileSize && size % chunkSize != 0))
        {
            await ClearAssemblyCheckpointAsync(writer, directory, token);
            if (size > 0) await writer.DeleteFile(path, token);
            size = 0;
        }
        if (size == fileSize) return;

        var listing = await writer.GetListing(directory, FtpListOption.Size, token);
        var parts = listing.Where(item => item.Type == FtpObjectType.File)
            .ToDictionary(item => item.Name, item => item.Size, StringComparer.Ordinal);
        var index = (int)(size / chunkSize);
        await using var reader = await ConnectAsync(token);
        while (size < fileSize && parts.TryGetValue(PartName(index), out var partSize)
               && partSize == Math.Min(chunkSize, fileSize - size))
        {
            await using (var input = await reader.OpenRead(directory + "/" + PartName(index), token: token))
            await using (var output = size == 0
                ? await writer.OpenWrite(path, token: token)
                : await writer.OpenAppend(path, token: token))
            {
                var buffer = new byte[64 * 1024];
                long copied = 0;
                int read;
                while ((read = await input.ReadAsync(buffer, token)) != 0)
                {
                    copied += read;
                    if (copied > partSize) throw new IOException("Remote chunk exceeds its declared size.");
                    await output.WriteAsync(buffer.AsMemory(0, read), token);
                }
                if (copied != partSize) throw new IOException("Remote chunk is truncated.");
            }
            var readReply = await reader.GetReply(token);
            var writeReply = await writer.GetReply(token);
            if (!readReply.Success || !writeReply.Success)
                throw new IOException("Download host did not confirm the chunk transfer.");
            size += partSize;
            if (await writer.GetFileSize(path, -1, token) != size)
                throw new IOException("Incremental assembly did not pass size verification.");
            await using var checkpoint = new MemoryStream(Encoding.ASCII.GetBytes(size.ToString(CultureInfo.InvariantCulture)));
            if (await writer.UploadStream(checkpoint, directory + "/assembly.size", FtpRemoteExists.Overwrite, token: token) != FtpStatus.Success)
                throw new IOException("Could not commit incremental assembly checkpoint.");
            index++;
        }
    }

    private static async Task ClearAssemblyCheckpointAsync(AsyncFtpClient client, string directory, CancellationToken token)
    {
        var path = directory + "/assembly.size";
        if (await client.FileExists(path, token)) await client.DeleteFile(path, token);
    }

    private static async Task<long> ReadAssemblyCheckpointAsync(AsyncFtpClient client, string directory, CancellationToken token)
    {
        var path = directory + "/assembly.size";
        var length = await client.GetFileSize(path, -1, token);
        if (length is <= 0 or > 20) return 0;
        using var content = new MemoryStream();
        if (!await client.DownloadStream(content, path, token: token, stopPosition: 20)) return 0;
        return long.TryParse(Encoding.ASCII.GetString(content.ToArray()), NumberStyles.None,
            CultureInfo.InvariantCulture, out var size) && size > 0 ? size : 0;
    }

    internal static int[] FindMissingChunks(IReadOnlyDictionary<string, long> parts, int count, int chunkSize, long fileSize)
        => Enumerable.Range(0, count).Where(index =>
            !parts.TryGetValue(PartName(index), out var actual) || actual != Math.Min(chunkSize, fileSize - (long)index * chunkSize)).ToArray();

    public async Task<int[]> GetMissingChunksAsync(string scope, string uploadId, int count, int chunkSize, long fileSize,
        CancellationToken cancellationToken = default)
    {
        var directory = ToRemotePath(UploadKey(scope, uploadId));
        await using var client = await ConnectAsync(cancellationToken);
        if (!await client.DirectoryExists(directory, cancellationToken)) return Enumerable.Range(0, count).ToArray();
        var listing = await client.GetListing(directory, FtpListOption.Size, cancellationToken);
        var parts = listing.Where(item => item.Type == FtpObjectType.File)
            .ToDictionary(item => item.Name, item => item.Size, StringComparer.Ordinal);
        return FindMissingChunks(parts, count, chunkSize, fileSize);
    }

    public async Task AssembleUploadAsync(string scope, string uploadId, string objectKey, int count, int chunkSize,
        long fileSize, CancellationToken cancellationToken = default)
    {
        if ((await GetMissingChunksAsync(scope, uploadId, count, chunkSize, fileSize, cancellationToken)).Length > 0)
            throw new IOException("Upload is incomplete or a chunk size is invalid.");
        var directory = ToRemotePath(UploadKey(scope, uploadId));
        var temporary = directory + "/assembled.uploading";
        var target = ToRemotePath(FileStorageKeyHelper.EnsureTierPrefix(objectKey, FileAccessTier.Private));
        await using var reader = await ConnectAsync(cancellationToken);
        await using var writer = await ConnectAsync(cancellationToken);
        await writer.CreateDirectory(target[..target.LastIndexOf('/')], true, cancellationToken);
        await TouchUploadAsync(reader, directory, cancellationToken);
        // Most uploads are already assembled as chunks arrive; completion then only
        // needs a verified server-side rename.
        if (await writer.GetFileSize(temporary, -1, cancellationToken) == fileSize &&
            await ReadAssemblyCheckpointAsync(writer, directory, cancellationToken) == fileSize)
        {
            if (!await writer.MoveFile(temporary, target, FtpRemoteExists.Overwrite, cancellationToken))
                throw new IOException("Could not finalize the download-host file.");
            return;
        }
        await ClearAssemblyCheckpointAsync(writer, directory, cancellationToken);
        long copied = 0;
        try
        {
            await using (var output = await writer.OpenWrite(temporary, token: cancellationToken))
            {
                var buffer = new byte[64 * 1024];
                for (var index = 0; index < count; index++)
                {
                    await using (var input = await reader.OpenRead(directory + "/" + PartName(index), token: cancellationToken))
                    {
                        int read;
                        long partSize = 0;
                        while ((read = await input.ReadAsync(buffer, cancellationToken)) != 0)
                        {
                            partSize += read;
                            if (partSize > Math.Min(chunkSize, fileSize - (long)index * chunkSize))
                                throw new IOException("Remote chunk exceeds its declared size.");
                            await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                            copied += read;
                        }
                        if (partSize != Math.Min(chunkSize, fileSize - (long)index * chunkSize))
                            throw new IOException("Remote chunk is truncated.");
                    }
                    var readReply = await reader.GetReply(cancellationToken);
                    if (!readReply.Success) throw new IOException("Download host did not confirm the chunk read.");
                }
            }
            var reply = await writer.GetReply(cancellationToken);
            if (!reply.Success || copied != fileSize || await writer.GetFileSize(temporary, -1, cancellationToken) != fileSize)
                throw new IOException("Download-host assembled file did not pass size verification.");
            if (!await writer.MoveFile(temporary, target, FtpRemoteExists.Overwrite, cancellationToken))
                throw new IOException("Could not finalize the download-host file.");
        }
        catch
        {
            throw;
        }
    }

    public async Task DeleteUploadAsync(string scope, string uploadId, CancellationToken cancellationToken = default)
    {
        var directory = ToRemotePath(UploadKey(scope, uploadId));
        await using var client = await ConnectAsync(cancellationToken);
        if (await client.DirectoryExists(directory, cancellationToken))
            await client.DeleteDirectory(directory, cancellationToken);
        if (await client.DirectoryExists(directory, cancellationToken))
            throw new IOException("Download host did not remove the upload directory.");
    }

    public async Task CleanupExpiredUploadsAsync(TimeSpan maxAge, CancellationToken cancellationToken = default)
    {
        await using var client = await ConnectAsync(cancellationToken);
        foreach (var scope in new[] { "users", "rooms" })
        {
            var root = ToRemotePath($"private/{scope}/upload-chunks");
            if (!await client.DirectoryExists(root, cancellationToken)) continue;
            foreach (var directory in await client.GetListing(root, cancellationToken))
            {
                if (directory.Type != FtpObjectType.Directory || !Guid.TryParseExact(directory.Name, "N", out _)) continue;
                var markerPath = directory.FullName + "/activity.utc";
                var markerSize = await client.GetFileSize(markerPath, -1, cancellationToken);
                if (markerSize is <= 0 or > 128) continue;
                using var marker = new MemoryStream();
                if (!await client.DownloadStream(marker, markerPath, token: cancellationToken, stopPosition: 128)) continue;
                if (IsExpiredMarker(Encoding.UTF8.GetString(marker.ToArray()), DateTimeOffset.UtcNow - maxAge))
                    await client.DeleteDirectory(directory.FullName, cancellationToken);
            }
        }
    }

    internal static bool IsExpiredMarker(string marker, DateTimeOffset cutoff)
        => DateTimeOffset.TryParse(marker, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var activity)
            && activity < cutoff;

    public async Task<DownloadStorageUsage> GetUsageAsync(CancellationToken cancellationToken = default)
    {
        if (_options.DownloadHostCapacityBytes <= 0) throw new InvalidOperationException("Download-host capacity is not configured.");
        await using var client = await ConnectAsync(cancellationToken);
        var root = string.IsNullOrWhiteSpace(_options.FtpUsageRoot) ? "/" : _options.FtpUsageRoot;
        var listing = await client.GetListing(root, FtpListOption.Recursive | FtpListOption.Size, cancellationToken);
        long used = 0;
        foreach (var item in listing.Where(item => item.Type == FtpObjectType.File))
        {
            if (item.Size < 0) throw new IOException("Download host returned an unknown file size.");
            used = checked(used + item.Size);
        }
        return new DownloadStorageUsage(_options.DownloadHostCapacityBytes, used, DateTime.UtcNow);
    }
}

/// <summary>Closes both the remote data stream and its dedicated control connection.</summary>
internal sealed class OwnedFtpReadStream(Stream inner, AsyncFtpClient client) : Stream
{
    public override bool CanRead => inner.CanRead;
    public override bool CanSeek => false;
    public override bool CanWrite => false;
    public override long Length => inner.Length;
    public override long Position { get => inner.Position; set => throw new NotSupportedException(); }
    public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);
    public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        => inner.ReadAsync(buffer, cancellationToken);
    public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        => inner.ReadAsync(buffer, offset, count, cancellationToken);
    public override void Flush() => throw new NotSupportedException();
    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    protected override void Dispose(bool disposing)
    {
        if (disposing) { try { inner.Dispose(); } finally { client.Dispose(); } }
        base.Dispose(disposing);
    }
    public override async ValueTask DisposeAsync()
    {
        try { await inner.DisposeAsync(); } finally { await client.DisposeAsync(); }
        GC.SuppressFinalize(this);
    }
}
