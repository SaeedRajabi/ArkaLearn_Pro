using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePlatformPayoutBankSettings;

public class SavePlatformPayoutBankSettingsCommand : ICommand<string>, IWebRequest
{
    public string? PlatformPayoutSheba { get; set; }
    public string? PlatformPayoutCardNumber { get; set; }
    public string? ZarinPalPlatformBankAccountId { get; set; }
    public string Path => "/api/Service/Teacher/SavePlatformPayoutBankSettings";
}
