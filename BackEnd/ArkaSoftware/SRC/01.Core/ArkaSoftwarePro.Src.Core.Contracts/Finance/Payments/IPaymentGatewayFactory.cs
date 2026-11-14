namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;

public interface IClientPaymentGatewayFactory
{
    IClientPaymentGateway Resolve(string provider);
}

public interface IPaymentGatewaySettingsProvider
{
    ValueTask<PaymentGatewayRuntimeOptions> GetAsync(CancellationToken cancellationToken = default);
}
