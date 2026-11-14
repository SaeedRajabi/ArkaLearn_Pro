using System.IO;

namespace ArkaLearnDesktop.Infrastructure.Drm;

/// <summary>
/// Downloads/reads encrypted media, decrypts AES-CBC progressively, and feeds a RAM loopback server.
/// </summary>
internal sealed class StreamingPlaybackSession : IDisposable
{
    public const int DefaultStartBytes = 768 * 1024;

    private readonly ProgressiveClearBuffer _buffer = new(2 * 1024 * 1024);
    private readonly CancellationTokenSource _sessionCts = new();
    private readonly object _gate = new();
    private Task? _pipelineTask;
    private RamLoopbackMediaServer? _server;
    private Uri? _uri;
    private bool _disposed;

    public long MediaAssetId { get; set; }

    public Uri? PlaybackUri
    {
        get { lock (_gate) return _uri; }
    }

    public event Action<bool>? BufferingChanged;
    public event Action<double>? ProgressChanged;
    public event Action<Exception>? Failed;

    public async Task<Uri> StartAsync(
        Stream encryptedStream,
        long? encryptedContentLength,
        string encryptionAlgorithm,
        string ivBase64,
        string wrappedContentKeyBase64,
        string grantToken,
        string mimeType,
        Stream? encryptedCacheWriteStream,
        IAsyncDisposable? streamOwnership,
        int startBytes = DefaultStartBytes,
        CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);

        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _sessionCts.Token);
        var token = linked.Token;

        var contentKey = AesCbcCryptography.UnwrapContentKey(wrappedContentKeyBase64, grantToken);
        var iv = Convert.FromBase64String(ivBase64);
        var useArka = string.Equals(encryptionAlgorithm, ArkaContainerReader.Algorithm, StringComparison.OrdinalIgnoreCase);

        if (encryptedContentLength is > 0 && !useArka)
            _buffer.SetEstimatedLength(encryptedContentLength.Value);

        var readyTcs = new TaskCompletionSource<Uri>(TaskCreationOptions.RunContinuationsAsynchronously);

        _pipelineTask = Task.Run(async () =>
        {
            AesCbcStreamingDecryptor? decryptor = null;
            ArkaContainerIncrementalReader? arka = null;
            var readBuffer = new byte[256 * 1024];
            try
            {
                decryptor = new AesCbcStreamingDecryptor(contentKey, iv);
                Array.Clear(contentKey, 0, contentKey.Length);

                arka = useArka ? new ArkaContainerIncrementalReader() : null;
                long encryptedRead = 0;
                var started = false;
                string? effectiveMime = string.IsNullOrWhiteSpace(mimeType) ? null : mimeType;

                while (true)
                {
                    token.ThrowIfCancellationRequested();
                    var read = await encryptedStream.ReadAsync(readBuffer.AsMemory(0, readBuffer.Length), token)
                        .ConfigureAwait(false);
                    if (read <= 0)
                        break;

                    if (encryptedCacheWriteStream is not null)
                        await encryptedCacheWriteStream.WriteAsync(readBuffer.AsMemory(0, read), token)
                            .ConfigureAwait(false);

                    encryptedRead += read;
                    ReportProgress(encryptedContentLength, encryptedRead);

                    // Auto-detect Arka container from magic if algorithm metadata is wrong/missing.
                    if (arka is null && encryptedRead == read && read >= 4 &&
                        readBuffer.AsSpan(0, 4).SequenceEqual(ArkaContainerReader.Magic))
                    {
                        arka = new ArkaContainerIncrementalReader();
                    }

                    ReadOnlySpan<byte> cipherSpan;
                    if (arka is not null)
                    {
                        var cipher = arka.Feed(readBuffer.AsSpan(0, read), out _);
                        if (arka.HeaderParsed)
                        {
                            _buffer.SetEstimatedLength((long)arka.CipherLength);
                            effectiveMime ??= arka.ContentType;
                        }

                        if (cipher.Length == 0)
                        {
                            MaybeStart(ref started, effectiveMime, startBytes, readyTcs);
                            continue;
                        }

                        cipherSpan = cipher;
                    }
                    else
                    {
                        cipherSpan = readBuffer.AsSpan(0, read);
                    }

                    decryptor.TransformTo(cipherSpan, _buffer);
                    MaybeStart(ref started, effectiveMime, startBytes, readyTcs);
                }

                if (arka is not null)
                {
                    if (!arka.IsCipherComplete)
                        throw new InvalidDataException("دانلود فایل رمزنگاری‌شده ناقص بود.");
                    arka.EnsureHashValid();
                }

                decryptor.Finish(_buffer);

                if (encryptedCacheWriteStream is CacheFinalizeStream cacheFinalize)
                    cacheFinalize.MarkSuccess();

                if (encryptedCacheWriteStream is not null)
                    await encryptedCacheWriteStream.FlushAsync(token).ConfigureAwait(false);

                ProgressChanged?.Invoke(100);

                if (!started)
                    StartServer(effectiveMime ?? "video/mp4", readyTcs);
            }
            catch (OperationCanceledException)
            {
                _buffer.Fail(new OperationCanceledException("پخش لغو شد."));
                readyTcs.TrySetCanceled(token);
            }
            catch (Exception ex)
            {
                _buffer.Fail(ex);
                Failed?.Invoke(ex);
                readyTcs.TrySetException(ex);
            }
            finally
            {
                decryptor?.Dispose();
                arka?.Dispose();
                Array.Clear(readBuffer, 0, readBuffer.Length);
                try
                {
                    if (streamOwnership is not null)
                        await streamOwnership.DisposeAsync().ConfigureAwait(false);
                    else
                        await encryptedStream.DisposeAsync().ConfigureAwait(false);
                }
                catch { /* ignore */ }

                try
                {
                    if (encryptedCacheWriteStream is not null)
                        await encryptedCacheWriteStream.DisposeAsync().ConfigureAwait(false);
                }
                catch { /* ignore */ }
            }
        }, CancellationToken.None);

        try
        {
            return await readyTcs.Task.WaitAsync(token).ConfigureAwait(false);
        }
        catch
        {
            Dispose();
            throw;
        }
    }

    private void MaybeStart(ref bool started, string? effectiveMime, int startBytes, TaskCompletionSource<Uri> readyTcs)
    {
        if (started) return;
        if (_buffer.AvailableLength < startBytes) return;
        started = true;
        StartServer(effectiveMime ?? "video/mp4", readyTcs);
    }

    private void StartServer(string contentType, TaskCompletionSource<Uri> readyTcs)
    {
        lock (_gate)
        {
            if (_uri is not null)
            {
                readyTcs.TrySetResult(_uri);
                return;
            }

            var uri = RamLoopbackMediaServer.Start(_buffer, contentType, out var server);
            _server = server;
            _uri = uri;
            server.BufferingChanged += waiting => BufferingChanged?.Invoke(waiting);
            readyTcs.TrySetResult(uri);
        }
    }

    private void ReportProgress(long? totalEncrypted, long encryptedRead)
    {
        if (totalEncrypted is null or <= 0)
        {
            ProgressChanged?.Invoke(-1);
            return;
        }

        var percent = Math.Clamp(encryptedRead * 100d / totalEncrypted.Value, 0, 99.5);
        ProgressChanged?.Invoke(percent);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        try { _sessionCts.Cancel(); } catch { /* ignore */ }

        Uri? uri;
        lock (_gate)
        {
            uri = _uri;
            _uri = null;
            _server = null;
        }

        if (uri is not null)
            RamLoopbackMediaServer.Stop(uri);
        else
            _buffer.Dispose();

        _sessionCts.Dispose();
        BufferingChanged?.Invoke(false);
    }
}
