using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.RejectMediaAsset;

using Framework.Src.Core.ApplicationService.Commands;

using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Utilities.OutService.Services;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaAssetServices.Commands;



public class RejectMediaAssetCommandHandler(

    ArkaSoftwareCMPOutServices mafiaOuterServices,

    IMediaAssetCommandRepository mediaAssetRepository)

    : CommandHandler<RejectMediaAssetCommand, string>(mafiaOuterServices)

{

    public override async Task<CommandResult<string>> Handle(RejectMediaAssetCommand command)

    {

        if (!command.IsAdmin)

            return await ResultAsync("Only administrators can reject media assets.", ApplicationServiceStatus.ValidationError);



        if (string.IsNullOrWhiteSpace(command.Reason))

            return await ResultAsync("Rejection reason is required.", ApplicationServiceStatus.ValidationError);



        var asset = await mediaAssetRepository.GetActiveByIdAsync(command.Id);

        if (asset == null)

            return await ResultAsync("Media asset not found.", ApplicationServiceStatus.NotFound);



        asset.Reject(command.Reason);

        await mediaAssetRepository.CommitAsync();

        return await OkAsync("Media asset rejected.");

    }

}

