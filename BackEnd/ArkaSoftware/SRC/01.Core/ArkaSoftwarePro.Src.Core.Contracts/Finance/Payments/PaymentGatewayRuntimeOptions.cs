namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;

/// <summary>
/// تنظیمات ادغام‌شده درگاه پرداخت (appsettings + override دیتابیس).
/// </summary>
public sealed class PaymentGatewayRuntimeOptions
{
    public bool Enabled { get; init; }
    public string Provider { get; init; } = "IdPay";
    public string ApiBaseUrl { get; init; } = "https://api.idpay.ir/v1.1";
    public string ApiKey { get; init; } = string.Empty;
    public string MerchantId { get; init; } = string.Empty;
    public string? AccessToken { get; init; }
    public string? TerminalId { get; init; }
    public bool UseSandbox { get; init; }
    public string PublicApiBaseUrl { get; init; } = string.Empty;
    public string ClientBaseUrl { get; init; } = string.Empty;
    public int AmountMultiplier { get; init; } = 10;
}
