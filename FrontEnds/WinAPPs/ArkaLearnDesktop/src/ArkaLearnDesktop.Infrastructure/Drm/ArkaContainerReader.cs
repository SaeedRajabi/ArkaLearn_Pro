using System.Buffers.Binary;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace ArkaLearnDesktop.Infrastructure.Drm;

internal static class ArkaContainerReader
{
    public const string Algorithm = "ArkaContainer-v1";
    internal static ReadOnlySpan<byte> Magic => "ARKA"u8;

    public static bool IsArkaContainer(string? algorithm, ReadOnlySpan<byte> data) =>
        string.Equals(algorithm, Algorithm, StringComparison.OrdinalIgnoreCase)
        || (data.Length >= 4 && data.StartsWith(Magic));

    public static byte[] ExtractCiphertext(ReadOnlySpan<byte> container, out string? contentType)
    {
        contentType = null;

        if (container.Length < 4 + 1 + 2 + 2 + 16 + 8 + 32)
            throw new InvalidDataException("Arka container is too short.");

        if (!container.StartsWith(Magic))
            throw new InvalidDataException("Invalid Arka container magic.");

        var offset = 4;
        var version = container[offset++];
        if (version != 1)
            throw new InvalidDataException($"Unsupported Arka container version {version}.");

        var contentTypeLength = BinaryPrimitives.ReadUInt16LittleEndian(container.Slice(offset, 2));
        offset += 2;
        if (offset + contentTypeLength > container.Length)
            throw new InvalidDataException("Arka container has invalid content type length.");

        contentType = Encoding.UTF8.GetString(container.Slice(offset, contentTypeLength));
        offset += contentTypeLength;

        var keyIdLength = BinaryPrimitives.ReadUInt16LittleEndian(container.Slice(offset, 2));
        offset += 2;
        if (offset + keyIdLength > container.Length)
            throw new InvalidDataException("Arka container has invalid key id length.");

        offset += keyIdLength;

        if (offset + 16 + 8 > container.Length)
            throw new InvalidDataException("Arka container is missing IV or ciphertext length.");

        offset += 16;

        var cipherLength = BinaryPrimitives.ReadUInt64LittleEndian(container.Slice(offset, 8));
        offset += 8;

        if (cipherLength > int.MaxValue || offset + (long)cipherLength + 32 > container.Length)
            throw new InvalidDataException("Arka container ciphertext section is truncated.");

        var ciphertext = container.Slice(offset, (int)cipherLength).ToArray();
        offset += (int)cipherLength;

        var expectedHash = container.Slice(offset, 32);
        var actualHash = SHA256.HashData(ciphertext);
        if (!expectedHash.SequenceEqual(actualHash))
            throw new InvalidDataException("Arka container checksum mismatch.");

        return ciphertext;
    }
}
