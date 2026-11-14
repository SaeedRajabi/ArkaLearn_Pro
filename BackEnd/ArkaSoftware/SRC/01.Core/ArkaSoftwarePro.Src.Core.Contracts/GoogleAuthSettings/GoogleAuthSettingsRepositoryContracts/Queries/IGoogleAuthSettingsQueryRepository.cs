namespace ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.GoogleAuthSettingsRepositoryContracts.Queries;

public interface IGoogleAuthSettingsQueryRepository
{
    Task<GoogleAuthSettingsQri?> GetCurrentAsync();
}

public sealed class GoogleAuthSettingsQri
{
    public bool IsEnabled { get; set; } = true;
    public string ClientId { get; set; } = string.Empty;
    public bool HasClientSecret { get; set; }
}
