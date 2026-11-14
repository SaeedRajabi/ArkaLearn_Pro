using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings;
using ArkaSoftwarePro.Src.Core.RequestResponse.GoogleAuthSettings.Queries.GetGoogleAuthSettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.GoogleAuthSettingsServices.Queries;

public class GetGoogleAuthSettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IGoogleAuthSettingsProvider provider)
    : QueryHandler<GetGoogleAuthSettingsQuery, GoogleAuthSettingsQri>(outer)
{
    public override async Task<QueryResult<GoogleAuthSettingsQri>> Handle(GetGoogleAuthSettingsQuery query)
    {
        var options = await provider.GetOptionsAsync();
        return await ResultAsync(new GoogleAuthSettingsQri
        {
            IsEnabled = options.IsEnabled,
            ClientId = options.ClientId,
            HasClientSecret = options.HasClientSecret,
            Configured = options.IsConfigured
        }, ApplicationServiceStatus.Ok);
    }
}
