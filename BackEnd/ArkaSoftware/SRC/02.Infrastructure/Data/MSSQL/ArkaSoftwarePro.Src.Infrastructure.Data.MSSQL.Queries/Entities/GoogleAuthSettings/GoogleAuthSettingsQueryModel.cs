namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.GoogleAuthSettings;

public class GoogleAuthSettingsQueryModel
{
    public long Id { get; set; }
    public bool IsEnabled { get; set; } = true;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}
