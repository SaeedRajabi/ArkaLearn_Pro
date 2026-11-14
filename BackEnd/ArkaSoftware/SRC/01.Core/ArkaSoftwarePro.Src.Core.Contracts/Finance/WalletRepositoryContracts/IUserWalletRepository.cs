using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetAdminUserWallets;

namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;

public interface IUserWalletRepository
{
    Task<UserWallet> GetOrCreateByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<UserWallet> GetOrCreatePlatformWalletAsync(CancellationToken cancellationToken = default);
    Task<UserWallet?> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<bool> TopUpReferenceExistsAsync(string reference, CancellationToken cancellationToken = default);
    Task InsertTransactionAsync(WalletTransaction transaction, CancellationToken cancellationToken = default);
    Task<List<WalletTransaction>> GetTransactionsAsync(long userId, int take, CancellationToken cancellationToken = default);
    Task<List<AdminUserWalletQri>> SearchWalletsForAdminAsync(string? search, int take, CancellationToken cancellationToken = default);
    Task CommitAsync(CancellationToken cancellationToken = default);
}
