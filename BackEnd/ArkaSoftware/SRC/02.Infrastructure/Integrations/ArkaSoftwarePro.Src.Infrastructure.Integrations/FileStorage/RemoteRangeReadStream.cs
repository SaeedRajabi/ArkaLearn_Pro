namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;

/// <summary>Supports HTTP Range downloads without staging a complete remote object on the API disk.</summary>
internal sealed class RemoteRangeReadStream(long length, Func<long, CancellationToken, Task<Stream>> openAt) : Stream
{
    private Stream? _current;
    private long _position;
    private bool _disposed;
    public override bool CanRead => !_disposed;
    public override bool CanSeek => !_disposed;
    public override bool CanWrite => false;
    public override long Length => length;
    public override long Position { get => _position; set => Seek(value, SeekOrigin.Begin); }

    public override async ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        if (_position >= length || buffer.IsEmpty) return 0;
        _current ??= await openAt(_position, cancellationToken);
        var count = await _current.ReadAsync(buffer[..(int)Math.Min(buffer.Length, length - _position)], cancellationToken);
        _position += count;
        return count;
    }
    public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        => ReadAsync(buffer.AsMemory(offset, count), cancellationToken).AsTask();
    public override int Read(byte[] buffer, int offset, int count)
        => ReadAsync(buffer.AsMemory(offset, count)).AsTask().GetAwaiter().GetResult();
    public override long Seek(long offset, SeekOrigin origin)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        var next = origin switch
        {
            SeekOrigin.Begin => offset,
            SeekOrigin.Current => checked(_position + offset),
            SeekOrigin.End => checked(length + offset),
            _ => throw new ArgumentOutOfRangeException(nameof(origin)),
        };
        if (next < 0) throw new IOException("Cannot seek before the beginning of the remote file.");
        if (next != _position) { _current?.Dispose(); _current = null; _position = next; }
        return _position;
    }
    public override void Flush() { }
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    protected override void Dispose(bool disposing)
    {
        if (disposing && !_disposed) { _disposed = true; _current?.Dispose(); }
        base.Dispose(disposing);
    }
    public override async ValueTask DisposeAsync()
    {
        if (!_disposed) { _disposed = true; if (_current is not null) await _current.DisposeAsync(); }
        GC.SuppressFinalize(this);
    }
}
