using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;

public static class PaymentGatewayConfigurationRules
{
    public static bool TryEnsureConfigured(PaymentGatewayRuntimeOptions options, out string message)
    {
        if (!options.Enabled)
        {
            message = "The payment gateway is disabled.";
            return false;
        }

        if (PaymentGatewayProviderNormalizer.IsZibal(options.Provider))
        {
            if (!options.UseSandbox &&
                string.IsNullOrWhiteSpace(options.MerchantId) &&
                string.IsNullOrWhiteSpace(options.ApiKey))
            {
                message = "The Zibal merchant id is missing.";
                return false;
            }
        }
        else if (PaymentGatewayProviderNormalizer.IsZarinPal(options.Provider))
        {
            if (string.IsNullOrWhiteSpace(options.MerchantId) && string.IsNullOrWhiteSpace(options.ApiKey))
            {
                message = "The ZarinPal merchant id is missing.";
                return false;
            }
        }
        else if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            message = "The payment gateway API key is missing.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(options.PublicApiBaseUrl))
        {
            message = "The public API base URL is not configured.";
            return false;
        }

        if (string.IsNullOrWhiteSpace(options.ClientBaseUrl))
        {
            message = "The client website base URL is not configured.";
            return false;
        }

        if (options.AmountMultiplier <= 0)
        {
            message = "The payment amount multiplier is invalid.";
            return false;
        }

        message = string.Empty;
        return true;
    }
}
