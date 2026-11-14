namespace ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings;

public interface IGoogleAuthSettingsProvider
{
    Task<GoogleAuthOptions> GetOptionsAsync(CancellationToken cancellationToken = default);
}

public sealed class GoogleAuthOptions
{
    public bool IsEnabled { get; init; } = true;
    public string ClientId { get; init; } = string.Empty;
    public string ClientSecret { get; init; } = string.Empty;
    public bool HasClientSecret { get; init; }

    public bool IsConfigured =>
        IsEnabled && !string.IsNullOrWhiteSpace(ClientId);
}
