using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Models.Payment;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;

/// <summary>
/// آداپتر درگاه زیبال برای قرارداد <see cref="IClientPaymentGateway"/> برنامه.
/// </summary>
public sealed class ZibalGatewayService(
    IZibalClient zibalClient,
    IPaymentGatewaySettingsProvider settingsProvider) : IClientPaymentGateway
{
    private readonly IZibalClient _zibalClient = zibalClient;
    private readonly IPaymentGatewaySettingsProvider _settingsProvider = settingsProvider;

    /// <inheritdoc />
    public async Task<PaymentStartResult> CreatePaymentAsync(
        PaymentStartRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = await _settingsProvider.GetAsync(cancellationToken);
        EnsureConfigured(options);

        var result = await _zibalClient.RequestPaymentAsync(new ZibalPaymentRequest
        {
            Amount = request.Amount,
            CallbackUrl = request.CallbackUrl,
            Description = request.Description,
            OrderId = request.OrderId,
            Mobile = request.PhoneNumber
        }, cancellationToken);

        return new PaymentStartResult(result.TrackId.ToString(), result.PaymentUrl);
    }

    /// <inheritdoc />
    public async Task<PaymentVerifyResult> VerifyPaymentAsync(
        PaymentVerifyRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = await _settingsProvider.GetAsync(cancellationToken);
        EnsureConfigured(options);

        if (!long.TryParse(request.PaymentId, out var trackId) || trackId <= 0)
            throw new InvalidOperationException("شناسه پیگیری زیبال (trackId) نامعتبر است.");

        var result = await _zibalClient.VerifyPaymentAsync(new ZibalPaymentVerifyRequest
        {
            TrackId = trackId
        }, cancellationToken);

        return new PaymentVerifyResult(
            result.IsSuccess,
            result.Message,
            result.Amount,
            result.RefNumber,
            result.CardNumber,
            request.PaymentId,
            result.OrderId);
    }

    private static void EnsureConfigured(PaymentGatewayRuntimeOptions options)
    {
        if (!options.Enabled)
            throw new InvalidOperationException("درگاه پرداخت غیرفعال است.");

        if (!PaymentGatewayProviderNormalizer.IsZibal(options.Provider))
            throw new InvalidOperationException($"ارائه‌دهنده پیکربندی‌شده '{options.Provider}' با این آداپتر سازگار نیست.");

        if (options.UseSandbox)
            return;

        var merchant = !string.IsNullOrWhiteSpace(options.MerchantId) ? options.MerchantId : options.ApiKey;
        if (string.IsNullOrWhiteSpace(merchant))
            throw new InvalidOperationException("شناسه merchant زیبال تنظیم نشده است.");
    }
}
