using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

/// <summary>Singleton platform finance settings.</summary>
public class PlatformFinanceSettings : Entity
{
    public decimal IncomeTaxPercent { get; private set; } = 5m;
    public int PayoutCooldownHours { get; private set; } = 24;
    public decimal PlatformFeePercent { get; private set; } = 0m;
    public long TotalCentralBalanceToman { get; private set; }
    public string? PlatformPayoutSheba { get; private set; }
    public string? PlatformPayoutCardNumber { get; private set; }
    public string? ZarinPalPlatformBankAccountId { get; private set; }
    public string PaymentGatewayProvider { get; private set; } = "Zibal";
    public bool PaymentGatewayEnabled { get; private set; } = true;
    public string? ZibalMerchantIdEncrypted { get; private set; }
    public string? ZibalApiKeyEncrypted { get; private set; }
    public string? ZibalAccessTokenEncrypted { get; private set; }
    public bool ZibalUseSandbox { get; private set; }
    public string? ZarinPalMerchantIdEncrypted { get; private set; }
    public string? ZarinPalAccessTokenEncrypted { get; private set; }
    public string? ZarinPalTerminalIdEncrypted { get; private set; }
    public bool ZarinPalUseSandbox { get; private set; }

    private PlatformFinanceSettings() { }

    public static PlatformFinanceSettings CreateDefault() => new();

    public void Update(decimal incomeTaxPercent, int payoutCooldownHours, decimal platformFeePercent)
    {
        IncomeTaxPercent = incomeTaxPercent >= 0 ? incomeTaxPercent : 5m;
        PayoutCooldownHours = payoutCooldownHours > 0 ? payoutCooldownHours : 24;
        PlatformFeePercent = platformFeePercent >= 0 ? platformFeePercent : 0m;
    }

    public void UpdatePlatformPayoutBankSettings(string? sheba, string? cardNumber, string? zarinPalPlatformBankAccountId)
    {
        PlatformPayoutSheba = string.IsNullOrWhiteSpace(sheba) ? null : sheba.Trim().ToUpperInvariant();
        PlatformPayoutCardNumber = string.IsNullOrWhiteSpace(cardNumber) ? null : cardNumber.Trim();
        ZarinPalPlatformBankAccountId = string.IsNullOrWhiteSpace(zarinPalPlatformBankAccountId)
            ? null
            : zarinPalPlatformBankAccountId.Trim();
    }

    public void UpdatePaymentGatewaySettings(string provider, bool enabled)
    {
        var normalized = (provider ?? string.Empty).Trim();
        if (string.Equals(normalized, "zipal", StringComparison.OrdinalIgnoreCase))
            normalized = "Zibal";

        PaymentGatewayProvider = normalized switch
        {
            "ZarinPal" => "ZarinPal",
            "Zibal" => "Zibal",
            "IdPay" => "IdPay",
            _ => "Zibal"
        };
        PaymentGatewayEnabled = enabled;
    }

    public void UpdateZibalCredentials(
        string? merchantIdEncrypted,
        string? apiKeyEncrypted,
        string? accessTokenEncrypted,
        bool useSandbox)
    {
        if (merchantIdEncrypted != null)
            ZibalMerchantIdEncrypted = string.IsNullOrWhiteSpace(merchantIdEncrypted) ? null : merchantIdEncrypted;
        if (apiKeyEncrypted != null)
            ZibalApiKeyEncrypted = string.IsNullOrWhiteSpace(apiKeyEncrypted) ? null : apiKeyEncrypted;
        if (accessTokenEncrypted != null)
            ZibalAccessTokenEncrypted = string.IsNullOrWhiteSpace(accessTokenEncrypted) ? null : accessTokenEncrypted;
        ZibalUseSandbox = useSandbox;
    }

    public void UpdateZarinPalCredentials(
        string? merchantIdEncrypted,
        string? accessTokenEncrypted,
        string? terminalIdEncrypted,
        bool useSandbox)
    {
        if (merchantIdEncrypted != null)
            ZarinPalMerchantIdEncrypted = string.IsNullOrWhiteSpace(merchantIdEncrypted) ? null : merchantIdEncrypted;
        if (accessTokenEncrypted != null)
            ZarinPalAccessTokenEncrypted = string.IsNullOrWhiteSpace(accessTokenEncrypted) ? null : accessTokenEncrypted;
        if (terminalIdEncrypted != null)
            ZarinPalTerminalIdEncrypted = string.IsNullOrWhiteSpace(terminalIdEncrypted) ? null : terminalIdEncrypted;
        ZarinPalUseSandbox = useSandbox;
    }

    public bool HasZibalCredentialsConfigured()
        => ZibalUseSandbox
           || !string.IsNullOrWhiteSpace(ZibalMerchantIdEncrypted)
           || !string.IsNullOrWhiteSpace(ZibalApiKeyEncrypted);

    public bool HasZarinPalCredentialsConfigured()
        => !string.IsNullOrWhiteSpace(ZarinPalMerchantIdEncrypted);

    public bool IsPayoutGatewayConfigured()
        => !string.IsNullOrWhiteSpace(PlatformPayoutSheba) && !string.IsNullOrWhiteSpace(PlatformPayoutCardNumber);

    public void CreditCentralTreasury(long grossToman, long taxToman, long platformFeeToman, long netToTeacherToman)
    {
        TotalCentralBalanceToman += grossToman;
    }

    public void DebitPayout(long amountToman)
    {
        if (amountToman > 0)
            TotalCentralBalanceToman = Math.Max(0, TotalCentralBalanceToman - amountToman);
    }

    public void CreditPayoutReversal(long amountToman)
    {
        if (amountToman > 0)
            TotalCentralBalanceToman += amountToman;
    }
}
