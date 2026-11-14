namespace Framework.Src.Infrastructure.Payments.ZarinPal.Options;

/// <summary>
/// تنظیمات اتصال به زرین‌پال (درگاه REST و API گرافیکی GraphQL).
/// </summary>
public sealed class ZarinPalOptions
{
    /// <summary>
    /// نام بخش پیکربندی در appsettings.
    /// </summary>
    public const string SectionName = "PaymentGateway";

    /// <summary>
    /// فعال بودن درگاه پرداخت.
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// شناسه پذیرنده (Merchant ID) — رشته ۳۶ کاراکتری UUID.
    /// در صورت خالی بودن از <see cref="ApiKey"/> استفاده می‌شود.
    /// </summary>
    public string MerchantId { get; set; } = string.Empty;

    /// <summary>
    /// کلید API (برای سازگاری با تنظیمات قبلی؛ در زرین‌پال معادل MerchantId است).
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// توکن دسترسی Bearer برای API گرافیکی پنل (GraphQL).
    /// </summary>
    public string? AccessToken { get; set; }

    /// <summary>
    /// شناسه ترمینال (Terminal ID) برای عملیات GraphQL مانند Session و Reconciliation.
    /// </summary>
    public string? TerminalId { get; set; }

    /// <summary>
    /// استفاده از محیط سندباکس (تست).
    /// </summary>
    public bool UseSandbox { get; set; }

    /// <summary>
    /// آدرس پایه API گرافیکی. پیش‌فرض: https://next.zarinpal.com/api/v4/graphql
    /// </summary>
    public string GraphQlApiUrl { get; set; } = "https://next.zarinpal.com/api/v4/graphql";

    /// <summary>
    /// آدرس پایه REST درگاه پرداخت (بدون اسلش انتهایی).
    /// </summary>
    public string RestApiBaseUrl { get; set; } = "https://api.zarinpal.com/pg/v4";

    /// <summary>
    /// آدرس پایه صفحه پرداخت کاربر (StartPay).
    /// </summary>
    public string PaymentGatewayBaseUrl { get; set; } = "https://www.zarinpal.com/pg/StartPay";

    /// <summary>
    /// شناسه پذیرنده مؤثر را برمی‌گرداند.
    /// </summary>
    public string ResolveMerchantId()
        => !string.IsNullOrWhiteSpace(MerchantId) ? MerchantId.Trim() : ApiKey.Trim();

    /// <summary>
    /// آدرس REST با توجه به سندباکس.
    /// </summary>
    public string ResolveRestApiBaseUrl()
        => UseSandbox
            ? "https://sandbox.zarinpal.com/pg/v4"
            : RestApiBaseUrl.Trim().TrimEnd('/');

    /// <summary>
    /// آدرس درگاه پرداخت با توجه به سندباکس.
    /// </summary>
    public string ResolvePaymentGatewayBaseUrl()
        => UseSandbox
            ? "https://sandbox.zarinpal.com/pg/StartPay"
            : PaymentGatewayBaseUrl.Trim().TrimEnd('/');
}
