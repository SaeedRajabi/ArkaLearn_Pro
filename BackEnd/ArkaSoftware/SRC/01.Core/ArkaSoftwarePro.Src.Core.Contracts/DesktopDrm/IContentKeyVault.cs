namespace ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;

public interface IContentKeyVault
{
    Task<string> StoreKeyAsync(long mediaAssetId, byte[] contentKey, CancellationToken cancellationToken = default);

    Task StoreKeyWithIdAsync(
        string contentKeyId,
        long mediaAssetId,
        byte[] contentKey,
        CancellationToken cancellationToken = default);

    Task<byte[]?> UnprotectKeyAsync(string contentKeyId, CancellationToken cancellationToken = default);
}
