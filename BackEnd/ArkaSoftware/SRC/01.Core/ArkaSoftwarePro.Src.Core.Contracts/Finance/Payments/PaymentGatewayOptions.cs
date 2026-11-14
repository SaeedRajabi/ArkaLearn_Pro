namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments
{
    public class PaymentGatewayOptions
    {
        public const string SectionName = "PaymentGateway";

        public bool Enabled { get; set; }
        public string Provider { get; set; } = "IdPay";
        public string ApiBaseUrl { get; set; } = "https://api.idpay.ir/v1.1";
        public string ApiKey { get; set; } = string.Empty;

        /// <summary>
        /// شناسه پذیرنده: UUID زرین‌پال یا merchant زیبال. در صورت خالی بودن از ApiKey استفاده می‌شود.
        /// </summary>
        public string MerchantId { get; set; } = string.Empty;

        /// <summary>
        /// توکن Bearer برای API گرافیکی زرین‌پال (GraphQL).
        /// </summary>
        public string? AccessToken { get; set; }

        /// <summary>
        /// شناسه ترمینال زرین‌پال برای عملیات GraphQL.
        /// </summary>
        public string? TerminalId { get; set; }

        public bool UseSandbox { get; set; }
        public string PublicApiBaseUrl { get; set; } = string.Empty;
        public string ClientBaseUrl { get; set; } = string.Empty;
        public int AmountMultiplier { get; set; } = 10;
    }
}
