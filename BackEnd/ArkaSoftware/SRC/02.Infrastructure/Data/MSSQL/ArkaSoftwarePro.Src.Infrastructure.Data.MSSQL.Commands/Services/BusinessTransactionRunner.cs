using System.Data;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services;

public sealed class BusinessTransactionRunner(ArkaSoftwareCommandDbContext db) : IBusinessTransactionRunner
{
    public async Task<T> RunAsync<T>(Func<Task<T>> operation, Func<T, bool> success, CancellationToken cancellationToken = default)
    {
        if (db.Database.CurrentTransaction != null) return await operation();
        return await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear();
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var result = await operation();
                if (success(result))
                {
                    await db.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                }
                else
                {
                    await transaction.RollbackAsync(cancellationToken);
                    db.ChangeTracker.Clear();
                }
                return result;
            }
            catch
            {
                await transaction.RollbackAsync(CancellationToken.None);
                db.ChangeTracker.Clear();
                throw;
            }
        });
    }
}
