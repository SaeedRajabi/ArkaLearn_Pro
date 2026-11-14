using System.Security.Cryptography;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class SecretCipherTests
{
    [Fact]
    public void MissingOrInvalidMasterKeyFailsClosed()
    {
        var empty = new ConfigurationBuilder().Build();
        Assert.Throws<InvalidOperationException>(() => SecretCipher.GetKey(empty, "TestKey", "ARKALEARN_TEST_UNSET_KEY"));
        var invalid = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["TestKey:MasterKeyBase64"] = "bad-key" }).Build();
        Assert.Throws<InvalidOperationException>(() => SecretCipher.GetKey(invalid, "TestKey", "ARKALEARN_TEST_UNSET_KEY"));
    }
    [Fact]
    public void NewValuesAreAuthenticatedAndCannotBeModified()
    {
        var key = RandomNumberGenerator.GetBytes(32);
        byte[] plain = [1, 2, 3, 4];
        var encrypted = SecretCipher.Protect(plain, key);
        Assert.Equal(plain, SecretCipher.Unprotect(encrypted, key));
        encrypted[^1] ^= 1;
        Assert.Throws<CryptographicException>(() => SecretCipher.Unprotect(encrypted, key));
    }
    [Fact]
    public void ExplicitPreviousKeyCanReadLegacyCbcValue()
    {
        var oldKey = RandomNumberGenerator.GetBytes(32);
        var newKey = RandomNumberGenerator.GetBytes(32);
        using var aes = Aes.Create();
        aes.Key = oldKey;
        aes.GenerateIV();
        byte[] plain = [1, 2, 3, 4];
        using var encryptor = aes.CreateEncryptor();
        byte[] payload = [.. aes.IV, .. encryptor.TransformFinalBlock(plain, 0, plain.Length)];
        Assert.Equal(plain, SecretCipher.Unprotect(payload, newKey, [oldKey]));
    }
}
