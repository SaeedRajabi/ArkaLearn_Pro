using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.DeleteMediaAsset;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaAssetServices.Commands;

public class DeleteMediaAssetCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IMediaAssetCommandRepository mediaAssetRepository)
    : CommandHandler<DeleteMediaAssetCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(DeleteMediaAssetCommand command)
    {
        var asset = await mediaAssetRepository.GetActiveByIdAsync(command.Id);
        if (asset == null)
            return await ResultAsync("Media asset not found.", ApplicationServiceStatus.NotFound);

        if (!command.IsAdmin && asset.OwnerUserId != command.RequestingUserId)
            return await ResultAsync("You are not allowed to delete this media asset.", ApplicationServiceStatus.ValidationError);

        asset.SoftDelete();
        await mediaAssetRepository.CommitAsync();
        return await OkAsync("Media asset deleted.");
    }
}
