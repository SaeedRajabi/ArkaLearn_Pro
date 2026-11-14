namespace ArkaSoftwarePro.Src.Core.Contracts.Finance;

public interface IPaymentGatewaySettingsCache
{
    ValueTask<PaymentGatewaySettingsSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);

    Task RefreshAsync(CancellationToken cancellationToken = default);
}
