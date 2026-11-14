using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.SaveMediaAsset;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaAssetServices.Commands;

public class SaveMediaAssetCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IMediaAssetCommandRepository mediaAssetRepository)
    : CommandHandler<SaveMediaAssetCommand, long>(mafiaOuterServices)
{
    public override async Task<CommandResult<long>> Handle(SaveMediaAssetCommand command)
    {
        if (command.OwnerUserId <= 0)
            return await ResultAsync(0L, ApplicationServiceStatus.ValidationError);

        var asset = MediaAsset.Create(
            command.OwnerUserId,
            command.FileUrl,
            command.OriginalFileName,
            command.MimeType,
            command.FileSizeBytes,
            command.MediaType,
            command.Title,
            command.AltText,
            command.Caption,
            command.Description,
            command.Width,
            command.Height);

        await mediaAssetRepository.InsertAsync(asset);
        await mediaAssetRepository.CommitAsync();
        return await OkAsync(asset.Id);
    }
}
