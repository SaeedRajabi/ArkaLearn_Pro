namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.FileStorage;

public sealed class HttpResponseMessageStream(HttpResponseMessage response, Stream inner) : Stream
{
    public override bool CanRead => inner.CanRead;
    public override bool CanSeek => inner.CanSeek;
    public override bool CanWrite => false;
    public override long Length => inner.Length;
    public override long Position { get => inner.Position; set => inner.Position = value; }
    public override void Flush() => inner.Flush();
    public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);
    public override long Seek(long offset, SeekOrigin origin) => inner.Seek(offset, origin);
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    public override async ValueTask DisposeAsync()
    {
        await inner.DisposeAsync();
        response.Dispose();
        GC.SuppressFinalize(this);
    }
    protected override void Dispose(bool disposing)
    {
        if (disposing) { inner.Dispose(); response.Dispose(); }
        base.Dispose(disposing);
    }
}
