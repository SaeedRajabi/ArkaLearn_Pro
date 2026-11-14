using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class PaymentGatewaySettingsLoader(
    ITeacherFinanceCommandRepository financeCommandRepository,
    ISecretProtector secretProtector,
    IOptions<PaymentGatewayOptions> paymentOptions)
{
    public async Task<PaymentGatewaySettingsSnapshot> LoadAsync(CancellationToken cancellationToken = default)
    {
        var settings = await financeCommandRepository.GetOrCreateSettingsAsync(cancellationToken);
        var baseOptions = paymentOptions.Value;

        return new PaymentGatewaySettingsSnapshot
        {
            Enabled = settings.PaymentGatewayEnabled,
            ActiveProvider = PaymentGatewayProviderNormalizer.Normalize(settings.PaymentGatewayProvider),
            Zibal = BuildZibalCredentials(settings),
            ZarinPal = BuildZarinPalCredentials(settings),
            PublicApiBaseUrl = baseOptions.PublicApiBaseUrl,
            ClientBaseUrl = baseOptions.ClientBaseUrl,
            AmountMultiplier = baseOptions.AmountMultiplier > 0 ? baseOptions.AmountMultiplier : 10,
        };
    }

    private PaymentGatewayProviderCredentials BuildZibalCredentials(PlatformFinanceSettings settings)
    {
        var merchantId = secretProtector.Unprotect(settings.ZibalMerchantIdEncrypted) ?? string.Empty;
        var apiKey = secretProtector.Unprotect(settings.ZibalApiKeyEncrypted) ?? string.Empty;

        return new PaymentGatewayProviderCredentials
        {
            MerchantId = merchantId,
            ApiKey = apiKey,
            AccessToken = secretProtector.Unprotect(settings.ZibalAccessTokenEncrypted),
            TerminalId = null,
            UseSandbox = settings.ZibalUseSandbox,
        };
    }

    private PaymentGatewayProviderCredentials BuildZarinPalCredentials(PlatformFinanceSettings settings)
    {
        return new PaymentGatewayProviderCredentials
        {
            MerchantId = secretProtector.Unprotect(settings.ZarinPalMerchantIdEncrypted) ?? string.Empty,
            ApiKey = string.Empty,
            AccessToken = secretProtector.Unprotect(settings.ZarinPalAccessTokenEncrypted),
            TerminalId = secretProtector.Unprotect(settings.ZarinPalTerminalIdEncrypted),
            UseSandbox = settings.ZarinPalUseSandbox,
        };
    }
}
