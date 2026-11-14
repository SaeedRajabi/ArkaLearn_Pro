using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class AdvertisementBumpService(
    ITeacherCommandRepository teacherCommandRepository,
    TeacherAdvertisingEntitlements entitlements)
{
    public async Task BumpTeacherListingAsync(Teacher teacher, CancellationToken cancellationToken = default)
    {
        var starLevel = await entitlements.GetEffectiveStarLevelAsync(teacher, cancellationToken);
        var ad = teacher.Advertisement ?? await teacherCommandRepository.GetAdvertisementByTeacherIdAsync(teacher.Id, cancellationToken);
        if (ad is null || !ad.IsPublic) return;

        ad.BumpListing(starLevel, DateTime.UtcNow);
    }

    public async Task RecordRevenueAsync(
        AdvertisementRevenueType revenueType,
        long teacherId,
        long payerUserId,
        long amountToman,
        string? paymentReference,
        string? description,
        CancellationToken cancellationToken = default)
    {
        if (amountToman <= 0) return;

        if (!string.IsNullOrWhiteSpace(paymentReference))
        {
            var exists = await teacherCommandRepository.RevenueExistsByReferenceAsync(paymentReference, cancellationToken);
            if (exists) return;
        }

        var revenue = AdvertisementMonetizationRevenue.Create(
            revenueType,
            teacherId,
            payerUserId,
            amountToman,
            paymentReference,
            description,
            DateTime.UtcNow);

        await teacherCommandRepository.AddMonetizationRevenueAsync(revenue, cancellationToken);
    }

    public async Task ActivateAutoBumpPackageAsync(
        Teacher teacher,
        AdvertisementAutoBumpPackage package,
        long payerUserId,
        string? paymentReference,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var purchase = TeacherAdvertisementAutoBumpPurchase.Create(
            teacher.Id,
            package.Id,
            package.PriceToman,
            package.DurationDays,
            now,
            paymentReference);

        await teacherCommandRepository.AddAutoBumpPurchaseAsync(purchase, cancellationToken);
        await BumpTeacherListingAsync(teacher, cancellationToken);
        purchase.MarkAutoBumpExecuted(now);

        await RecordRevenueAsync(
            AdvertisementRevenueType.AutoBumpPackage,
            teacher.Id,
            payerUserId,
            package.PriceToman,
            paymentReference,
            $"Auto bump package {package.Name}",
            cancellationToken);
    }

    public async Task ExecuteOneTimeBumpAsync(
        Teacher teacher,
        long payerUserId,
        long priceToman,
        string? paymentReference,
        CancellationToken cancellationToken = default)
    {
        await BumpTeacherListingAsync(teacher, cancellationToken);
        await RecordRevenueAsync(
            AdvertisementRevenueType.OneTimeBump,
            teacher.Id,
            payerUserId,
            priceToman,
            paymentReference,
            "One-time listing bump",
            cancellationToken);
    }

    public Task ProcessScheduledAutoBumpsAsync(CancellationToken cancellationToken = default)
        => teacherCommandRepository.ProcessScheduledAutoBumpsAsync(cancellationToken);
}
