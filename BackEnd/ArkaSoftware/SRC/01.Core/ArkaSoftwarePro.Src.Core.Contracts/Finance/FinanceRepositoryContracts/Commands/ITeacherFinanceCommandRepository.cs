using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;

public interface ITeacherFinanceCommandRepository
{
    Task<PlatformFinanceSettings> GetOrCreateSettingsAsync(CancellationToken cancellationToken = default);
    Task SaveSettingsAsync(PlatformFinanceSettings settings, CancellationToken cancellationToken = default);
    Task<TeacherWallet> GetOrCreateWalletAsync(long teacherId, CancellationToken cancellationToken = default);
    Task<bool> SaleExistsByReferenceAsync(string paymentReference, CancellationToken cancellationToken = default);
    Task InsertCourseSaleAsync(TeacherCourseSale sale, CancellationToken cancellationToken = default);
    Task InsertPayoutRequestAsync(TeacherPayoutRequest request, CancellationToken cancellationToken = default);
    Task<TeacherPayoutRequest?> GetPayoutByIdAsync(long payoutId, CancellationToken cancellationToken = default);
    Task<List<long>> GetPaidInvoiceIdsAsync(CancellationToken cancellationToken = default);
    Task CommitAsync(CancellationToken cancellationToken = default);
}
