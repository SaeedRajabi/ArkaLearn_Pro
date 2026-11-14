using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Queries;

public sealed class LiveMediaTransportSettingsQri
{
    public string TransportMode { get; set; } = "Mesh";
    public string? LiveKitUrl { get; set; }
    public string? LiveKitApiKey { get; set; }
    public string? LiveKitApiSecretEncrypted { get; set; }
    public string? TurnUrl { get; set; }
    public string? TurnUsername { get; set; }
    public string? TurnPasswordEncrypted { get; set; }
    public string? StunUrls { get; set; }
}

public interface ILiveMediaTransportSettingsQueryRepository : IQueryRepository
{
    Task<LiveMediaTransportSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
