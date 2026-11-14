using System.Net;
using System.Net.Sockets;
using System.Collections.Concurrent;

namespace ArkaLearnDesktop.Infrastructure.Drm;

/// <summary>
/// Serves progressively decrypted media from RAM via loopback HTTP.
/// Range requests wait until the requested plaintext bytes are available.
/// </summary>
internal sealed class RamLoopbackMediaServer : IDisposable
{
    private static readonly ConcurrentDictionary<string, RamLoopbackMediaServer> Active = new();

    private readonly HttpListener _listener;
    private readonly ProgressiveClearBuffer _buffer;
    private readonly string _contentType;
    private readonly CancellationTokenSource _cts = new();
    private readonly Task _loop;
    private int _bufferingNotifyGate;

    private RamLoopbackMediaServer(ProgressiveClearBuffer buffer, string contentType)
    {
        _buffer = buffer;
        _contentType = contentType;
        _buffer.WaitingForDataChanged += OnWaitingForDataChanged;

        var prefix = $"http://127.0.0.1:{GetFreePort()}/";
        PlaybackUri = new Uri(prefix + "media");
        _listener = new HttpListener();
        _listener.Prefixes.Add(prefix);
        _listener.Start();
        Active[PlaybackUri.ToString()] = this;
        _loop = Task.Run(ListenLoopAsync);
    }

    public Uri PlaybackUri { get; }

    public event Action<bool>? BufferingChanged;

    public static Uri Start(ProgressiveClearBuffer buffer, string contentType, out RamLoopbackMediaServer server)
    {
        server = new RamLoopbackMediaServer(buffer, contentType);
        return server.PlaybackUri;
    }

    public static Uri Start(byte[] payload, string contentType)
    {
        var buffer = new ProgressiveClearBuffer(payload.Length);
        buffer.Append(payload);
        buffer.Complete(payload.Length);
        return Start(buffer, contentType, out _);
    }

    public static void Stop(Uri? uri)
    {
        if (uri is null) return;
        if (Active.TryRemove(uri.ToString(), out var server))
            server.Dispose();
    }

    public static RamLoopbackMediaServer? TryGet(Uri? uri)
    {
        if (uri is null) return null;
        return Active.TryGetValue(uri.ToString(), out var server) ? server : null;
    }

    private async Task ListenLoopAsync()
    {
        while (!_cts.IsCancellationRequested)
        {
            HttpListenerContext? ctx = null;
            try
            {
                ctx = await _listener.GetContextAsync().WaitAsync(_cts.Token).ConfigureAwait(false);
                _ = Task.Run(() => HandleRequestAsync(ctx), _cts.Token);
            }
            catch when (_cts.IsCancellationRequested)
            {
                break;
            }
            catch
            {
                try { ctx?.Response.Close(); } catch { /* ignore */ }
            }
        }
    }

