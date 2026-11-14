using System.Security.Cryptography;
using System.Text;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;

/// <summary>Authenticated encryption for new values; explicit key-ring support for existing CBC values.</summary>
public static class SecretCipher
{
    private static readonly byte[] Magic = "ARK2"u8.ToArray();

    public static byte[] GetKey(IConfiguration configuration, string section, string environmentVariable)
    {
        var configured = configuration[$"{section}:MasterKeyBase64"];
        if (section == "PaymentGateway") configured = configuration[$"{section}:SecretsMasterKeyBase64"];
        if (string.IsNullOrWhiteSpace(configured)) configured = Environment.GetEnvironmentVariable(environmentVariable);
        if (string.IsNullOrWhiteSpace(configured))
            throw new InvalidOperationException($"A 32-byte master key must be configured for {section}.");
        try
        {
            var key = Convert.FromBase64String(configured);
            if (key.Length == 32) return key;
        }
        catch (FormatException) { }
        throw new InvalidOperationException($"The configured {section} master key must be 32 bytes encoded as Base64.");
    }

    public static byte[] Protect(byte[] plain, byte[] key)
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var ciphertext = new byte[plain.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(key, 16);
        aes.Encrypt(nonce, plain, ciphertext, tag, Magic);
        return [.. Magic, .. nonce, .. tag, .. ciphertext];
    }

    public static byte[] Unprotect(byte[] payload, byte[] key, IEnumerable<byte[]>? previousKeys = null)
    {
        foreach (var candidate in new[] { key }.Concat(previousKeys ?? []))
        {
            try
            {
                if (payload.AsSpan().StartsWith(Magic))
                {
                    if (payload.Length < 32) throw new CryptographicException("Invalid encrypted payload.");
                    var plain = new byte[payload.Length - 32];
                    using var aes = new AesGcm(candidate, 16);
                    aes.Decrypt(payload.AsSpan(4, 12), payload.AsSpan(32), payload.AsSpan(16, 16), plain, Magic);
                    return plain;
                }
                if (payload.Length < 32 || payload.Length % 16 != 0)
                    throw new CryptographicException("Invalid legacy encrypted payload.");
                using var legacy = Aes.Create();
                legacy.Key = candidate;
                legacy.IV = payload.AsSpan(0, 16).ToArray();
                using var decryptor = legacy.CreateDecryptor();
                return decryptor.TransformFinalBlock(payload, 16, payload.Length - 16);
            }
            catch (CryptographicException) { }
        }
        throw new CryptographicException("The encrypted value cannot be read using the configured key ring.");
    }

    public static IEnumerable<byte[]> PreviousKeys(IConfiguration configuration, string section) =>
        (configuration.GetSection($"{section}:PreviousMasterKeysBase64").Get<string[]>() ?? [])
        .Select(value =>
        {
            var key = Convert.FromBase64String(value);
            return key.Length == 32 ? key : throw new InvalidOperationException("Previous master keys must be 32 bytes.");
        });
}
