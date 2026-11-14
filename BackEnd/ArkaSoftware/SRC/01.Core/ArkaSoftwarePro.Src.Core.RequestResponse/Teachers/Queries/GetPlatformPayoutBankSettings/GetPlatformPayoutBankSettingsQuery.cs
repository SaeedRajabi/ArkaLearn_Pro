using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPlatformPayoutBankSettings;

public class GetPlatformPayoutBankSettingsQuery : IQuery<PlatformPayoutBankSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetPlatformPayoutBankSettings";
}

public class PlatformPayoutBankSettingsQri
{
    public string? PlatformPayoutSheba { get; set; }
    public string? PlatformPayoutCardNumber { get; set; }
    public string? ZarinPalPlatformBankAccountId { get; set; }
    public bool IsConfigured { get; set; }
}
