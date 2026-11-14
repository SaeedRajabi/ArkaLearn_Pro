using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePaymentGatewaySettings;

public class SavePaymentGatewaySettingsCommand : ICommand<string>, IWebRequest
{
    public string Provider { get; set; } = "Zibal";
    public bool Enabled { get; set; } = true;
    public PaymentGatewayCredentialsInput? Zibal { get; set; }
    public PaymentGatewayCredentialsInput? ZarinPal { get; set; }
    public string Path => "/api/Service/Teacher/SavePaymentGatewaySettings";
}

public sealed class PaymentGatewayCredentialsInput
{
    public string? MerchantId { get; set; }
    public string? ApiKey { get; set; }
    public string? AccessToken { get; set; }
    public string? TerminalId { get; set; }
    public bool? UseSandbox { get; set; }
}
