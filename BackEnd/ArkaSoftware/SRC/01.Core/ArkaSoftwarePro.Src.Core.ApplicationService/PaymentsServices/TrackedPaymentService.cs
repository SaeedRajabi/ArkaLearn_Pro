using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;

public sealed class TrackedPaymentService(IPaymentAttemptStore store, ILogger<TrackedPaymentService> logger)
{
    public async Task<PaymentStartResult> StartAsync(PaymentStartRequest request, PaymentGatewayRuntimeOptions options,
        IClientPaymentGateway gateway, int targetType, long targetId, long userId, CancellationToken cancellationToken)
    {
        var attempt = new PaymentAttempt(request.OrderId, PaymentGatewayProviderNormalizer.Normalize(options.Provider),
            request.Amount, options.AmountMultiplier, targetType, targetId, userId);
        await store.CreateAsync(attempt, cancellationToken);
        var result = await gateway.CreatePaymentAsync(request, cancellationToken);
        await store.AttachGatewayAsync(attempt.OrderId, result.PaymentId, cancellationToken);
        return result;
    }

    public async Task<T> ProcessAsync<T>(string orderId, string paymentId, PaymentGatewayRuntimeOptions options,
        IClientPaymentGateway gateway, Func<PaymentAttempt, PaymentVerifyResult, Task<(T Result, string? SuccessUrl)>> fulfill,
        Func<string, T> completedResult, CancellationToken cancellationToken)
    {
        var attempt = await store.FindAsync(orderId, cancellationToken);
        var provider = PaymentGatewayProviderNormalizer.Normalize(options.Provider);
        if (attempt is null || !attempt.Matches(paymentId, provider))
            throw new PaymentValidationException("Payment does not match a recorded gateway request.");
        if (attempt.Status == PaymentAttemptStatus.Completed && attempt.ResultUrl is { } url)
            return completedResult(url);

        var lease = await store.TryAcquireAsync(orderId, paymentId, provider, cancellationToken);
        if (lease is null)
            throw new PaymentValidationException("Payment is expired or is already being processed. Please retry shortly.");
        try
        {
            // Persist successful verification separately, so a fulfillment retry does not rely on gateway replay behavior.
            var verified = new PaymentVerifyResult(true, "Already verified", attempt.ExpectedAmount,
                attempt.ReferenceNumber, attempt.CardNumber, attempt.PaymentId, attempt.OrderId);
            if (string.IsNullOrWhiteSpace(attempt.ReferenceNumber))
            {
                verified = await gateway.VerifyPaymentAsync(new PaymentVerifyRequest(paymentId, orderId, attempt.ExpectedAmount), cancellationToken);
                if (!verified.Success || verified.Amount != attempt.ExpectedAmount ||
                    !string.Equals(verified.PaymentId, attempt.PaymentId, StringComparison.Ordinal) ||
                    string.IsNullOrWhiteSpace(verified.ReferenceNumber) ||
                    (!string.IsNullOrWhiteSpace(verified.OrderId) && !string.Equals(verified.OrderId, attempt.OrderId, StringComparison.Ordinal)))
                    throw new PaymentValidationException("Gateway verification does not match the recorded payment.");
                await store.RecordVerificationAsync(orderId, lease.Value, verified.ReferenceNumber, verified.CardNumber, cancellationToken);
            }

            return await store.FinalizeAsync(orderId, lease.Value, saved => fulfill(saved, verified), completedResult, cancellationToken);
        }
        finally
        {
            try { await store.ReleaseAsync(orderId, lease.Value, CancellationToken.None); }
            catch (Exception ex) { logger.LogError(ex, "Could not release payment lease for {OrderId}", orderId); }
        }
    }
}

public sealed class PaymentValidationException(string message) : Exception(message);
