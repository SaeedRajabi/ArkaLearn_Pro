using System.Data;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public sealed class PaymentAttemptStore(ArkaSoftwareCommandDbContext db) : IPaymentAttemptStore
{
    private IQueryable<PaymentAttempt> Attempts => db.Set<PaymentAttempt>();

    public async Task CreateAsync(PaymentAttempt attempt, CancellationToken cancellationToken)
    {
        db.Add(attempt);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AttachGatewayAsync(string orderId, string paymentId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(paymentId) || paymentId.Length > 200)
            throw new InvalidOperationException("The gateway returned an invalid payment identifier.");
        var changed = await Attempts.Where(x => x.OrderId == orderId && x.Status == PaymentAttemptStatus.Created)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.PaymentId, paymentId)
                .SetProperty(x => x.Status, PaymentAttemptStatus.Ready), cancellationToken);
        if (changed != 1) throw new InvalidOperationException("The payment request could not be activated.");
    }

    public Task<PaymentAttempt?> FindAsync(string orderId, CancellationToken cancellationToken) =>
        Attempts.AsNoTracking().SingleOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);

    public async Task<Guid?> TryAcquireAsync(string orderId, string paymentId, string provider, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var lease = Guid.NewGuid();
        var changed = await Attempts.Where(x => x.OrderId == orderId && x.PaymentId == paymentId && x.Provider == provider &&
                (x.Status == PaymentAttemptStatus.Ready ||
                 (x.Status == PaymentAttemptStatus.Processing && x.LeaseExpiresUtc < now)) &&
                (x.ExpiresUtc > now || x.ReferenceNumber != null))
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, PaymentAttemptStatus.Processing)
                .SetProperty(x => x.LeaseId, lease).SetProperty(x => x.LeaseExpiresUtc, now.AddMinutes(5)), cancellationToken);
        return changed == 1 ? lease : null;
    }

    public async Task RecordVerificationAsync(string orderId, Guid leaseId, string reference, string? cardNumber, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(reference) || reference.Length > 200)
            throw new InvalidOperationException("The verified payment has no valid reference.");
        var changed = await Attempts.Where(x => x.OrderId == orderId && x.LeaseId == leaseId && x.Status == PaymentAttemptStatus.Processing)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ReferenceNumber, reference)
                .SetProperty(x => x.CardNumber, cardNumber), cancellationToken);
        if (changed != 1) throw new InvalidOperationException("The payment lease was lost.");
    }

    public async Task ReleaseAsync(string orderId, Guid leaseId, CancellationToken cancellationToken) =>
        await Attempts.Where(x => x.OrderId == orderId && x.LeaseId == leaseId && x.Status == PaymentAttemptStatus.Processing)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Status, PaymentAttemptStatus.Ready)
                .SetProperty(x => x.LeaseId, (Guid?)null).SetProperty(x => x.LeaseExpiresUtc, (DateTime?)null), cancellationToken);

    public async Task<T> FinalizeAsync<T>(string orderId, Guid leaseId,
        Func<PaymentAttempt, Task<(T Result, string? SuccessUrl)>> fulfill,
        Func<string, T> completedResult, CancellationToken cancellationToken)
    {
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            // A retry must reload database state, including a possibly successful previous commit.
            db.ChangeTracker.Clear();
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            var attempt = await Attempts.SingleAsync(x => x.OrderId == orderId, cancellationToken);
            if (attempt.Status == PaymentAttemptStatus.Completed && attempt.ResultUrl is { } previousUrl)
                return completedResult(previousUrl);
            if (attempt.Status != PaymentAttemptStatus.Processing || attempt.LeaseId != leaseId ||
                string.IsNullOrWhiteSpace(attempt.ReferenceNumber))
                throw new InvalidOperationException("The payment is not acquired and verified.");

            var outcome = await fulfill(attempt);
            if (outcome.SuccessUrl is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                db.ChangeTracker.Clear();
                return outcome.Result;
            }
            attempt.Complete(outcome.SuccessUrl);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return outcome.Result;
        });
    }
}
