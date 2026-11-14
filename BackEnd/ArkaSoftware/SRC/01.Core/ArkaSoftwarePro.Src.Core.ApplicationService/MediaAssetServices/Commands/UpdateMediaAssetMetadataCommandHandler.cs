using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.UpdateMediaAssetMetadata;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaAssetServices.Commands;

public class UpdateMediaAssetMetadataCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IMediaAssetCommandRepository mediaAssetRepository)
    : CommandHandler<UpdateMediaAssetMetadataCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(UpdateMediaAssetMetadataCommand command)
    {
        var asset = await mediaAssetRepository.GetActiveByIdAsync(command.Id);
        if (asset == null)
            return await ResultAsync("Media asset not found.", ApplicationServiceStatus.NotFound);

        if (!command.IsAdmin && asset.OwnerUserId != command.RequestingUserId)
            return await ResultAsync("You are not allowed to update this media asset.", ApplicationServiceStatus.ValidationError);

        asset.UpdateMetadata(command.Title, command.AltText, command.Caption, command.Description);
        await mediaAssetRepository.CommitAsync();
        return await OkAsync("Media asset updated.");
    }
}