    private async Task HandleRequestAsync(HttpListenerContext ctx)
    {
        try
        {
            var req = ctx.Request;
            var res = ctx.Response;
            res.ContentType = _contentType;
            res.AddHeader("Accept-Ranges", "bytes");
            res.AddHeader("Cache-Control", "no-store");

            var advertised = Math.Max(1, _buffer.AdvertisedLength);
            var from = 0L;
            var to = advertised - 1;
            var isRange = false;
            var range = req.Headers["Range"];
            if (!string.IsNullOrWhiteSpace(range) && range.StartsWith("bytes=", StringComparison.OrdinalIgnoreCase))
            {
                isRange = true;
                var parts = range["bytes=".Length..].Split('-', 2);
                if (long.TryParse(parts[0], out var start)) from = Math.Max(0, start);
                if (parts.Length > 1 && long.TryParse(parts[1], out var end) && end >= from)
                    to = end;
            }

            // Wait until the first requested byte is available (or stream completes).
            await _buffer.WaitUntilAvailableAsync(from + 1, _cts.Token).ConfigureAwait(false);

            advertised = Math.Max(1, _buffer.AdvertisedLength);
            if (_buffer.IsCompleted)
                advertised = Math.Max(1, _buffer.AvailableLength);

            if (from >= advertised)
            {
                res.StatusCode = 416;
                res.AddHeader("Content-Range", $"bytes */{advertised}");
                res.Close();
                return;
            }

            if (to >= advertised)
                to = advertised - 1;

            // Ensure we can serve the full requested window (or up to currently available while still streaming).
            var requiredEnd = to + 1;
            if (!_buffer.IsCompleted)
            {
                // Prefer serving what we have for progressive start; wait at least for a slice.
                var available = _buffer.AvailableLength;
                if (available <= from)
                {
                    await _buffer.WaitUntilAvailableAsync(from + 1, _cts.Token).ConfigureAwait(false);
                    available = _buffer.AvailableLength;
                }

                if (_buffer.IsCompleted)
                {
                    advertised = Math.Max(1, _buffer.AvailableLength);
                    if (from >= advertised)
                    {
                        res.StatusCode = 416;
                        res.AddHeader("Content-Range", $"bytes */{advertised}");
                        res.Close();
                        return;
                    }

                    to = Math.Min(to, advertised - 1);
                }
                else
                {
                    // Serve contiguous available bytes; MediaElement will request more.
                    to = Math.Min(to, available - 1);
                    if (to < from)
                    {
                        await _buffer.WaitUntilAvailableAsync(from + Math.Min(64 * 1024, requiredEnd - from), _cts.Token)
                            .ConfigureAwait(false);
                        available = _buffer.AvailableLength;
                        if (_buffer.IsCompleted)
                            advertised = Math.Max(1, available);
                        to = Math.Min(Math.Max(from, available - 1), requiredEnd - 1);
                    }
                }
            }
            else
            {
                to = Math.Min(to, advertised - 1);
            }

            var length = to - from + 1;
            if (length <= 0)
            {
                res.StatusCode = 416;
                res.Close();
                return;
            }

            if (isRange)
            {
                res.StatusCode = 206;
                res.Headers.Add("Content-Range", $"bytes {from}-{to}/{advertised}");
            }
            else
            {
                res.StatusCode = 200;
            }

            res.ContentLength64 = length;

            const int chunkSize = 64 * 1024;
            var rented = new byte[chunkSize];
            var remaining = length;
            var offset = from;
            while (remaining > 0)
            {
                _cts.Token.ThrowIfCancellationRequested();
                var want = (int)Math.Min(remaining, chunkSize);
                await _buffer.WaitUntilAvailableAsync(offset + want, _cts.Token).ConfigureAwait(false);

                var availableLen = _buffer.AvailableLength;
                if (offset >= availableLen)
                    break;

                var canRead = Math.Min(want, availableLen - (int)offset);
                var copied = _buffer.CopyTo(offset, rented.AsSpan(0, canRead));
                if (copied <= 0)
                    break;

                await res.OutputStream.WriteAsync(rented.AsMemory(0, copied), _cts.Token).ConfigureAwait(false);
                offset += copied;
                remaining -= copied;
            }

            Array.Clear(rented, 0, rented.Length);
            res.OutputStream.Close();
        }
        catch (OperationCanceledException)
        {
            try { ctx.Response.Abort(); } catch { /* ignore */ }
        }
        catch
        {
            try { ctx.Response.Abort(); } catch { /* ignore */ }
        }
    }

    private void OnWaitingForDataChanged(bool waiting)
    {
        // Collapse rapid toggles slightly by only forwarding edge transitions.
        var gate = waiting ? 1 : 0;
        var previous = Interlocked.Exchange(ref _bufferingNotifyGate, gate);
        if (previous != gate)
            BufferingChanged?.Invoke(waiting);
    }

    private static int GetFreePort()
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    public void Dispose()
    {
        _buffer.WaitingForDataChanged -= OnWaitingForDataChanged;
        _cts.Cancel();
        try { _listener.Stop(); } catch { /* ignore */ }
        try { _listener.Close(); } catch { /* ignore */ }
        _cts.Dispose();
        _buffer.Dispose();
        BufferingChanged?.Invoke(false);
    }
}
