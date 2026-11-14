using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities;

/// <summary>Singleton platform setting: Mesh WebRTC vs LiveKit SFU for online rooms.</summary>
public class LiveMediaTransportSettings : AggregateRoot
{
    public const string ModeMesh = "Mesh";
    public const string ModeLiveKit = "LiveKit";

    public string TransportMode { get; private set; } = ModeMesh;
    public string? LiveKitUrl { get; private set; }
    public string? LiveKitApiKey { get; private set; }
    public string? LiveKitApiSecretEncrypted { get; private set; }

    /// <summary>Comma-separated TURN urls (e.g. turn:host:3478,turns:host:5349). Required for media across NATs.</summary>
    public string? TurnUrl { get; private set; }
    public string? TurnUsername { get; private set; }
    public string? TurnPasswordEncrypted { get; private set; }
    /// <summary>Optional comma-separated STUN urls; public defaults apply when empty.</summary>
    public string? StunUrls { get; private set; }

    private LiveMediaTransportSettings()
    {
    }

    public LiveMediaTransportSettings(
        string transportMode,
        string? liveKitUrl,
        string? liveKitApiKey,
        string? liveKitApiSecretEncrypted,
        string? turnUrl = null,
        string? turnUsername = null,
        string? turnPasswordEncrypted = null,
        string? stunUrls = null)
    {
        Update(transportMode, liveKitUrl, liveKitApiKey, liveKitApiSecretEncrypted, turnUrl, turnUsername, turnPasswordEncrypted, stunUrls);
    }

    public void Update(
        string transportMode,
        string? liveKitUrl,
        string? liveKitApiKey,
        string? liveKitApiSecretEncrypted,
        string? turnUrl = null,
        string? turnUsername = null,
        string? turnPasswordEncrypted = null,
        string? stunUrls = null)
    {
        TransportMode = NormalizeMode(transportMode);
        LiveKitUrl = string.IsNullOrWhiteSpace(liveKitUrl) ? null : liveKitUrl.Trim();
        LiveKitApiKey = string.IsNullOrWhiteSpace(liveKitApiKey) ? null : liveKitApiKey.Trim();
        LiveKitApiSecretEncrypted = string.IsNullOrWhiteSpace(liveKitApiSecretEncrypted)
            ? null
            : liveKitApiSecretEncrypted;
        TurnUrl = string.IsNullOrWhiteSpace(turnUrl) ? null : turnUrl.Trim();
        TurnUsername = string.IsNullOrWhiteSpace(turnUsername) ? null : turnUsername.Trim();
        TurnPasswordEncrypted = string.IsNullOrWhiteSpace(turnPasswordEncrypted)
            ? null
            : turnPasswordEncrypted;
        StunUrls = string.IsNullOrWhiteSpace(stunUrls) ? null : stunUrls.Trim();
    }

    public bool IsTurnReady =>
        !string.IsNullOrWhiteSpace(TurnUrl) &&
        !string.IsNullOrWhiteSpace(TurnUsername) &&
        !string.IsNullOrWhiteSpace(TurnPasswordEncrypted);

    public static string NormalizeMode(string? mode)
    {
        var value = (mode ?? string.Empty).Trim();
        return string.Equals(value, ModeLiveKit, StringComparison.OrdinalIgnoreCase)
            ? ModeLiveKit
            : ModeMesh;
    }

    public bool IsLiveKit => string.Equals(TransportMode, ModeLiveKit, StringComparison.OrdinalIgnoreCase);
}
