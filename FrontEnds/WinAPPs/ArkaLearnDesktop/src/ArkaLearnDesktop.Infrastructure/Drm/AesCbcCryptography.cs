using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace ArkaLearnDesktop.Infrastructure.Drm;

internal static class AesCbcCryptography
{
    public static byte[] UnwrapContentKey(string wrappedBase64, string grantToken)
    {
        var payload = Convert.FromBase64String(wrappedBase64);
        var grantKey = SHA256.HashData(Encoding.UTF8.GetBytes(grantToken));
        using var aes = Aes.Create();
        aes.Key = grantKey;
        var ivLength = aes.BlockSize / 8;
        var iv = payload.AsSpan(0, ivLength).ToArray();
        var cipher = payload.AsSpan(ivLength).ToArray();
        aes.IV = iv;
        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(cipher, 0, cipher.Length);
    }

    public static byte[] DecryptAesCbc(byte[] cipherText, byte[] key, byte[] iv)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        using var decryptor = aes.CreateDecryptor();
        return decryptor.TransformFinalBlock(cipherText, 0, cipherText.Length);
    }
}
