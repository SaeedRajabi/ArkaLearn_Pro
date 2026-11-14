namespace ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;

public interface IDatabaseConnectionSettingsCache
{
    DatabaseConnectionSettingsSnapshot GetSnapshot();
    Task RefreshAsync(CancellationToken cancellationToken = default);
    Task EnsureLoadedAsync(CancellationToken cancellationToken = default);
}
