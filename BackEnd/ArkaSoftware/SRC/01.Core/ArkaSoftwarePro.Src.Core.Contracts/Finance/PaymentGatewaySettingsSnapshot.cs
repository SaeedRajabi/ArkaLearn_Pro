namespace ArkaSoftwarePro.Src.Core.Contracts.Finance;

public sealed class PaymentGatewayProviderCredentials
{
    public string MerchantId { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string? AccessToken { get; init; }
    public string? TerminalId { get; init; }
    public bool UseSandbox { get; init; }
}

public sealed class PaymentGatewaySettingsSnapshot
{
    public bool Enabled { get; init; }
    public string ActiveProvider { get; init; } = "Zibal";
    public PaymentGatewayProviderCredentials Zibal { get; init; } = new();
    public PaymentGatewayProviderCredentials ZarinPal { get; init; } = new();
    public string PublicApiBaseUrl { get; init; } = string.Empty;
    public string ClientBaseUrl { get; init; } = string.Empty;
    public int AmountMultiplier { get; init; } = 10;
}
