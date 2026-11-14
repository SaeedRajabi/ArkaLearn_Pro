namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.LiveMediaTransportSettings;

public class LiveMediaTransportSettingsQueryModel
{
    public long Id { get; set; }
    public string TransportMode { get; set; } = "Mesh";
    public string? LiveKitUrl { get; set; }
    public string? LiveKitApiKey { get; set; }
    public string? LiveKitApiSecretEncrypted { get; set; }
    public string? TurnUrl { get; set; }
    public string? TurnUsername { get; set; }
    public string? TurnPasswordEncrypted { get; set; }
    public string? StunUrls { get; set; }
}
