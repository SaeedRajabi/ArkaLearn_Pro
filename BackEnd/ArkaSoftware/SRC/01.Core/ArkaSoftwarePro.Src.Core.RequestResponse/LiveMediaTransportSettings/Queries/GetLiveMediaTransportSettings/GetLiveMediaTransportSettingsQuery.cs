using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Queries.GetLiveMediaTransportSettings;

public class GetLiveMediaTransportSettingsQuery : IQuery<LiveMediaTransportSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/LiveMediaTransportSettings/Get";
}

public class LiveMediaTransportSettingsQri
{
    public string TransportMode { get; set; } = "Mesh";
    public string? LiveKitUrl { get; set; }
    public string? LiveKitApiKey { get; set; }
    public bool HasLiveKitApiSecret { get; set; }
    public string? TurnUrl { get; set; }
    public string? TurnUsername { get; set; }
    public bool HasTurnPassword { get; set; }
    public string? StunUrls { get; set; }
}
