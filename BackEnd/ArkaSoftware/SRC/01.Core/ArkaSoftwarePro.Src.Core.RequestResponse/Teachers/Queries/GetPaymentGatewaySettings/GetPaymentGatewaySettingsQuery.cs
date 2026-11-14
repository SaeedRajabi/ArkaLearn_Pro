using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPaymentGatewaySettings;

public class GetPaymentGatewaySettingsQuery : IQuery<PaymentGatewaySettingsQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetPaymentGatewaySettings";
}

public class PaymentGatewaySettingsQri
{
    public string Provider { get; set; } = "Zibal";
    public bool Enabled { get; set; } = true;
    public IReadOnlyList<string> AvailableProviders { get; set; } = ["ZarinPal", "Zibal"];
    public PaymentGatewayProviderSettingsQri Zibal { get; set; } = new();
    public PaymentGatewayProviderSettingsQri ZarinPal { get; set; } = new();
}

public sealed class PaymentGatewayProviderSettingsQri
{
    public bool IsConfigured { get; set; }
    public bool UseSandbox { get; set; }
    public bool HasMerchantId { get; set; }
    public bool HasApiKey { get; set; }
    public bool HasAccessToken { get; set; }
    public bool HasTerminalId { get; set; }
    public string? MerchantIdHint { get; set; }
}
