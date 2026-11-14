using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Queries.GetLiveMediaTransportSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using ContractQri = ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Queries.LiveMediaTransportSettingsQri;
using ResponseQri = ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Queries.GetLiveMediaTransportSettings.LiveMediaTransportSettingsQri;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.LiveMediaTransportSettingsServices.Queries;

public class GetLiveMediaTransportSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ILiveMediaTransportSettingsQueryRepository repository)
    : QueryHandler<GetLiveMediaTransportSettingsQuery, ResponseQri>(outer)
{
    public override async Task<QueryResult<ResponseQri>> Handle(GetLiveMediaTransportSettingsQuery request)
    {
        ContractQri? row = null;
        try
        {
            row = await repository.GetCurrentAsync();
        }
        catch (Exception ex) when (ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase))
        {
            row = null;
        }

        return await ResultAsync(new ResponseQri
        {
            TransportMode = row?.TransportMode ?? "Mesh",
            LiveKitUrl = row?.LiveKitUrl,
            LiveKitApiKey = row?.LiveKitApiKey,
            HasLiveKitApiSecret = !string.IsNullOrWhiteSpace(row?.LiveKitApiSecretEncrypted),
            TurnUrl = row?.TurnUrl,
            TurnUsername = row?.TurnUsername,
            HasTurnPassword = !string.IsNullOrWhiteSpace(row?.TurnPasswordEncrypted),
            StunUrls = row?.StunUrls,
        });
    }
}
