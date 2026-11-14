using System.Threading;

namespace ArkaLearnDesktop.Infrastructure.Drm;

/// <summary>
/// Thread-safe growable plaintext buffer for progressive loopback serving.
/// Plaintext stays in RAM only; callers must Clear on dispose.
/// </summary>
internal sealed class ProgressiveClearBuffer : IDisposable
{
    private readonly object _gate = new();
    private readonly List<TaskCompletionSource<bool>> _waiters = new();
    private byte[] _data;
    private int _length;
    private long? _finalLength;
    private long? _estimatedLength;
    private bool _completed;
    private bool _failed;
    private Exception? _error;
    private bool _disposed;
    private int _waitingConsumers;

    public ProgressiveClearBuffer(int initialCapacity = 1024 * 1024)
    {
        _data = new byte[Math.Max(64 * 1024, initialCapacity)];
    }

    public int AvailableLength
    {
        get { lock (_gate) return _length; }
    }

    /// <summary>Length advertised to HTTP clients (final when known, else estimate).</summary>
    public long AdvertisedLength
    {
        get
        {
            lock (_gate)
            {
                if (_finalLength is long final) return final;
                if (_estimatedLength is long estimated) return Math.Max(estimated, _length);
                return Math.Max(_length, 1);
            }
        }
    }

    public bool IsCompleted
    {
        get { lock (_gate) return _completed; }
    }

    public bool IsFailed
    {
        get { lock (_gate) return _failed; }
    }

    public bool IsWaitingForData
    {
        get { lock (_gate) return _waitingConsumers > 0; }
    }

    public event Action<bool>? WaitingForDataChanged;

    public void SetEstimatedLength(long estimatedClearBytes)
    {
        if (estimatedClearBytes <= 0) return;
        lock (_gate)
        {
            _estimatedLength = estimatedClearBytes;
        }
    }

    public void Append(ReadOnlySpan<byte> chunk)
    {
        if (chunk.IsEmpty) return;

        List<TaskCompletionSource<bool>>? toRelease = null;
        lock (_gate)
        {
            ThrowIfDisposed();
            if (_completed || _failed) return;

            EnsureCapacity_NoLock(_length + chunk.Length);
            chunk.CopyTo(_data.AsSpan(_length));
            _length += chunk.Length;
            toRelease = CaptureReadyWaiters_NoLock();
        }

        ReleaseWaiters(toRelease);
    }

    public void Complete(long finalLength)
    {
        List<TaskCompletionSource<bool>> toRelease;
        lock (_gate)
        {
            ThrowIfDisposed();
            if (_failed) return;
            _finalLength = Math.Max(0, finalLength);
            if (_length > finalLength)
                _length = (int)finalLength;
            _completed = true;
            toRelease = _waiters.ToList();
            _waiters.Clear();
        }

        ReleaseWaiters(toRelease);
    }

    public void Fail(Exception error)
    {
        List<TaskCompletionSource<bool>> toRelease;
        lock (_gate)
        {
            if (_completed || _failed) return;
            _failed = true;
            _error = error;
            toRelease = _waiters.ToList();
            _waiters.Clear();
        }

        ReleaseWaiters(toRelease);
    }

    /// <summary>
    /// Blocks until bytes in [0, requiredExclusiveEnd) are available, or the buffer completes/fails.
    /// </summary>
    public async Task WaitUntilAvailableAsync(long requiredExclusiveEnd, CancellationToken cancellationToken)
    {
        while (true)
        {
            Task waitTask;
            var enteredWait = false;
            lock (_gate)
            {
                ThrowIfDisposed();
                if (_failed)
                    throw new InvalidOperationException("رمزگشایی رسانه ناموفق بود.", _error);
                if (_completed)
                    return;
                if (requiredExclusiveEnd <= _length)
                    return;

                var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
                _waiters.Add(tcs);
                waitTask = tcs.Task;
                _waitingConsumers++;
                enteredWait = true;
            }

            if (enteredWait)
                WaitingForDataChanged?.Invoke(true);

            try
            {
                using var reg = cancellationToken.Register(() =>
                {
                    // Wake waiter so dispose/stop can proceed.
                });
                await waitTask.WaitAsync(cancellationToken).ConfigureAwait(false);
            }
            finally
            {
                var stillWaiting = false;
                lock (_gate)
                {
                    if (enteredWait)
                        _waitingConsumers = Math.Max(0, _waitingConsumers - 1);
                    stillWaiting = _waitingConsumers > 0;
                }

                if (!stillWaiting)
                    WaitingForDataChanged?.Invoke(false);
            }
        }
    }

    public int CopyTo(long offset, Span<byte> destination)
    {
        lock (_gate)
        {
            ThrowIfDisposed();
            if (_failed)
                throw new InvalidOperationException("رمزگشایی رسانه ناموفق بود.", _error);
            if (offset >= _length || destination.IsEmpty)
                return 0;

            var available = _length - (int)offset;
            var toCopy = Math.Min(available, destination.Length);
            _data.AsSpan((int)offset, toCopy).CopyTo(destination);
            return toCopy;
        }
    }

    public void Dispose()
    {
        List<TaskCompletionSource<bool>> toRelease;
        lock (_gate)
        {
            if (_disposed) return;
            _disposed = true;
            _failed = true;
            _error ??= new ObjectDisposedException(nameof(ProgressiveClearBuffer));
            toRelease = _waiters.ToList();
            _waiters.Clear();
            Array.Clear(_data, 0, _data.Length);
            _data = Array.Empty<byte>();
            _length = 0;
        }

        ReleaseWaiters(toRelease);
    }

    private void EnsureCapacity_NoLock(int needed)
    {
        if (needed <= _data.Length) return;
        var newSize = _data.Length;
        while (newSize < needed)
            newSize = newSize < 1024 * 1024 ? newSize * 2 : newSize + 4 * 1024 * 1024;
        var resized = new byte[newSize];
        Buffer.BlockCopy(_data, 0, resized, 0, _length);
        Array.Clear(_data, 0, _length);
        _data = resized;
    }

    private List<TaskCompletionSource<bool>> CaptureReadyWaiters_NoLock()
    {
        if (_waiters.Count == 0) return [];
        var ready = new List<TaskCompletionSource<bool>>();
        for (var i = _waiters.Count - 1; i >= 0; i--)
        {
            // Wake all; each waiter re-checks its own threshold.
            ready.Add(_waiters[i]);
            _waiters.RemoveAt(i);
        }

        return ready;
    }

    private static void ReleaseWaiters(List<TaskCompletionSource<bool>>? waiters)
    {
        if (waiters is null) return;
        foreach (var waiter in waiters)
            waiter.TrySetResult(true);
    }

    private void ThrowIfDisposed()
    {
        if (_disposed)
            throw new ObjectDisposedException(nameof(ProgressiveClearBuffer));
    }
}
