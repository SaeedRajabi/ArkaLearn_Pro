using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using LiveMediaTransportSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities.LiveMediaTransportSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia;

public sealed class LiveMediaTransportSettingsSnapshot
{
    public string TransportMode { get; init; } = LiveMediaTransportSettingsEntity.ModeMesh;
    public string? LiveKitUrl { get; init; }
    public string? LiveKitApiKey { get; init; }
    public string? LiveKitApiSecret { get; init; }

    public string? TurnUrl { get; init; }
    public string? TurnUsername { get; init; }
    public string? TurnPassword { get; init; }
    public string? StunUrls { get; init; }

    public bool IsLiveKit =>
        string.Equals(TransportMode, LiveMediaTransportSettingsEntity.ModeLiveKit, StringComparison.OrdinalIgnoreCase);

    public bool IsLiveKitReady =>
        IsLiveKit &&
        !string.IsNullOrWhiteSpace(LiveKitUrl) &&
        !string.IsNullOrWhiteSpace(LiveKitApiKey) &&
        !string.IsNullOrWhiteSpace(LiveKitApiSecret);

    /// <summary>True when TURN connectivity was fully configured by the admin.</summary>
    public bool IsTurnReady =>
        !string.IsNullOrWhiteSpace(TurnUrl) &&
        !string.IsNullOrWhiteSpace(TurnUsername) &&
        !string.IsNullOrWhiteSpace(TurnPassword);
}

public sealed class LiveMediaTransportSettingsLoader(
    ILiveMediaTransportSettingsCommandRepository repository,
    ISecretProtector secretProtector)
{
    public async Task<LiveMediaTransportSettingsSnapshot> LoadAsync(
        CancellationToken cancellationToken = default)
    {
        LiveMediaTransportSettingsEntity? row = null;
        try
        {
            row = await repository.GetCurrentAsync(cancellationToken);
        }
        catch
        {
            row = null;
        }

        if (row is null)
        {
            return new LiveMediaTransportSettingsSnapshot();
        }

        return new LiveMediaTransportSettingsSnapshot
        {
            TransportMode = LiveMediaTransportSettingsEntity.NormalizeMode(row.TransportMode),
            LiveKitUrl = row.LiveKitUrl,
            LiveKitApiKey = row.LiveKitApiKey,
            LiveKitApiSecret = secretProtector.Unprotect(row.LiveKitApiSecretEncrypted),
            TurnUrl = row.TurnUrl,
            TurnUsername = row.TurnUsername,
            TurnPassword = secretProtector.Unprotect(row.TurnPasswordEncrypted),
            StunUrls = row.StunUrls,
        };
    }
}
