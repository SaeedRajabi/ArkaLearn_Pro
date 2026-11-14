using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using System.Security.Cryptography;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.DesktopDrm;

public sealed class ContentKeyVault(
    IDesktopDrmCommandRepository drmRepository,
    IConfiguration configuration) : IContentKeyVault
{
    public async Task<string> StoreKeyAsync(long mediaAssetId, byte[] contentKey, CancellationToken cancellationToken = default)
    {
        var keyId = Guid.NewGuid().ToString("N");
        await StoreKeyWithIdAsync(keyId, mediaAssetId, contentKey, cancellationToken);
        return keyId;
    }

    public async Task StoreKeyWithIdAsync(
        string contentKeyId,
        long mediaAssetId,
        byte[] contentKey,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(contentKeyId))
            throw new ArgumentException("Content key id is required.", nameof(contentKeyId));

        var protectedMaterial = Convert.ToBase64String(Protect(contentKey));
        var entity = MediaContentKey.Create(contentKeyId.Trim(), mediaAssetId, protectedMaterial);
        await drmRepository.InsertContentKeyAsync(entity, cancellationToken);
        await drmRepository.CommitAsync();
    }

    public async Task<byte[]?> UnprotectKeyAsync(string contentKeyId, CancellationToken cancellationToken = default)
    {
        var row = await drmRepository.GetContentKeyAsync(contentKeyId, cancellationToken);
        if (row is null) return null;
        return Unprotect(row.ProtectedKeyMaterial);
    }

    private byte[] Protect(byte[] plain) => SecretCipher.Protect(plain, GetMasterKey());

    private byte[] Unprotect(string protectedBase64) => SecretCipher.Unprotect(
        Convert.FromBase64String(protectedBase64), GetMasterKey(),
        SecretCipher.PreviousKeys(configuration, "DesktopDrm"));

    private byte[] GetMasterKey() => SecretCipher.GetKey(configuration, "DesktopDrm", "ARKALEARN_DRM_MASTER_KEY");
}
