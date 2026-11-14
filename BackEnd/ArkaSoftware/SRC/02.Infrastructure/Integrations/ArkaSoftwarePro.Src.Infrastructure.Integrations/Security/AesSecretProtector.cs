using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.Security;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;

public sealed class AesSecretProtector(IConfiguration configuration) : ISecretProtector
{
    public bool HasConfiguredMasterKey
    {
        get
        {
            try { _ = Key(); return true; }
            catch (InvalidOperationException) { return false; }
        }
    }
    public string Protect(string plainText) => string.IsNullOrEmpty(plainText) ? string.Empty :
        Convert.ToBase64String(SecretCipher.Protect(Encoding.UTF8.GetBytes(plainText), Key()));

    public string? Unprotect(string? protectedBase64) => string.IsNullOrWhiteSpace(protectedBase64) ? null :
        Encoding.UTF8.GetString(SecretCipher.Unprotect(Convert.FromBase64String(protectedBase64), Key(),
            SecretCipher.PreviousKeys(configuration, "PaymentGateway")));

    private byte[] Key() => SecretCipher.GetKey(configuration, "PaymentGateway", "ARKALEARN_PAYMENT_SECRETS_KEY");
}
