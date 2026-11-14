using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.GoogleAuthSettings.Commands.UpsertGoogleAuthSettings;

public class UpsertGoogleAuthSettingsCommand : ICommand<string>, IWebRequest
{
    public bool IsEnabled { get; set; } = true;
    public string ClientId { get; set; } = string.Empty;
    public string? ClientSecret { get; set; }
    public string Path => "/api/Service/GoogleAuthSettings/Upsert";
}
