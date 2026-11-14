using System.IO;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Drm;

public sealed class SecurePlaybackService : ISecurePlaybackService
{
    /// <summary>
    /// Keep a small number of decrypted sessions in RAM for instant lesson switching.
    /// Ciphertext remains on disk; plaintext never leaves process memory.
    /// </summary>
    private const int MaxCachedSessions = 2;

    private readonly object _gate = new();
    private readonly Dictionary<long, StreamingPlaybackSession> _sessions = new();
    private readonly LinkedList<long> _lru = new();
    private StreamingPlaybackSession? _activeSession;
    private long _activeMediaAssetId;

    public event EventHandler<bool>? BufferingChanged;
    public event EventHandler<double>? DownloadProgressChanged;

    public bool TryGetCachedPlayback(long mediaAssetId, out Uri playbackUri)
    {
        playbackUri = null!;
        if (mediaAssetId <= 0) return false;

        lock (_gate)
        {
            if (!_sessions.TryGetValue(mediaAssetId, out var session))
                return false;
            if (session.PlaybackUri is null)
                return false;

            TouchLru_NoLock(mediaAssetId);
            AttachActive_NoLock(session, mediaAssetId);
            playbackUri = session.PlaybackUri;
            return true;
        }
    }

    public Task<Uri> StartRamPlaybackAsync(
        byte[] encryptedPayload,
        string encryptionAlgorithm,
        string ivBase64,
        string wrappedContentKeyBase64,
        string grantToken,
        string mimeType,
        long mediaAssetId = 0,
        CancellationToken cancellationToken = default)
    {
        var stream = new MemoryStream(encryptedPayload, writable: false);
        return StartProgressiveRamPlaybackAsync(
            stream,
            encryptedPayload.LongLength,
            encryptionAlgorithm,
            ivBase64,
            wrappedContentKeyBase64,
            grantToken,
            mimeType,
            encryptedCacheWriteStream: null,
            streamOwnership: null,
            mediaAssetId,
            cancellationToken);
    }

    public async Task<Uri> StartProgressiveRamPlaybackAsync(
        Stream encryptedStream,
        long? encryptedContentLength,
        string encryptionAlgorithm,
        string ivBase64,
        string wrappedContentKeyBase64,
        string grantToken,
        string mimeType,
        Stream? encryptedCacheWriteStream = null,
        IAsyncDisposable? streamOwnership = null,
        long mediaAssetId = 0,
        CancellationToken cancellationToken = default)
    {
        if (mediaAssetId > 0 && TryGetCachedPlayback(mediaAssetId, out var existing))
            return existing;

        ParkCurrentSession();

        if (mediaAssetId > 0)
            EvictForNewSession(mediaAssetId);

        var session = new StreamingPlaybackSession { MediaAssetId = mediaAssetId };

        try
        {
            var uri = await session.StartAsync(
                encryptedStream,
                encryptedContentLength,
                encryptionAlgorithm,
                ivBase64,
                wrappedContentKeyBase64,
                grantToken,
                mimeType,
                encryptedCacheWriteStream,
                streamOwnership,
                StreamingPlaybackSession.DefaultStartBytes,
                cancellationToken).ConfigureAwait(false);

            lock (_gate)
            {
                if (mediaAssetId > 0)
                {
                    _sessions[mediaAssetId] = session;
                    TouchLru_NoLock(mediaAssetId);
                }

                AttachActive_NoLock(session, mediaAssetId);
            }

            return uri;
        }
        catch
        {
            session.Dispose();
            throw;
        }
    }

    public void ParkCurrentSession()
    {
        lock (_gate)
        {
            DetachActive_NoLock();
        }

        BufferingChanged?.Invoke(this, false);
    }

    public void StopPlayback(Uri? sourceUri)
    {
        StreamingPlaybackSession? toDispose = null;
        lock (_gate)
        {
            if (sourceUri is null)
            {
                toDispose = _activeSession;
                DetachActive_NoLock();
            }
            else
            {
                var match = _sessions.FirstOrDefault(kv =>
                    kv.Value.PlaybackUri is not null &&
                    string.Equals(kv.Value.PlaybackUri.ToString(), sourceUri.ToString(), StringComparison.OrdinalIgnoreCase));

                if (match.Value is not null)
                {
                    toDispose = match.Value;
                    RemoveSession_NoLock(match.Key);
                    if (ReferenceEquals(_activeSession, toDispose))
                        DetachActive_NoLock();
                }
                else if (_activeSession?.PlaybackUri is not null &&
                         string.Equals(_activeSession.PlaybackUri.ToString(), sourceUri.ToString(), StringComparison.OrdinalIgnoreCase))
                {
                    toDispose = _activeSession;
                    DetachActive_NoLock();
                }
                else
                {
                    RamLoopbackMediaServer.Stop(sourceUri);
                }
            }
        }

        toDispose?.Dispose();
        BufferingChanged?.Invoke(this, false);
    }

    public void EvictAllSessions()
    {
        List<StreamingPlaybackSession> all;
        lock (_gate)
        {
            DetachActive_NoLock();
            all = _sessions.Values.ToList();
            _sessions.Clear();
            _lru.Clear();
        }

        foreach (var session in all)
        {
            try { session.Dispose(); } catch { /* ignore */ }
        }

        BufferingChanged?.Invoke(this, false);
    }

    private void EvictForNewSession(long mediaAssetId)
    {
        List<StreamingPlaybackSession> victims = [];
        lock (_gate)
        {
            if (_sessions.TryGetValue(mediaAssetId, out var stale))
            {
                _sessions.Remove(mediaAssetId);
                _lru.Remove(mediaAssetId);
                victims.Add(stale);
            }

            while (_sessions.Count >= MaxCachedSessions && _lru.Count > 0)
            {
                var oldest = _lru.First!.Value;
                _lru.RemoveFirst();
                if (_sessions.Remove(oldest, out var session))
                    victims.Add(session);
            }
        }

        foreach (var victim in victims)
        {
            try { victim.Dispose(); } catch { /* ignore */ }
        }
    }

    private void AttachActive_NoLock(StreamingPlaybackSession session, long mediaAssetId)
    {
        if (!ReferenceEquals(_activeSession, session))
        {
            if (_activeSession is not null)
            {
                _activeSession.BufferingChanged -= OnSessionBufferingChanged;
                _activeSession.ProgressChanged -= OnSessionProgressChanged;
            }

            _activeSession = session;
            _activeMediaAssetId = mediaAssetId;
            session.BufferingChanged += OnSessionBufferingChanged;
            session.ProgressChanged += OnSessionProgressChanged;
        }
        else
        {
            _activeMediaAssetId = mediaAssetId;
        }
    }

    private void DetachActive_NoLock()
    {
        if (_activeSession is null) return;
        _activeSession.BufferingChanged -= OnSessionBufferingChanged;
        _activeSession.ProgressChanged -= OnSessionProgressChanged;
        _activeSession = null;
        _activeMediaAssetId = 0;
    }

    private void RemoveSession_NoLock(long mediaAssetId)
    {
        _sessions.Remove(mediaAssetId);
        _lru.Remove(mediaAssetId);
    }

    private void TouchLru_NoLock(long mediaAssetId)
    {
        _lru.Remove(mediaAssetId);
        _lru.AddLast(mediaAssetId);
    }

    private void OnSessionBufferingChanged(bool waiting) =>
        BufferingChanged?.Invoke(this, waiting);

    private void OnSessionProgressChanged(double percent) =>
        DownloadProgressChanged?.Invoke(this, percent);
}
