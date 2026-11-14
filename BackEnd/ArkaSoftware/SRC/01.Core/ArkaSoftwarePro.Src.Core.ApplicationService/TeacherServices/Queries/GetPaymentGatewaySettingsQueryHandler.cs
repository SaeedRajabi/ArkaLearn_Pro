using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPaymentGatewaySettings;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetPaymentGatewaySettingsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceCommandRepository financeCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetPaymentGatewaySettingsQuery, PaymentGatewaySettingsQri>(outer)
{
    public override async Task<QueryResult<PaymentGatewaySettingsQri>> Handle(GetPaymentGatewaySettingsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var settings = await financeCommandRepository.GetOrCreateSettingsAsync();
        var provider = PaymentGatewayCredentialRules.NormalizeProvider(settings.PaymentGatewayProvider);

        return await ResultAsync(new PaymentGatewaySettingsQri
        {
            Provider = provider is "ZarinPal" or "Zibal" ? provider : "Zibal",
            Enabled = settings.PaymentGatewayEnabled,
            AvailableProviders = ["ZarinPal", "Zibal"],
            Zibal = BuildProviderQri(
                settings.HasZibalCredentialsConfigured(),
                settings.ZibalUseSandbox,
                settings.ZibalMerchantIdEncrypted,
                settings.ZibalApiKeyEncrypted,
                settings.ZibalAccessTokenEncrypted,
                null),
            ZarinPal = BuildProviderQri(
                settings.HasZarinPalCredentialsConfigured(),
                settings.ZarinPalUseSandbox,
                settings.ZarinPalMerchantIdEncrypted,
                null,
                settings.ZarinPalAccessTokenEncrypted,
                settings.ZarinPalTerminalIdEncrypted),
        });
    }

    private static PaymentGatewayProviderSettingsQri BuildProviderQri(
        bool isConfigured,
        bool useSandbox,
        string? merchantEncrypted,
        string? apiKeyEncrypted,
        string? accessTokenEncrypted,
        string? terminalEncrypted)
    {
        return new PaymentGatewayProviderSettingsQri
        {
            IsConfigured = isConfigured,
            UseSandbox = useSandbox,
            HasMerchantId = !string.IsNullOrWhiteSpace(merchantEncrypted),
            HasApiKey = !string.IsNullOrWhiteSpace(apiKeyEncrypted),
            HasAccessToken = !string.IsNullOrWhiteSpace(accessTokenEncrypted),
            HasTerminalId = !string.IsNullOrWhiteSpace(terminalEncrypted),
            MerchantIdHint = MaskHint(merchantEncrypted),
        };
    }

    private static string? MaskHint(string? encryptedValue)
    {
        if (string.IsNullOrWhiteSpace(encryptedValue))
            return null;

        var tail = encryptedValue.Length <= 4
            ? encryptedValue
            : encryptedValue[^4..];
        return $"****{tail}";
    }
}

internal static class PaymentGatewayCredentialRules
{
    public static bool IsConfigured(
        string provider,
        bool useSandbox,
        string? merchantId,
        string? apiKey,
        string? accessToken,
        string? terminalId)
    {
        provider = NormalizeProvider(provider);

        if (string.Equals(provider, "Zibal", StringComparison.OrdinalIgnoreCase))
            return useSandbox || !string.IsNullOrWhiteSpace(merchantId) || !string.IsNullOrWhiteSpace(apiKey);

        if (string.Equals(provider, "ZarinPal", StringComparison.OrdinalIgnoreCase))
            return !string.IsNullOrWhiteSpace(merchantId);

        return false;
    }

    public static string NormalizeProvider(string? provider)
    {
        var value = (provider ?? string.Empty).Trim();
        if (string.Equals(value, "zipal", StringComparison.OrdinalIgnoreCase))
            return "Zibal";
        return value;
    }
}
