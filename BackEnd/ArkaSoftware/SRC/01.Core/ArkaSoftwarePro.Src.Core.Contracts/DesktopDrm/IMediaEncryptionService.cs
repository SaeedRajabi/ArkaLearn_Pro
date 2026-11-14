namespace ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;

public sealed record MediaEncryptionResult(
    string EncryptedRelativeUrl,
    string ContentKeyId,
    string IvBase64,
    string ChecksumSha256,
    string Algorithm);

public interface IMediaEncryptionService
{
    Task<MediaEncryptionResult> EncryptFileAsync(
        long mediaAssetId,
        string sourcePhysicalPath,
        string destinationDirectory,
        string destinationFileName,
        CancellationToken cancellationToken = default);

    Task<MediaEncryptionResult> EncryptToArkaContainerAsync(
        long mediaAssetId,
        string sourcePhysicalPath,
        string destinationDirectory,
        string destinationFileName,
        string contentType,
        string? contentKeyId = null,
        CancellationToken cancellationToken = default);

    string WrapContentKeyForGrant(string contentKeyId, string grantToken);
}
