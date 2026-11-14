using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.EncryptMediaAsset;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaAssetServices.Commands;

public class EncryptMediaAssetCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IMediaAssetCommandRepository mediaAssetRepository,
    IMediaEncryptionService encryptionService,
    IFileStorage fileStorage)
    : CommandHandler<EncryptMediaAssetCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(EncryptMediaAssetCommand command)
    {
        if (command.MediaAssetId <= 0 || string.IsNullOrWhiteSpace(command.PhysicalFilePath))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        if (!File.Exists(command.PhysicalFilePath))
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var asset = await mediaAssetRepository.GetActiveByIdAsync(command.MediaAssetId);
        if (asset is null)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        var contentKeyId = Guid.NewGuid().ToString("N");
        asset.MarkEncryptionPending(contentKeyId);
        await mediaAssetRepository.CommitAsync();

        string? tempEncryptedPath = null;
        try
        {
            var tempDir = Path.Combine(Path.GetTempPath(), "arkalearn-encrypt", asset.OwnerUserId.ToString());
            Directory.CreateDirectory(tempDir);
            var encryptedName = $"{Path.GetFileNameWithoutExtension(command.PhysicalFilePath)}_{contentKeyId[..8]}.arka";
            tempEncryptedPath = Path.Combine(tempDir, encryptedName);

            var result = await encryptionService.EncryptToArkaContainerAsync(
                command.MediaAssetId,
                command.PhysicalFilePath,
                tempDir,
                encryptedName,
                asset.MimeType,
                contentKeyId);

            var objectKey = $"drm/{asset.OwnerUserId}/{encryptedName}";
            await using (var fs = File.OpenRead(tempEncryptedPath))
            {
                var stored = await fileStorage.PutAsync(
                    objectKey,
                    fs,
                    "application/octet-stream",
                    FileAccessTier.Drm);
                objectKey = stored.ObjectKey;
            }

            asset.CompleteEncryption(
                objectKey,
                result.ContentKeyId,
                result.IvBase64,
                result.ChecksumSha256,
                result.Algorithm);

            await mediaAssetRepository.CommitAsync();

            try { File.Delete(command.PhysicalFilePath); } catch { /* best effort */ }
            try { if (tempEncryptedPath is not null) File.Delete(tempEncryptedPath); } catch { /* best effort */ }

            return await OkAsync(objectKey);
        }
        catch
        {
            asset.MarkEncryptionFailed();
            await mediaAssetRepository.CommitAsync();
            throw;
        }
    }
}
