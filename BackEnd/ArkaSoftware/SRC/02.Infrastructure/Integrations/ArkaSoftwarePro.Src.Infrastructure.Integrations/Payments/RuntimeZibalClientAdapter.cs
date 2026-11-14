using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Clients;
using Framework.Src.Infrastructure.Payments.Zibal.Models.Payment;
using Framework.Src.Infrastructure.Payments.Zibal.Options;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class RuntimeZibalClientAdapter(
    HttpClient httpClient,
    IPaymentGatewaySettingsCache cache) : IZibalClient
{
    public Task<ZibalPaymentRequestResult> RequestPaymentAsync(
        ZibalPaymentRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.RequestPaymentAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalPaymentVerifyResult> VerifyPaymentAsync(
        ZibalPaymentVerifyRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.VerifyPaymentAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalPaymentInquiryResult> InquiryPaymentAsync(
        ZibalPaymentInquiryRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.InquiryPaymentAsync(request, cancellationToken), cancellationToken);

    public string BuildPaymentGatewayUrl(long trackId)
        => WithClientSync(client => client.BuildPaymentGatewayUrl(trackId));

    private async Task<T> WithClient<T>(
        Func<ZibalClient, Task<T>> action,
        CancellationToken cancellationToken)
    {
        var snapshot = await cache.GetSnapshotAsync(cancellationToken);
        var client = new ZibalClient(httpClient, Options.Create(PaymentGatewayOptionsMapper.ToZibalOptions(snapshot)));
        return await action(client);
    }

    private T WithClientSync<T>(Func<ZibalClient, T> action)
    {
        var snapshot = cache.GetSnapshotAsync().AsTask().GetAwaiter().GetResult();
        var client = new ZibalClient(httpClient, Options.Create(PaymentGatewayOptionsMapper.ToZibalOptions(snapshot)));
        return action(client);
    }
}
