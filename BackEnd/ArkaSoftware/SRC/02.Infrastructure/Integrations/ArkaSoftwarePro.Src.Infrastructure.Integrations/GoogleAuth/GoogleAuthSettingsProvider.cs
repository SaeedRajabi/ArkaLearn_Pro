using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings;
using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.GoogleAuthSettingsRepositoryContracts.Commands;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.GoogleAuth;

public sealed class GoogleAuthSettingsProvider(
    IGoogleAuthSettingsCommandRepository repository,
    IConfiguration configuration) : IGoogleAuthSettingsProvider
{
    public async Task<GoogleAuthOptions> GetOptionsAsync(CancellationToken cancellationToken = default)
    {
        var db = await repository.GetCurrentAsync();
        var fallbackClientId = configuration["Authentication:Google:ClientId"] ?? string.Empty;
        var fallbackSecret = configuration["Authentication:Google:ClientSecret"] ?? string.Empty;

        if (db is null)
        {
            return new GoogleAuthOptions
            {
                IsEnabled = !string.IsNullOrWhiteSpace(fallbackClientId),
                ClientId = fallbackClientId.Trim(),
                ClientSecret = fallbackSecret,
                HasClientSecret = !string.IsNullOrWhiteSpace(fallbackSecret)
            };
        }

        var clientId = string.IsNullOrWhiteSpace(db.ClientId) ? fallbackClientId : db.ClientId;
        var clientSecret = string.IsNullOrWhiteSpace(db.ClientSecret) ? fallbackSecret : db.ClientSecret;

        return new GoogleAuthOptions
        {
            IsEnabled = db.IsEnabled,
            ClientId = clientId?.Trim() ?? string.Empty,
            ClientSecret = clientSecret ?? string.Empty,
            HasClientSecret = !string.IsNullOrWhiteSpace(clientSecret)
        };
    }
}
