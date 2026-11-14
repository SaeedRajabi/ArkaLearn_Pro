using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class ClientPaymentGatewayFactory(IServiceProvider serviceProvider) : IClientPaymentGatewayFactory
{
    public IClientPaymentGateway Resolve(string provider)
    {
        provider = PaymentGatewayProviderNormalizer.Normalize(provider);

        if (string.Equals(provider, "ZarinPal", StringComparison.OrdinalIgnoreCase))
            return serviceProvider.GetRequiredService<ZarinPalGatewayService>();

        if (string.Equals(provider, "Zibal", StringComparison.OrdinalIgnoreCase))
            return serviceProvider.GetRequiredService<ZibalGatewayService>();

        return serviceProvider.GetRequiredService<IdPayGatewayService>();
    }
}
