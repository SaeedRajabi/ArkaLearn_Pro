using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class TeacherFinanceCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : ITeacherFinanceCommandRepository
{
    public async Task<PlatformFinanceSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken = default)
    {
        var settings = await dbContext.PlatformFinanceSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings != null) return settings;

        settings = PlatformFinanceSettings.CreateDefault();
        await dbContext.PlatformFinanceSettings.AddAsync(settings, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return settings;
    }

    public Task SaveSettingsAsync(PlatformFinanceSettings settings, CancellationToken cancellationToken = default)
    {
        dbContext.PlatformFinanceSettings.Update(settings);
        return Task.CompletedTask;
    }

    public async Task<TeacherWallet> GetOrCreateWalletAsync(long teacherId, CancellationToken cancellationToken = default)
    {
        var wallet = await dbContext.TeacherWallets
            .FirstOrDefaultAsync(x => x.TeacherId == teacherId, cancellationToken);
        if (wallet != null) return wallet;

        wallet = TeacherWallet.Create(teacherId);
        await dbContext.TeacherWallets.AddAsync(wallet, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return wallet;
    }

    public Task<bool> SaleExistsByReferenceAsync(string paymentReference, CancellationToken cancellationToken = default)
    {
        return dbContext.TeacherCourseSales
            .AsNoTracking()
            .AnyAsync(x => x.PaymentReference == paymentReference, cancellationToken);
    }

    public async Task InsertCourseSaleAsync(TeacherCourseSale sale, CancellationToken cancellationToken = default)
    {
        await dbContext.TeacherCourseSales.AddAsync(sale, cancellationToken);
    }

    public async Task InsertPayoutRequestAsync(TeacherPayoutRequest request, CancellationToken cancellationToken = default)
    {
        await dbContext.TeacherPayoutRequests.AddAsync(request, cancellationToken);
    }

    public Task<TeacherPayoutRequest?> GetPayoutByIdAsync(long payoutId, CancellationToken cancellationToken = default)
    {
        return dbContext.TeacherPayoutRequests.FirstOrDefaultAsync(x => x.Id == payoutId, cancellationToken);
    }

    public async Task<List<long>> GetPaidInvoiceIdsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Invoices.AsNoTracking()
            .Where(x => x.Status == InvoiceStatus.PAID)
            .OrderBy(x => x.Id)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
