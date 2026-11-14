using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.Finance;

public interface IPaymentAttemptStore
{
    Task CreateAsync(PaymentAttempt attempt, CancellationToken cancellationToken);
    Task AttachGatewayAsync(string orderId, string paymentId, CancellationToken cancellationToken);
    Task<PaymentAttempt?> FindAsync(string orderId, CancellationToken cancellationToken);
    Task<Guid?> TryAcquireAsync(string orderId, string paymentId, string provider, CancellationToken cancellationToken);
    Task RecordVerificationAsync(string orderId, Guid leaseId, string reference, string? cardNumber, CancellationToken cancellationToken);
    Task ReleaseAsync(string orderId, Guid leaseId, CancellationToken cancellationToken);
    Task<T> FinalizeAsync<T>(string orderId, Guid leaseId,
        Func<PaymentAttempt, Task<(T Result, string? SuccessUrl)>> fulfill,
        Func<string, T> completedResult, CancellationToken cancellationToken);
}
