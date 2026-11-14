using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.RequestResponse.MediaAssets.Commands.DismissMediaRejection;

using Framework.Src.Core.ApplicationService.Commands;

using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Utilities.OutService.Services;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaAssetServices.Commands;



public class DismissMediaRejectionCommandHandler(

    ArkaSoftwareCMPOutServices mafiaOuterServices,

    IMediaAssetCommandRepository mediaAssetRepository)

    : CommandHandler<DismissMediaRejectionCommand, string>(mafiaOuterServices)

{

    public override async Task<CommandResult<string>> Handle(DismissMediaRejectionCommand command)

    {

        var asset = await mediaAssetRepository.GetActiveByIdAsync(command.Id);

        if (asset == null)

            return await ResultAsync("Media asset not found.", ApplicationServiceStatus.NotFound);



        if (asset.OwnerUserId != command.RequestingUserId)

            return await ResultAsync("You are not allowed to dismiss this notice.", ApplicationServiceStatus.ValidationError);



        asset.DismissRejectionNotice();

        await mediaAssetRepository.CommitAsync();

        return await OkAsync("Rejection notice dismissed.");

    }

}

