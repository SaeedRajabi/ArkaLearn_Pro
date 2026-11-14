using System.Security.Cryptography;
using System.Text;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;

internal static class RemoteAssistSecurity
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static string GenerateSessionCode()
    {
        Span<char> buffer = stackalloc char[6];
        var bytes = RandomNumberGenerator.GetBytes(buffer.Length);
        for (var i = 0; i < buffer.Length; i++)
            buffer[i] = Alphabet[bytes[i] % Alphabet.Length];
        return new string(buffer);
    }

    public static string GenerateSessionUsername(long userId)
    {
        Span<char> suffix = stackalloc char[4];
        var bytes = RandomNumberGenerator.GetBytes(suffix.Length);
        for (var i = 0; i < suffix.Length; i++)
            suffix[i] = Alphabet[bytes[i] % Alphabet.Length];
        return $"arka{userId}{new string(suffix)}".ToLowerInvariant();
    }

    public static string GenerateSessionPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        Span<char> buffer = stackalloc char[8];
        var bytes = RandomNumberGenerator.GetBytes(buffer.Length);
        for (var i = 0; i < buffer.Length; i++)
            buffer[i] = chars[bytes[i] % chars.Length];
        return new string(buffer);
    }

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password.Trim(), salt, 600_000, HashAlgorithmName.SHA256, 32);
        return $"pbkdf2$600000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        try
        {
            if (storedHash.StartsWith("pbkdf2$", StringComparison.Ordinal))
            {
                var parts = storedHash.Split('$');
                if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations) || iterations < 10_000 || iterations > 2_000_000)
                    return false;
                var salt = Convert.FromBase64String(parts[2]);
                var expected = Convert.FromBase64String(parts[3]);
                if (salt.Length != 16 || expected.Length != 32) return false;
                return CryptographicOperations.FixedTimeEquals(expected,
                    Rfc2898DeriveBytes.Pbkdf2(password.Trim(), salt, iterations, HashAlgorithmName.SHA256, 32));
            }
            return CryptographicOperations.FixedTimeEquals(Convert.FromHexString(storedHash),
                SHA256.HashData(Encoding.UTF8.GetBytes(password.Trim())));
        }
        catch (FormatException) { return false; }
    }
}
