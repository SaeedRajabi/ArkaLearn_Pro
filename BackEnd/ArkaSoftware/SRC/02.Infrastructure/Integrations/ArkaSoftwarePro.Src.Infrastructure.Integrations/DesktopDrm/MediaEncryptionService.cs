using System.Buffers.Binary;

using System.Security.Cryptography;

using System.Text;

using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;



namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.DesktopDrm;



public sealed class MediaEncryptionService(IContentKeyVault contentKeyVault) : IMediaEncryptionService

{

    public const string ArkaContainerAlgorithm = "ArkaContainer-v1";

    public const byte ArkaContainerVersion = 1;

    private static readonly byte[] ArkaMagicBytes = "ARKA"u8.ToArray();



    public async Task<MediaEncryptionResult> EncryptFileAsync(

        long mediaAssetId,

        string sourcePhysicalPath,

        string destinationDirectory,

        string destinationFileName,

        CancellationToken cancellationToken = default)

    {

        Directory.CreateDirectory(destinationDirectory);

        var destinationPath = Path.Combine(destinationDirectory, destinationFileName);



        var contentKey = RandomNumberGenerator.GetBytes(32);

        var iv = RandomNumberGenerator.GetBytes(16);



        await EncryptSourceToCipherFileAsync(sourcePhysicalPath, destinationPath, contentKey, iv, cancellationToken);



        var checksum = await ComputeSha256HexOfFileAsync(destinationPath, cancellationToken);

        var keyId = await contentKeyVault.StoreKeyAsync(mediaAssetId, contentKey, cancellationToken);



        var relativeUrl = destinationPath.Replace('\\', '/');

        var mediaIndex = relativeUrl.IndexOf("/media/", StringComparison.OrdinalIgnoreCase);

        var url = mediaIndex >= 0 ? relativeUrl[mediaIndex..] : $"/media/encrypted/{destinationFileName}";



        return new MediaEncryptionResult(url, keyId, Convert.ToBase64String(iv), checksum, "AES-256-CBC");

    }



    public async Task<MediaEncryptionResult> EncryptToArkaContainerAsync(

        long mediaAssetId,

        string sourcePhysicalPath,

        string destinationDirectory,

        string destinationFileName,

        string contentType,

        string? contentKeyId = null,

        CancellationToken cancellationToken = default)

    {

        Directory.CreateDirectory(destinationDirectory);

        var destinationPath = Path.Combine(destinationDirectory, destinationFileName);

        var tempCipherPath = destinationPath + ".cipher.tmp";



        var contentKey = RandomNumberGenerator.GetBytes(32);

        var iv = RandomNumberGenerator.GetBytes(16);



        try

        {

            await EncryptSourceToCipherFileAsync(sourcePhysicalPath, tempCipherPath, contentKey, iv, cancellationToken);



            var cipherLength = new FileInfo(tempCipherPath).Length;

            var checksumHex = await ComputeSha256HexOfFileAsync(tempCipherPath, cancellationToken);

            var checksumBytes = Convert.FromHexString(checksumHex);



            string keyId;

            if (!string.IsNullOrWhiteSpace(contentKeyId))

            {

                keyId = contentKeyId.Trim();

                await contentKeyVault.StoreKeyWithIdAsync(keyId, mediaAssetId, contentKey, cancellationToken);

            }

            else

            {

                keyId = await contentKeyVault.StoreKeyAsync(mediaAssetId, contentKey, cancellationToken);

            }



            var contentTypeBytes = Encoding.UTF8.GetBytes(

                string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType.Trim());

            var keyIdBytes = Encoding.UTF8.GetBytes(keyId);



            await using (var output = File.Create(destinationPath))

            {

                await output.WriteAsync(ArkaMagicBytes, cancellationToken);

                output.WriteByte(ArkaContainerVersion);

                await WriteUInt16Async(output, (ushort)contentTypeBytes.Length, cancellationToken);

                await output.WriteAsync(contentTypeBytes, cancellationToken);

                await WriteUInt16Async(output, (ushort)keyIdBytes.Length, cancellationToken);

                await output.WriteAsync(keyIdBytes, cancellationToken);

                await output.WriteAsync(iv, cancellationToken);

                await WriteUInt64Async(output, (ulong)cipherLength, cancellationToken);



                await using (var cipher = File.OpenRead(tempCipherPath))

                    await cipher.CopyToAsync(output, cancellationToken);



                await output.WriteAsync(checksumBytes, cancellationToken);

            }



            var relativeUrl = destinationPath.Replace('\\', '/');

            var mediaIndex = relativeUrl.IndexOf("/media/", StringComparison.OrdinalIgnoreCase);

            var url = mediaIndex >= 0 ? relativeUrl[mediaIndex..] : $"/media/encrypted/{destinationFileName}";



            return new MediaEncryptionResult(

                url,

                keyId,

                Convert.ToBase64String(iv),

                checksumHex,

                ArkaContainerAlgorithm);

        }

        finally

        {

            try { File.Delete(tempCipherPath); } catch { /* best effort */ }

        }

    }



    public string WrapContentKeyForGrant(string contentKeyId, string grantToken)

    {

        var key = contentKeyVault.UnprotectKeyAsync(contentKeyId).GetAwaiter().GetResult()

            ?? throw new InvalidOperationException("Content key not found.");

        var grantKey = SHA256.HashData(Encoding.UTF8.GetBytes(grantToken));

        using var aes = Aes.Create();

        aes.Key = grantKey;

        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();

        var cipher = encryptor.TransformFinalBlock(key, 0, key.Length);

        var payload = new byte[aes.IV.Length + cipher.Length];

        Buffer.BlockCopy(aes.IV, 0, payload, 0, aes.IV.Length);

        Buffer.BlockCopy(cipher, 0, payload, aes.IV.Length, cipher.Length);

        return Convert.ToBase64String(payload);

    }



    private static async Task EncryptSourceToCipherFileAsync(

        string sourcePhysicalPath,

        string cipherPath,

        byte[] contentKey,

        byte[] iv,

        CancellationToken cancellationToken)

    {

        await using var input = File.OpenRead(sourcePhysicalPath);

        await using var output = File.Create(cipherPath);

        using var aes = Aes.Create();

        aes.Key = contentKey;

        aes.IV = iv;

        aes.Mode = CipherMode.CBC;

        aes.Padding = PaddingMode.PKCS7;

        await using var crypto = new CryptoStream(output, aes.CreateEncryptor(), CryptoStreamMode.Write);

        await input.CopyToAsync(crypto, cancellationToken);

        await crypto.FlushFinalBlockAsync(cancellationToken);

    }



    private static async Task<string> ComputeSha256HexOfFileAsync(string path, CancellationToken cancellationToken)

    {

        await using var stream = File.OpenRead(path);

        var hash = await SHA256.HashDataAsync(stream, cancellationToken);

        return Convert.ToHexString(hash).ToLowerInvariant();

    }



    private static async Task WriteUInt16Async(Stream stream, ushort value, CancellationToken cancellationToken)

    {

        Span<byte> buffer = stackalloc byte[2];

        BinaryPrimitives.WriteUInt16LittleEndian(buffer, value);

        await stream.WriteAsync(buffer.ToArray(), cancellationToken);

    }



    private static async Task WriteUInt64Async(Stream stream, ulong value, CancellationToken cancellationToken)

    {

        Span<byte> buffer = stackalloc byte[8];

        BinaryPrimitives.WriteUInt64LittleEndian(buffer, value);

        await stream.WriteAsync(buffer.ToArray(), cancellationToken);

    }

}


