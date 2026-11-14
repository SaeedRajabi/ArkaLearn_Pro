using System.IO;
using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Local;

public sealed class FileWatchPositionStore : IWatchPositionStore
{
    private static readonly string StorePath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ArkaLearnDesktop",
        "watch-positions.json");

    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private readonly object _gate = new();
    private Dictionary<string, WatchEntry> _entries = new(StringComparer.Ordinal);
    private bool _loaded;

    public async Task<int?> GetPositionSecondsAsync(long mediaAssetId, CancellationToken cancellationToken = default)
    {
        await EnsureLoadedAsync(cancellationToken).ConfigureAwait(false);
        lock (_gate)
        {
            if (!_entries.TryGetValue(Key(mediaAssetId), out var entry))
                return null;
            return entry.PositionSeconds > 0 ? entry.PositionSeconds : null;
        }
    }

    public async Task SavePositionAsync(
        long mediaAssetId,
        int positionSeconds,
        int? durationSeconds = null,
        CancellationToken cancellationToken = default)
    {
        if (mediaAssetId <= 0) return;
        if (positionSeconds < 0) positionSeconds = 0;

        // Near the end: treat as completed so next open starts from beginning.
        if (durationSeconds is > 30 && positionSeconds >= (int)(durationSeconds.Value * 0.95))
            positionSeconds = 0;

        await EnsureLoadedAsync(cancellationToken).ConfigureAwait(false);
        lock (_gate)
        {
            _entries[Key(mediaAssetId)] = new WatchEntry
            {
                MediaAssetId = mediaAssetId,
                PositionSeconds = positionSeconds,
                DurationSeconds = durationSeconds,
                UpdatedAtUtc = DateTime.UtcNow,
            };
        }

        await PersistAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task ClearAsync(long mediaAssetId, CancellationToken cancellationToken = default)
    {
        await EnsureLoadedAsync(cancellationToken).ConfigureAwait(false);
        lock (_gate)
        {
            _entries.Remove(Key(mediaAssetId));
        }

        await PersistAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string Key(long mediaAssetId) => mediaAssetId.ToString();

    private async Task EnsureLoadedAsync(CancellationToken cancellationToken)
    {
        lock (_gate)
        {
            if (_loaded) return;
        }

        Dictionary<string, WatchEntry> loaded = new(StringComparer.Ordinal);
        try
        {
            if (File.Exists(StorePath))
            {
                await using var stream = File.OpenRead(StorePath);
                var file = await JsonSerializer.DeserializeAsync<WatchFile>(stream, JsonOptions, cancellationToken)
                    .ConfigureAwait(false);
                if (file?.Entries is not null)
                {
                    foreach (var entry in file.Entries)
                    {
                        if (entry.MediaAssetId <= 0) continue;
                        loaded[Key(entry.MediaAssetId)] = entry;
                    }
                }
            }
        }
        catch
        {
            loaded = new Dictionary<string, WatchEntry>(StringComparer.Ordinal);
        }

        lock (_gate)
        {
            if (!_loaded)
            {
                _entries = loaded;
                _loaded = true;
            }
        }
    }

    private async Task PersistAsync(CancellationToken cancellationToken)
    {
        WatchFile snapshot;
        lock (_gate)
        {
            // Keep the freshest ~200 entries to bound file size.
            var ordered = _entries.Values
                .OrderByDescending(e => e.UpdatedAtUtc)
                .Take(200)
                .ToList();
            _entries = ordered.ToDictionary(e => Key(e.MediaAssetId), e => e, StringComparer.Ordinal);
            snapshot = new WatchFile { Entries = ordered };
        }

        Directory.CreateDirectory(Path.GetDirectoryName(StorePath)!);
        var temp = StorePath + ".tmp";
        await using (var stream = File.Create(temp))
        {
            await JsonSerializer.SerializeAsync(stream, snapshot, JsonOptions, cancellationToken).ConfigureAwait(false);
        }

        File.Copy(temp, StorePath, overwrite: true);
        try { File.Delete(temp); } catch { /* ignore */ }
    }

    private sealed class WatchFile
    {
        public List<WatchEntry> Entries { get; set; } = [];
    }

    private sealed class WatchEntry
    {
        public long MediaAssetId { get; set; }
        public int PositionSeconds { get; set; }
        public int? DurationSeconds { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
    }
}
