namespace ArkaSoftwarePro.Src.Core.Contracts.Security;

/// <summary>Encrypts and decrypts sensitive values stored in the database.</summary>
public interface ISecretProtector
{
    bool HasConfiguredMasterKey { get; }

    string Protect(string plainText);

    string? Unprotect(string? protectedBase64);
}
