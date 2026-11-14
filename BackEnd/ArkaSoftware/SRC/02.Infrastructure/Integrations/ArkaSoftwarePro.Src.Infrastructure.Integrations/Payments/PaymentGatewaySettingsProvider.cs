using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class PaymentGatewaySettingsProvider(IPaymentGatewaySettingsCache cache) : IPaymentGatewaySettingsProvider
{
    public async ValueTask<PaymentGatewayRuntimeOptions> GetAsync(CancellationToken cancellationToken = default)
    {
        var snapshot = await cache.GetSnapshotAsync(cancellationToken);
        return PaymentGatewayOptionsMapper.ToRuntimeOptions(snapshot);
    }
}
