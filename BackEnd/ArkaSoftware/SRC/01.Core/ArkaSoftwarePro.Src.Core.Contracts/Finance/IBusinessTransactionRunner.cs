namespace ArkaSoftwarePro.Src.Core.Contracts.Finance;

public interface IBusinessTransactionRunner
{
    Task<T> RunAsync<T>(Func<Task<T>> operation, Func<T, bool> success, CancellationToken cancellationToken = default);
}
