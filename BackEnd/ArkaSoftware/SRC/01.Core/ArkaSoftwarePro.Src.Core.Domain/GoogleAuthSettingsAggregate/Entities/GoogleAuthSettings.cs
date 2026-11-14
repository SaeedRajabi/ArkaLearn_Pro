using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.GoogleAuthSettingsAggregate.Entities;

public class GoogleAuthSettings : AggregateRoot
{
    public bool IsEnabled { get; private set; } = true;
    public string ClientId { get; private set; } = string.Empty;
    public string ClientSecret { get; private set; } = string.Empty;

    private GoogleAuthSettings()
    {
    }

    public GoogleAuthSettings(bool isEnabled, string clientId, string clientSecret)
    {
        Update(isEnabled, clientId, clientSecret);
    }

    public void Update(bool isEnabled, string clientId, string clientSecret)
    {
        IsEnabled = isEnabled;
        ClientId = clientId?.Trim() ?? string.Empty;
        ClientSecret = clientSecret ?? string.Empty;
    }

    public bool IsConfigured =>
        IsEnabled
        && !string.IsNullOrWhiteSpace(ClientId);
}
