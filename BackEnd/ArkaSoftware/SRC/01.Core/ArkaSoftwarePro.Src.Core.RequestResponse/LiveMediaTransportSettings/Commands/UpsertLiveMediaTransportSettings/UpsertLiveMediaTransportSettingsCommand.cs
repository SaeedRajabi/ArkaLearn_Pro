using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Commands.UpsertLiveMediaTransportSettings;

public class UpsertLiveMediaTransportSettingsCommand : ICommand<string>, IWebRequest
{
    /// <summary>Mesh or LiveKit.</summary>
    public string TransportMode { get; set; } = "Mesh";
    public string? LiveKitUrl { get; set; }
    public string? LiveKitApiKey { get; set; }
    /// <summary>Null = keep existing; empty = clear; otherwise new plaintext secret to encrypt.</summary>
    public string? LiveKitApiSecret { get; set; }

    /// <summary>Comma-separated TURN urls for the mesh (admin-managed media connectivity).</summary>
    public string? TurnUrl { get; set; }
    public string? TurnUsername { get; set; }
    /// <summary>Null = keep existing; empty = clear; otherwise new plaintext credential to encrypt.</summary>
    public string? TurnPassword { get; set; }
    /// <summary>Optional comma-separated STUN urls; empty = platform defaults.</summary>
    public string? StunUrls { get; set; }

    public string Path => "/api/Service/LiveMediaTransportSettings/Upsert";
}
