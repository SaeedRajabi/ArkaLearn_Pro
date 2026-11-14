using System.Security.Cryptography;
using System.Text;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using Xunit;

namespace ArkaSoftwarePro.Tests.Domain;

public class PasswordSecurityTests
{
    [Fact]
    public void NewPasswordsUseRandomSaltAndRejectIncorrectValues()
    {
        var first = Password.Create("a sufficiently long password");
        var second = Password.Create("a sufficiently long password");
        Assert.StartsWith("pbkdf2-sha256$", first.HashedPassword);
        Assert.NotEqual(first.Salt, second.Salt);
        Assert.True(first.Verify("a sufficiently long password"));
        Assert.False(first.Verify("wrong"));
        Assert.False(first.NeedsRehash);
    }
    [Fact]
    public void LegacySha256PasswordsRemainValidAndAreMarkedForUpgrade()
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = SHA256.HashData([.. Encoding.UTF8.GetBytes("legacy password"), .. salt]);
        var password = Password.FromStored(Convert.ToBase64String(hash), Convert.ToBase64String(salt));
        Assert.True(password.Verify("legacy password"));
        Assert.False(password.Verify("wrong"));
        Assert.True(password.NeedsRehash);
    }
    [Theory]
    [InlineData("invalid", "not-base64")]
    [InlineData("pbkdf2-sha256$999999999$abc", "MDEyMzQ1Njc4OWFiY2RlZg==")]
    [InlineData("pbkdf2-sha256$600000$invalid", "MDEyMzQ1Njc4OWFiY2RlZg==")]
    public void InvalidStoredValuesDoNotCrashLogin(string hash, string salt) =>
        Assert.False(Password.FromStored(hash, salt).Verify("password"));
}
