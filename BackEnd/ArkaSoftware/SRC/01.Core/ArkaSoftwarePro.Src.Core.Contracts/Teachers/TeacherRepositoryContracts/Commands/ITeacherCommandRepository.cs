using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetPendingTeacherContent;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherAdvertisements;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using Framework.Src.Core.Contracts.Data.Commands;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands
{
    public interface ITeacherCommandRepository:ICommandRepository<Teacher , long>
    {
        Task<Teacher?> GetByUserIdWithDetailsAsync(long userId, CancellationToken cancellationToken = default);
        Task<Teacher?> GetByIdWithDetailsAsync(long teacherId, CancellationToken cancellationToken = default);
        Task<TeacherAdvertisement?> GetAdvertisementByUserIdAsync(long userId, CancellationToken cancellationToken = default);
        Task<PagedData<TeacherAdvertisementListItemQri>> SearchPublicAdvertisementsAsync(
            SearchTeacherAdvertisementsQuery query,
            CancellationToken cancellationToken = default);
        Task<PagedData<TeacherBookListItemQri>> SearchPublicBooksAsync(
            SearchTeacherBooksQuery query,
            CancellationToken cancellationToken = default);
        Task<TeacherBookPublicQri?> GetAccessibleBookBySlugAsync(
            string slug,
            long? viewerUserId = null,
            CancellationToken cancellationToken = default);

        Task<AdvertisementMonetizationSettings> GetOrCreateMonetizationSettingsAsync(CancellationToken cancellationToken = default);
        Task SaveMonetizationSettingsAsync(AdvertisementMonetizationSettings settings, CancellationToken cancellationToken = default);
        Task<List<AdvertisementTariff>> GetActiveTariffsAsync(CancellationToken cancellationToken = default);
        Task<List<AdvertisementTariff>> GetAllTariffsAsync(CancellationToken cancellationToken = default);
        Task EnsureDefaultTariffsAsync(CancellationToken cancellationToken = default);
        Task EnsureDefaultAutoBumpPackagesAsync(CancellationToken cancellationToken = default);
        Task ReplaceTariffPricesAsync(IReadOnlyList<(long Id, long PriceToman, int DiscountPercent, bool IsActive)> updates, CancellationToken cancellationToken = default);
        Task<AdvertisementTariff?> GetTariffByIdAsync(long tariffId, CancellationToken cancellationToken = default);
        Task<TeacherAdvertisementSubscription?> GetActiveSubscriptionAsync(long teacherId, CancellationToken cancellationToken = default);
        Task AddSubscriptionAsync(TeacherAdvertisementSubscription subscription, CancellationToken cancellationToken = default);
        Task<TeacherAdvertisementContactUnlock?> GetValidContactUnlockAsync(long viewerUserId, long teacherId, CancellationToken cancellationToken = default);
        Task AddContactUnlockAsync(TeacherAdvertisementContactUnlock unlock, CancellationToken cancellationToken = default);
        Task<TeacherAdvertisement?> GetAdvertisementByTeacherIdAsync(long teacherId, CancellationToken cancellationToken = default);
        Task<Teacher?> GetByPromotionalVideoIdAsync(long videoId, CancellationToken cancellationToken = default);
        Task<Teacher?> GetByBookIdAsync(long bookId, CancellationToken cancellationToken = default);
        Task<Teacher?> GetByPortfolioArticleIdAsync(long articleId, CancellationToken cancellationToken = default);
        Task<List<PendingTeacherContentQri>> GetPendingContentAsync(CancellationToken cancellationToken = default);

        Task<List<AdvertisementAutoBumpPackage>> GetActiveAutoBumpPackagesAsync(CancellationToken cancellationToken = default);
        Task<List<AdvertisementAutoBumpPackage>> GetAllAutoBumpPackagesAsync(CancellationToken cancellationToken = default);
        Task<AdvertisementAutoBumpPackage?> GetAutoBumpPackageByIdAsync(long packageId, CancellationToken cancellationToken = default);
        Task ReplaceAutoBumpPackagePricesAsync(
            IReadOnlyList<(long Id, string Name, int DurationDays, long PriceToman, bool IsActive)> updates,
            CancellationToken cancellationToken = default);
        Task AddAutoBumpPurchaseAsync(TeacherAdvertisementAutoBumpPurchase purchase, CancellationToken cancellationToken = default);
        Task<TeacherAdvertisementAutoBumpPurchase?> GetActiveAutoBumpPurchaseAsync(long teacherId, CancellationToken cancellationToken = default);
        Task AddMonetizationRevenueAsync(AdvertisementMonetizationRevenue revenue, CancellationToken cancellationToken = default);
        Task<bool> RevenueExistsByReferenceAsync(string paymentReference, CancellationToken cancellationToken = default);
        Task ProcessScheduledAutoBumpsAsync(CancellationToken cancellationToken = default);
        Task<List<AdvertisementMonetizationRevenue>> GetMonetizationRevenuesAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default);
        Task AddXpEventAsync(TeacherExperiencePointEvent xpEvent, CancellationToken cancellationToken = default);
        Task<List<TeacherExperiencePointEvent>> GetRecentXpEventsAsync(long teacherId, int take, CancellationToken cancellationToken = default);
        Task<bool> HasPositiveXpEventAsync(long teacherId, TeacherXpEventReason reason, string? descriptionRef = null, CancellationToken cancellationToken = default);

        Task<bool> IsUserFollowingTeacherAsync(long followerUserId, long teacherId, CancellationToken cancellationToken = default);
        Task AddTeacherFollowAsync(TeacherFollow follow, CancellationToken cancellationToken = default);
        Task RemoveTeacherFollowAsync(long followerUserId, long teacherId, CancellationToken cancellationToken = default);
        Task<List<long>> GetTeacherFollowerUserIdsAsync(long teacherId, CancellationToken cancellationToken = default);
        Task<int> GetTeacherFollowerCountAsync(long teacherId, CancellationToken cancellationToken = default);
        Task<List<TeacherBookPublicQri>> GetAllBooksForAdminEditAsync(CancellationToken cancellationToken = default);
    }
}