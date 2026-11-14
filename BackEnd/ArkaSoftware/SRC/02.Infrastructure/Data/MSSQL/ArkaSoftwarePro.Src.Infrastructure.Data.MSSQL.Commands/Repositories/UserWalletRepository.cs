using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetAdminUserWallets;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class UserWalletRepository(ArkaSoftwareCommandDbContext dbContext) : IUserWalletRepository
{
    public async Task<UserWallet> GetOrCreateByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        var wallet = await dbContext.UserWallets
            .FirstOrDefaultAsync(x => x.UserId == userId && !x.IsPlatformWallet, cancellationToken);
        if (wallet != null) return wallet;

        wallet = UserWallet.CreateForUser(userId);
        await dbContext.UserWallets.AddAsync(wallet, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return wallet;
    }

    public async Task<UserWallet> GetOrCreatePlatformWalletAsync(CancellationToken cancellationToken = default)
    {
        var wallet = await dbContext.UserWallets
            .FirstOrDefaultAsync(x => x.IsPlatformWallet, cancellationToken);
        if (wallet != null) return wallet;

        wallet = UserWallet.CreatePlatform();
        await dbContext.UserWallets.AddAsync(wallet, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return wallet;
    }

    public Task<UserWallet?> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        => dbContext.UserWallets.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId && !x.IsPlatformWallet, cancellationToken);

    public Task<bool> TopUpReferenceExistsAsync(string reference, CancellationToken cancellationToken = default)
        => dbContext.WalletTransactions.AsNoTracking()
            .AnyAsync(x => x.Reference == reference, cancellationToken);

    public async Task InsertTransactionAsync(WalletTransaction transaction, CancellationToken cancellationToken = default)
    {
        await dbContext.WalletTransactions.AddAsync(transaction, cancellationToken);
    }

    public async Task<List<WalletTransaction>> GetTransactionsAsync(long userId, int take, CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 200 ? take : 50;
        return await dbContext.WalletTransactions.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<AdminUserWalletQri>> SearchWalletsForAdminAsync(
        string? search,
        int take,
        CancellationToken cancellationToken = default)
    {
        take = take is > 0 and <= 200 ? take : 50;
        var query = dbContext.UserWallets.AsNoTracking().Where(x => !x.IsPlatformWallet);

        if (!string.IsNullOrWhiteSpace(search) && long.TryParse(search.Trim(), out var userId))
            query = query.Where(x => x.UserId == userId);

        var wallets = await query
            .OrderByDescending(x => x.AvailableBalanceToman)
            .Take(take)
            .ToListAsync(cancellationToken);

        var ids = wallets.Select(x => x.UserId).Distinct().ToList();
        var users = await dbContext.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToListAsync(cancellationToken);
        var userMap = users.ToDictionary(u => u.Id);

        return wallets.Select(w =>
        {
            userMap.TryGetValue(w.UserId, out var user);
            var name = user?.UserFullName == null
                ? $"User #{w.UserId}"
                : $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim();
            return new AdminUserWalletQri
            {
                UserId = w.UserId,
                UserName = user?.UserName.Value ?? string.Empty,
                FullName = name,
                Email = user?.Email.Value ?? string.Empty,
                AvailableBalanceToman = w.AvailableBalanceToman,
                ReservedBalanceToman = w.ReservedBalanceToman,
                TotalDepositedToman = w.TotalDepositedToman,
                TotalSpentToman = w.TotalSpentToman,
                TotalReceivedToman = w.TotalReceivedToman,
                IsSuspended = w.IsSuspended,
                ZibalSubMerchantId = w.ZibalSubMerchantId,
            };
        }).ToList();
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
