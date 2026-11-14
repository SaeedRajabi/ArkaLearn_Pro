using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Clients;
using Framework.Src.Infrastructure.Payments.Zibal.Models.Platform;
using Framework.Src.Infrastructure.Payments.Zibal.Options;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

public sealed class RuntimeZibalPlatformClientAdapter(
    HttpClient httpClient,
    IPaymentGatewaySettingsCache cache) : IZibalPlatformClient
{
    public Task<IReadOnlyList<ZibalWalletItem>> GetWalletListAsync(CancellationToken cancellationToken = default)
        => WithClient(client => client.GetWalletListAsync(cancellationToken), cancellationToken);

    public Task<IReadOnlyList<ZibalWalletItem>> GetWalletBalanceAsync(int walletId, CancellationToken cancellationToken = default)
        => WithClient(client => client.GetWalletBalanceAsync(walletId, cancellationToken), cancellationToken);

    public Task<ZibalPagedResult<object>> GetCheckoutReportAsync(
        ZibalCheckoutReportRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetCheckoutReportAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalPagedResult<object>> GetCheckoutQueueAsync(
        ZibalCheckoutQueueRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetCheckoutQueueAsync(request, cancellationToken), cancellationToken);

    public Task<object?> InquireCheckoutAsync(
        ZibalCheckoutInquireRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.InquireCheckoutAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalPagedResult<object>> GetGatewayTransactionReportAsync(
        ZibalGatewayTransactionReportRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.GetGatewayTransactionReportAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalSubMerchantItem> CreateSubMerchantAsync(
        ZibalSubMerchantCreateRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.CreateSubMerchantAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalPagedResult<ZibalSubMerchantItem>> ListSubMerchantsAsync(
        int page,
        int size,
        ZibalSubMerchantFilter? filter = null,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.ListSubMerchantsAsync(page, size, filter, cancellationToken), cancellationToken);

    public Task<ZibalSubMerchantItem> EditSubMerchantAsync(
        ZibalSubMerchantEditRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.EditSubMerchantAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalRefundResult> RefundAsync(
        ZibalRefundRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.RefundAsync(request, cancellationToken), cancellationToken);

    public Task<IReadOnlyList<object>> RefundInquiryAsync(
        ZibalRefundInquiryRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.RefundInquiryAsync(request, cancellationToken), cancellationToken);

    public Task<ZibalPagedResult<object>> RefundListAsync(
        ZibalRefundListRequest request,
        CancellationToken cancellationToken = default)
        => WithClient(client => client.RefundListAsync(request, cancellationToken), cancellationToken);

    private async Task<T> WithClient<T>(
        Func<ZibalPlatformClient, Task<T>> action,
        CancellationToken cancellationToken)
    {
        var snapshot = await cache.GetSnapshotAsync(cancellationToken);
        var client = new ZibalPlatformClient(httpClient, Options.Create(PaymentGatewayOptionsMapper.ToZibalOptions(snapshot)));
        return await action(client);
    }
}
