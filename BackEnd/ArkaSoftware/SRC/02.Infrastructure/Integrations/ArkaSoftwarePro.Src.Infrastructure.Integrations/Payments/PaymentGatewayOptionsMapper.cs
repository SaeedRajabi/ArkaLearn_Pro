using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using Framework.Src.Infrastructure.Payments.ZarinPal.Options;
using Framework.Src.Infrastructure.Payments.Zibal.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

internal static class PaymentGatewayOptionsMapper
{
    public static PaymentGatewayRuntimeOptions ToRuntimeOptions(PaymentGatewaySettingsSnapshot snapshot)
    {
        var active = ResolveActiveCredentials(snapshot);
        return new PaymentGatewayRuntimeOptions
        {
            Enabled = snapshot.Enabled,
            Provider = snapshot.ActiveProvider,
            ApiKey = active.ApiKey,
            MerchantId = active.MerchantId,
            AccessToken = active.AccessToken,
            TerminalId = active.TerminalId,
            UseSandbox = active.UseSandbox,
            PublicApiBaseUrl = snapshot.PublicApiBaseUrl,
            ClientBaseUrl = snapshot.ClientBaseUrl,
            AmountMultiplier = snapshot.AmountMultiplier,
        };
    }

    public static ZibalOptions ToZibalOptions(PaymentGatewaySettingsSnapshot snapshot)
    {
        var creds = snapshot.Zibal;
        return new ZibalOptions
        {
            Enabled = true,
            MerchantId = creds.MerchantId,
            ApiKey = creds.ApiKey,
            UseSandbox = creds.UseSandbox,
            AccessToken = creds.AccessToken,
        };
    }

    public static ZarinPalOptions ToZarinPalOptions(PaymentGatewaySettingsSnapshot snapshot)
    {
        var creds = snapshot.ZarinPal;
        return new ZarinPalOptions
        {
            Enabled = true,
            MerchantId = creds.MerchantId,
            ApiKey = creds.MerchantId,
            AccessToken = creds.AccessToken,
            TerminalId = creds.TerminalId,
            UseSandbox = creds.UseSandbox,
        };
    }

    private static PaymentGatewayProviderCredentials ResolveActiveCredentials(PaymentGatewaySettingsSnapshot snapshot)
    {
        if (PaymentGatewayProviderNormalizer.IsZarinPal(snapshot.ActiveProvider))
            return snapshot.ZarinPal;

        if (PaymentGatewayProviderNormalizer.IsZibal(snapshot.ActiveProvider))
            return snapshot.Zibal;

        return new PaymentGatewayProviderCredentials();
    }
}
