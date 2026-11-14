using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.Payment;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

/// <summary>
/// آداپتر درگاه زرین‌پال برای قرارداد <see cref="IClientPaymentGateway"/> برنامه.
/// </summary>
public sealed class ZarinPalGatewayService(
    IZarinPalClient zarinPalClient,
    IPaymentGatewaySettingsProvider settingsProvider) : IClientPaymentGateway
{
    private readonly IZarinPalClient _zarinPalClient = zarinPalClient;
    private readonly IPaymentGatewaySettingsProvider _settingsProvider = settingsProvider;

    /// <inheritdoc />
    public async Task<PaymentStartResult> CreatePaymentAsync(
        PaymentStartRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = await _settingsProvider.GetAsync(cancellationToken);
        EnsureConfigured(options);

        var result = await _zarinPalClient.RequestPaymentAsync(new ZarinPalPaymentRequest
        {
            Amount = request.Amount,
            CallbackUrl = request.CallbackUrl,
            Description = request.Description,
            Email = request.Email,
            Mobile = request.PhoneNumber,
            OrderId = request.OrderId
        }, cancellationToken);

        return new PaymentStartResult(result.Authority, result.PaymentUrl);
    }

    /// <inheritdoc />
    public async Task<PaymentVerifyResult> VerifyPaymentAsync(
        PaymentVerifyRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = await _settingsProvider.GetAsync(cancellationToken);
        EnsureConfigured(options);

        if (request.Amount is not > 0)
            throw new InvalidOperationException("مبلغ تراکنش برای تأیید زرین‌پال الزامی است.");

        var result = await _zarinPalClient.VerifyPaymentAsync(new ZarinPalPaymentVerifyRequest
        {
            Authority = request.PaymentId,
            Amount = request.Amount.Value
        }, cancellationToken);

        return new PaymentVerifyResult(
            result.IsSuccess,
            result.Message,
            request.Amount.Value,
            result.ReferenceId?.ToString(),
            result.CardPan,
            request.PaymentId);
    }

    private static void EnsureConfigured(PaymentGatewayRuntimeOptions options)
    {
        if (!options.Enabled)
            throw new InvalidOperationException("درگاه پرداخت غیرفعال است.");

        if (!PaymentGatewayProviderNormalizer.IsZarinPal(options.Provider))
            throw new InvalidOperationException($"ارائه‌دهنده پیکربندی‌شده '{options.Provider}' با این آداپتر سازگار نیست.");

        var merchantId = !string.IsNullOrWhiteSpace(options.MerchantId) ? options.MerchantId : options.ApiKey;
        if (string.IsNullOrWhiteSpace(merchantId))
            throw new InvalidOperationException("MerchantId زرین‌پال تنظیم نشده است.");
    }
}
