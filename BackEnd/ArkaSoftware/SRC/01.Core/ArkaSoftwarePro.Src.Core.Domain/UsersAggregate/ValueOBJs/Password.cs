using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using System.Security.Cryptography;
using System.Text;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;

public class Password : BaseValueOBJs<Password>
{
    private const int Iterations = 600_000;
    private const string Prefix = "pbkdf2-sha256$";
    public string HashedPassword { get; private set; } = string.Empty;
    public string Salt { get; private set; } = string.Empty;
    private Password() { }
    private Password(string hash, string salt)
    {
        if (string.IsNullOrWhiteSpace(hash) || string.IsNullOrWhiteSpace(salt))
            throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(hash));
        HashedPassword = hash;
        Salt = salt;
    }
    public bool NeedsRehash => !HashedPassword.StartsWith(Prefix, StringComparison.Ordinal) ||
        !int.TryParse(HashedPassword.Split('$').ElementAtOrDefault(1), out var iterations) || iterations < Iterations;
    public static Password Create(string plainPassword)
    {
        ArgumentException.ThrowIfNullOrEmpty(plainPassword);
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(plainPassword), salt, Iterations, HashAlgorithmName.SHA256, 32);
        return new Password($"{Prefix}{Iterations}${Convert.ToBase64String(hash)}", Convert.ToBase64String(salt));
    }
    public static Password FromStored(string hash, string salt) => new(hash, salt);
    public bool Verify(string plainPassword)
    {
        if (string.IsNullOrEmpty(plainPassword)) return false;
        try
        {
            var salt = Convert.FromBase64String(Salt);
            if (salt.Length < 16 || salt.Length > 64) return false;
            byte[] expected;
            byte[] actual;
            if (HashedPassword.StartsWith(Prefix, StringComparison.Ordinal))
            {
                var parts = HashedPassword.Split('$');
                if (parts.Length != 3 || !int.TryParse(parts[1], out var iterations) || iterations < 10_000 || iterations > 2_000_000)
                    return false;
                expected = Convert.FromBase64String(parts[2]);
                actual = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(plainPassword), salt, iterations, HashAlgorithmName.SHA256, 32);
            }
            else
            {
                expected = Convert.FromBase64String(HashedPassword);
                var passwordBytes = Encoding.UTF8.GetBytes(plainPassword);
                var input = new byte[passwordBytes.Length + salt.Length];
                passwordBytes.CopyTo(input, 0);
                salt.CopyTo(input, passwordBytes.Length);
                actual = SHA256.HashData(input);
            }
            return expected.Length == 32 && CryptographicOperations.FixedTimeEquals(expected, actual);
        }
        catch (FormatException) { return false; }
    }
    public override string ToString() => HashedPassword;
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return HashedPassword;
        yield return Salt;
    }
}
