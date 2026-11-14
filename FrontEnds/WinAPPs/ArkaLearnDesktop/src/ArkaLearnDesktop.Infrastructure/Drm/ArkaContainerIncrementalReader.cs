using System.Buffers.Binary;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace ArkaLearnDesktop.Infrastructure.Drm;

/// <summary>
/// Incrementally parses ArkaContainer-v1 and yields ciphertext for progressive decrypt.
/// </summary>
internal sealed class ArkaContainerIncrementalReader : IDisposable
{
    private readonly List<byte> _stash = new(8192);
    private readonly IncrementalHash _cipherHash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
    private readonly byte[] _hashBuffer = new byte[32];
    private int _hashCount;
    private bool _headerParsed;
    private ulong _cipherLength;
    private ulong _cipherReceived;
    private string? _contentType;
    private bool _hashVerified;
    private bool _completed;

    public bool HeaderParsed => _headerParsed;
    public string? ContentType => _contentType;
    public ulong CipherLength => _cipherLength;
    public bool IsCipherComplete => _headerParsed && _cipherReceived >= _cipherLength;
    public bool HashVerified => _hashVerified;

    /// <summary>
    /// Feeds container bytes and returns newly available ciphertext (copy).
    /// </summary>
    public byte[] Feed(ReadOnlySpan<byte> chunk, out bool finished)
    {
        finished = false;
        if (chunk.IsEmpty || _completed)
            return [];

        if (!_headerParsed)
        {
            AppendStash(chunk);
            if (!TryParseHeader(out var cipherFromStash))
                return [];

            return TakeCipher(cipherFromStash, out finished);
        }

        return TakeCipher(chunk.ToArray(), out finished);
    }

    public void EnsureHashValid()
    {
        if (!_headerParsed)
            throw new InvalidDataException("هدر فایل رمزنگاری‌شده ناقص است.");
        if (!_hashVerified)
            throw new InvalidDataException("سلامت فایل رمزنگاری‌شده تأیید نشد.");
    }

    public void Dispose()
    {
        _cipherHash.Dispose();
        _stash.Clear();
        Array.Clear(_hashBuffer, 0, _hashBuffer.Length);
    }

    private byte[] TakeCipher(byte[] incoming, out bool finished)
    {
        finished = false;
        if (incoming.Length == 0)
            return [];

        var offset = 0;
        byte[]? cipher = null;

        if (_cipherReceived < _cipherLength)
        {
            var need = (int)Math.Min((ulong)(incoming.Length - offset), _cipherLength - _cipherReceived);
            if (need > 0)
            {
                cipher = new byte[need];
                Buffer.BlockCopy(incoming, offset, cipher, 0, need);
                _cipherHash.AppendData(cipher);
                _cipherReceived += (ulong)need;
                offset += need;
            }
        }

        if (_cipherReceived >= _cipherLength && !_completed)
        {
            while (offset < incoming.Length && _hashCount < 32)
                _hashBuffer[_hashCount++] = incoming[offset++];

            if (_hashCount == 32)
            {
                VerifyHash();
                _completed = true;
                finished = true;
            }
        }

        return cipher ?? [];
    }

    private void VerifyHash()
    {
        var actual = _cipherHash.GetHashAndReset();
        try
        {
            if (!CryptographicOperations.FixedTimeEquals(actual, _hashBuffer.AsSpan(0, 32)))
                throw new InvalidDataException("سلامت فایل رمزنگاری‌شده تأیید نشد.");
            _hashVerified = true;
        }
        finally
        {
            Array.Clear(actual, 0, actual.Length);
        }
    }

    private void AppendStash(ReadOnlySpan<byte> chunk)
    {
        for (var i = 0; i < chunk.Length; i++)
            _stash.Add(chunk[i]);
    }

    private bool TryParseHeader(out byte[] cipherFromStash)
    {
        cipherFromStash = [];
        var data = _stash.ToArray();
        if (data.Length < 7)
            return false;

        if (!data.AsSpan().StartsWith(ArkaContainerReader.Magic))
            throw new InvalidDataException("فرمت فایل رمزنگاری‌شده نامعتبر است.");

        var offset = 4;
        var version = data[offset++];
        if (version != 1)
            throw new InvalidDataException("نسخه فایل رمزنگاری‌شده پشتیبانی نمی‌شود.");

        if (offset + 2 > data.Length) return false;
        var contentTypeLength = BinaryPrimitives.ReadUInt16LittleEndian(data.AsSpan(offset, 2));
        offset += 2;
        if (offset + contentTypeLength + 2 > data.Length) return false;

        _contentType = Encoding.UTF8.GetString(data, offset, contentTypeLength);
        offset += contentTypeLength;

        var keyIdLength = BinaryPrimitives.ReadUInt16LittleEndian(data.AsSpan(offset, 2));
        offset += 2;
        if (offset + keyIdLength + 16 + 8 > data.Length) return false;

        offset += keyIdLength;
        offset += 16;
        _cipherLength = BinaryPrimitives.ReadUInt64LittleEndian(data.AsSpan(offset, 8));
        offset += 8;

        if (_cipherLength > int.MaxValue)
            throw new InvalidDataException("حجم فایل رمزنگاری‌شده بیش از حد مجاز است.");

        _headerParsed = true;
        if (offset < data.Length)
        {
            cipherFromStash = new byte[data.Length - offset];
            Buffer.BlockCopy(data, offset, cipherFromStash, 0, cipherFromStash.Length);
        }

        _stash.Clear();
        return true;
    }
}
