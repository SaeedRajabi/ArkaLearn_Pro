using System.IO;

namespace ArkaLearnDesktop.Infrastructure.Drm;

/// <summary>
/// Writes ciphertext to a temp path and only promotes it into the encrypted cache after
/// <see cref="MarkSuccess"/> — failed/cancelled downloads leave no corrupt cache entry.
/// </summary>
internal sealed class CacheFinalizeStream(
    Stream inner,
    string tempPath,
    string finalPath,
    Func<Task>? onFinalized = null) : Stream
{
    private bool _success;
    private bool _finalized;

    public void MarkSuccess() => _success = true;

    public override bool CanRead => false;
    public override bool CanSeek => false;
    public override bool CanWrite => inner.CanWrite;
    public override long Length => inner.Length;
    public override long Position
    {
        get => inner.Position;
        set => throw new NotSupportedException();
    }

    public override void Flush() => inner.Flush();
    public override Task FlushAsync(CancellationToken cancellationToken) => inner.FlushAsync(cancellationToken);
    public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
    public override void SetLength(long value) => inner.SetLength(value);
    public override void Write(byte[] buffer, int offset, int count) => inner.Write(buffer, offset, count);
    public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
        inner.WriteAsync(buffer, offset, count, cancellationToken);
    public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default) =>
        inner.WriteAsync(buffer, cancellationToken);

    protected override void Dispose(bool disposing)
    {
        if (disposing)
            FinalizeCoreAsync().GetAwaiter().GetResult();
        base.Dispose(disposing);
    }

    public override async ValueTask DisposeAsync() => await FinalizeCoreAsync().ConfigureAwait(false);

    private async Task FinalizeCoreAsync()
    {
        if (_finalized) return;
        _finalized = true;
        try
        {
            await inner.FlushAsync().ConfigureAwait(false);
            await inner.DisposeAsync().ConfigureAwait(false);

            if (!_success)
            {
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
                return;
            }

            if (File.Exists(finalPath))
                File.Delete(finalPath);
            if (File.Exists(tempPath))
                File.Move(tempPath, finalPath);
            if (onFinalized is not null)
                await onFinalized().ConfigureAwait(false);
        }
        catch
        {
            try { if (File.Exists(tempPath)) File.Delete(tempPath); } catch { /* ignore */ }
        }
    }
}
