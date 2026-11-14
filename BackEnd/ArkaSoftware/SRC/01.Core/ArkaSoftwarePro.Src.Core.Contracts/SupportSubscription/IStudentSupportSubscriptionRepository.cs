using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;

public interface IStudentSupportSubscriptionRepository
{
    Task<StudentSupportSubscription?> GetByStudentUserIdAsync(long studentUserId, CancellationToken cancellationToken = default);
    Task<StudentSupportSubscription> GetOrCreateAsync(long studentUserId, CancellationToken cancellationToken = default);
    Task<List<SupportPlanTariff>> GetAllTariffsAsync(CancellationToken cancellationToken = default);
    Task<List<SupportPlanTariff>> GetActiveTariffsAsync(CancellationToken cancellationToken = default);
    Task<SupportPlanTariff?> GetTariffByIdAsync(long tariffId, CancellationToken cancellationToken = default);
    Task EnsureDefaultTariffsAsync(CancellationToken cancellationToken = default);
    Task UpsertTariffsAsync(
        IReadOnlyList<(int DurationMonths, long PriceToman, bool IsActive, IReadOnlyList<(string Code, bool IsOffered, long AddonPriceToman)> Features)> tariffs,
        CancellationToken cancellationToken = default);
    Task UpsertPendingPurchaseAsync(
        long studentUserId,
        long tariffId,
        IReadOnlyList<string> featureCodes,
        long totalAmountToman,
        CancellationToken cancellationToken = default);
    Task<SupportPlanPendingPurchase?> GetOpenPendingPurchaseAsync(
        long studentUserId,
        long tariffId,
        CancellationToken cancellationToken = default);
    Task CommitAsync(CancellationToken cancellationToken = default);
}
