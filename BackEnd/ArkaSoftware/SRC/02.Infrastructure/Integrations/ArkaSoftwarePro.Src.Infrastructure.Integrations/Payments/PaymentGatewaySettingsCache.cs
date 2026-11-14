using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class PaymentGatewaySettingsCache(IServiceScopeFactory scopeFactory) : IPaymentGatewaySettingsCache
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private PaymentGatewaySettingsSnapshot? _snapshot;

    public async ValueTask<PaymentGatewaySettingsSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default)
    {
        if (_snapshot is not null)
            return _snapshot;

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_snapshot is null)
                _snapshot = await LoadWithScopeAsync(cancellationToken);
            return _snapshot;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            _snapshot = await LoadWithScopeAsync(cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<PaymentGatewaySettingsSnapshot> LoadWithScopeAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var loader = scope.ServiceProvider.GetRequiredService<PaymentGatewaySettingsLoader>();
        return await loader.LoadAsync(cancellationToken);
    }
}
