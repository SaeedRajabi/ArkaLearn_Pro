namespace Framework.Src.Infrastructure.Payments.Zibal.Options;

/// <summary>
/// تنظیمات اتصال به درگاه پرداخت و API پلتفرم زیبال.
/// </summary>
public sealed class ZibalOptions
{
    public const string SectionName = "PaymentGateway";

    public bool Enabled { get; set; }
    public string MerchantId { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public bool UseSandbox { get; set; }
    public string GatewayBaseUrl { get; set; } = "https://gateway.zibal.ir";
    public string PlatformApiBaseUrl { get; set; } = "https://api.zibal.ir";
    public string? AccessToken { get; set; }

    public string ResolveMerchantId()
    {
        if (UseSandbox)
            return "zibal";

        return !string.IsNullOrWhiteSpace(MerchantId)
            ? MerchantId.Trim()
            : ApiKey.Trim();
    }

    public string ResolveGatewayBaseUrl() => GatewayBaseUrl.Trim().TrimEnd('/');

    public string ResolvePlatformApiBaseUrl() => PlatformApiBaseUrl.Trim().TrimEnd('/');

    public string? ResolveAccessToken()
        => string.IsNullOrWhiteSpace(AccessToken) ? null : AccessToken.Trim();
}
