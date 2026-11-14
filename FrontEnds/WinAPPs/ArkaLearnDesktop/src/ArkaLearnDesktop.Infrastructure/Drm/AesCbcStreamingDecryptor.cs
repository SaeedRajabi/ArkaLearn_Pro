using System.Security.Cryptography;

namespace ArkaLearnDesktop.Infrastructure.Drm;

/// <summary>
/// Progressive AES-CBC PKCS7 decryptor. Reserves the trailing cipher block until <see cref="Finish"/>
/// so padding can be removed correctly without loading the entire ciphertext.
/// </summary>
internal sealed class AesCbcStreamingDecryptor : IDisposable
{
    private readonly Aes _aes;
    private readonly ICryptoTransform _decryptor;
    private readonly byte[] _pending = new byte[256 * 1024];
    private readonly byte[] _blockOut = new byte[256 * 1024];
    private int _pendingCount;
    private bool _finished;
    private bool _disposed;

    public AesCbcStreamingDecryptor(byte[] key, byte[] iv)
    {
        _aes = Aes.Create();
        _aes.Key = key;
        _aes.IV = iv;
        _aes.Mode = CipherMode.CBC;
        _aes.Padding = PaddingMode.PKCS7;
        _decryptor = _aes.CreateDecryptor();
    }

    /// <summary>
    /// Feeds ciphertext and appends newly available plaintext into <paramref name="clearBuffer"/>.
    /// </summary>
    public void TransformTo(ReadOnlySpan<byte> cipherChunk, ProgressiveClearBuffer clearBuffer)
    {
        ThrowIfInvalid();
        if (cipherChunk.IsEmpty) return;

        var offset = 0;
        while (offset < cipherChunk.Length)
        {
            var space = _pending.Length - _pendingCount;
            if (space == 0)
                FlushDecryptable(clearBuffer, leaveBlocks: 1);

            space = _pending.Length - _pendingCount;
            var toCopy = Math.Min(space, cipherChunk.Length - offset);
            cipherChunk.Slice(offset, toCopy).CopyTo(_pending.AsSpan(_pendingCount));
            _pendingCount += toCopy;
            offset += toCopy;

            FlushDecryptable(clearBuffer, leaveBlocks: 1);
        }
    }

    /// <summary>Finalizes PKCS7 padding and appends the remaining plaintext.</summary>
    public void Finish(ProgressiveClearBuffer clearBuffer)
    {
        ThrowIfInvalid();
        _finished = true;

        if (_pendingCount <= 0)
        {
            clearBuffer.Complete(clearBuffer.AvailableLength);
            return;
        }

        var final = _decryptor.TransformFinalBlock(_pending, 0, _pendingCount);
        try
        {
            if (final.Length > 0)
                clearBuffer.Append(final);
            clearBuffer.Complete(clearBuffer.AvailableLength);
        }
        finally
        {
            Array.Clear(final, 0, final.Length);
            _pendingCount = 0;
            Array.Clear(_pending, 0, _pending.Length);
        }
    }

    private void FlushDecryptable(ProgressiveClearBuffer clearBuffer, int leaveBlocks)
    {
        var decryptable = (_pendingCount / 16 - leaveBlocks) * 16;
        if (decryptable <= 0) return;
        if (decryptable > _blockOut.Length)
            throw new InvalidOperationException("خروجی رمزگشایی از ظرفیت بافر بیشتر است.");

        var written = _decryptor.TransformBlock(_pending, 0, decryptable, _blockOut, 0);
        if (written > 0)
            clearBuffer.Append(_blockOut.AsSpan(0, written));

        var remaining = _pendingCount - decryptable;
        if (remaining > 0)
            Buffer.BlockCopy(_pending, decryptable, _pending, 0, remaining);
        Array.Clear(_pending, remaining, _pendingCount - remaining);
        _pendingCount = remaining;
        Array.Clear(_blockOut, 0, written);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _decryptor.Dispose();
        _aes.Dispose();
        Array.Clear(_pending, 0, _pending.Length);
        Array.Clear(_blockOut, 0, _blockOut.Length);
    }

    private void ThrowIfInvalid()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        if (_finished)
            throw new InvalidOperationException("Decryptor already finished.");
    }
}
