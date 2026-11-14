using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherAdvertisingEntitlements(ITeacherCommandRepository teacherCommandRepository)
{
    public async Task<bool> HasPaidFeaturesAsync(Teacher teacher, CancellationToken cancellationToken = default)
    {
        if (teacher.HasXpFreePlanActive(DateTime.UtcNow))
            return true;

        var activeSub = await teacherCommandRepository.GetActiveSubscriptionAsync(teacher.Id, cancellationToken);
        if (activeSub != null)
            return true;

        return teacher.AdvertisingPlan == TeacherAdvertisingPlan.Paid;
    }

    public async Task<bool> CanShowContactToViewerAsync(
        Teacher teacher,
        long? viewerUserId,
        CancellationToken cancellationToken = default)
    {
        if (await HasPaidFeaturesAsync(teacher, cancellationToken))
            return true;

        if (viewerUserId is not > 0)
            return false;

        var unlock = await teacherCommandRepository.GetValidContactUnlockAsync(viewerUserId.Value, teacher.Id, cancellationToken);
        return unlock != null;
    }

    public async Task<int> GetEffectiveStarLevelAsync(Teacher teacher, CancellationToken cancellationToken = default)
    {
        var sub = await teacherCommandRepository.GetActiveSubscriptionAsync(teacher.Id, cancellationToken);
        if (sub != null)
            return sub.StarLevel;

        if (teacher.HasXpFreePlanActive(DateTime.UtcNow))
            return 3;

        return teacher.Advertisement?.ListingStarLevel ?? 0;
    }

    public async Task ActivateSubscriptionAsync(
        Teacher teacher,
        AdvertisementTariff tariff,
        string? paymentReference,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var existing = await teacherCommandRepository.GetActiveSubscriptionAsync(teacher.Id, cancellationToken);
        var startFrom = existing?.ExpiresAtUtc > now ? existing.ExpiresAtUtc : now;

        var subscription = TeacherAdvertisementSubscription.Create(
            teacher.Id,
            tariff.Id,
            tariff.StarLevel,
            tariff.DurationMonths,
            startFrom,
            paymentReference);

        await teacherCommandRepository.AddSubscriptionAsync(subscription, cancellationToken);
        teacher.SetAdvertisingPlan(TeacherAdvertisingPlan.Paid);

        var ad = teacher.Advertisement ?? await teacherCommandRepository.GetAdvertisementByTeacherIdAsync(teacher.Id, cancellationToken);
        if (ad != null)
        {
            ad.SetListingStarLevel(tariff.StarLevel);
            ad.BumpListing(tariff.StarLevel, now);
        }
    }
}
