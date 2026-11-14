using Framework.Src.Infrastructure.Payments.Zibal.Models.Platform;

namespace Framework.Src.Infrastructure.Payments.Zibal.Abstractions;

/// <summary>
/// کلاینت API پلتفرم زیبال (api.zibal.ir) با احراز هویت Bearer.
/// </summary>
public interface IZibalPlatformClient
{
    Task<IReadOnlyList<ZibalWalletItem>> GetWalletListAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ZibalWalletItem>> GetWalletBalanceAsync(int walletId, CancellationToken cancellationToken = default);

    Task<ZibalPagedResult<object>> GetCheckoutReportAsync(
        ZibalCheckoutReportRequest request,
        CancellationToken cancellationToken = default);

    Task<ZibalPagedResult<object>> GetCheckoutQueueAsync(
        ZibalCheckoutQueueRequest request,
        CancellationToken cancellationToken = default);

    Task<object?> InquireCheckoutAsync(
        ZibalCheckoutInquireRequest request,
        CancellationToken cancellationToken = default);

    Task<ZibalPagedResult<object>> GetGatewayTransactionReportAsync(
        ZibalGatewayTransactionReportRequest request,
        CancellationToken cancellationToken = default);

    Task<ZibalSubMerchantItem> CreateSubMerchantAsync(
        ZibalSubMerchantCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<ZibalPagedResult<ZibalSubMerchantItem>> ListSubMerchantsAsync(
        int page,
        int size,
        ZibalSubMerchantFilter? filter = null,
        CancellationToken cancellationToken = default);

    Task<ZibalSubMerchantItem> EditSubMerchantAsync(
        ZibalSubMerchantEditRequest request,
        CancellationToken cancellationToken = default);

    Task<ZibalRefundResult> RefundAsync(
        ZibalRefundRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<object>> RefundInquiryAsync(
        ZibalRefundInquiryRequest request,
        CancellationToken cancellationToken = default);

    Task<ZibalPagedResult<object>> RefundListAsync(
        ZibalRefundListRequest request,
        CancellationToken cancellationToken = default);
}
