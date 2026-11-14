using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.GoogleAuthSettings.Queries.GetGoogleAuthSettings;

public class GetGoogleAuthSettingsQuery : IQuery<GoogleAuthSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/GoogleAuthSettings/Get";
}

public class GoogleAuthSettingsQri
{
    public bool IsEnabled { get; set; } = true;
    public string ClientId { get; set; } = string.Empty;
    public bool HasClientSecret { get; set; }
    public bool Configured { get; set; }
}
