using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public sealed class StudentSupportSubscriptionRepository(ArkaSoftwareCommandDbContext dbContext)
    : IStudentSupportSubscriptionRepository
{
    public Task<StudentSupportSubscription?> GetByStudentUserIdAsync(long studentUserId, CancellationToken cancellationToken = default)
        => dbContext.StudentSupportSubscriptions
            .Include(x => x.FreezeHistory)
            .Include(x => x.FeatureGrants)
            .FirstOrDefaultAsync(x => x.StudentUserId == studentUserId && !x.IsDelete, cancellationToken);

    public async Task<StudentSupportSubscription> GetOrCreateAsync(long studentUserId, CancellationToken cancellationToken = default)
    {
        var existing = await GetByStudentUserIdAsync(studentUserId, cancellationToken);
        if (existing != null)
            return existing;

        var created = StudentSupportSubscription.CreateForStudent(studentUserId);
        await dbContext.StudentSupportSubscriptions.AddAsync(created, cancellationToken);
        return created;
    }

    public Task<List<SupportPlanTariff>> GetAllTariffsAsync(CancellationToken cancellationToken = default)
        => dbContext.SupportPlanTariffs
            .Include(x => x.Features)
            .Where(x => !x.IsDelete)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.DurationMonths)
            .ToListAsync(cancellationToken);

    public Task<List<SupportPlanTariff>> GetActiveTariffsAsync(CancellationToken cancellationToken = default)
        => dbContext.SupportPlanTariffs
            .Include(x => x.Features)
            .Where(x => !x.IsDelete && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.DurationMonths)
            .ToListAsync(cancellationToken);

    public Task<SupportPlanTariff?> GetTariffByIdAsync(long tariffId, CancellationToken cancellationToken = default)
        => dbContext.SupportPlanTariffs
            .Include(x => x.Features)
            .FirstOrDefaultAsync(x => x.Id == tariffId && !x.IsDelete && x.IsActive, cancellationToken);

    public async Task EnsureDefaultTariffsAsync(CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.SupportPlanTariffs
            .Include(x => x.Features)
            .Where(x => !x.IsDelete)
            .ToListAsync(cancellationToken);

        if (existing.Count == 0)
        {
            var defaults = new (int months, long price, int sort)[]
            {
                (1, 500_000, 1),
                (3, 1_200_000, 2),
                (6, 2_000_000, 3),
            };

            foreach (var (months, price, sort) in defaults)
            {
                await dbContext.SupportPlanTariffs.AddAsync(
                    SupportPlanTariff.Create(months, price, sort),
                    cancellationToken);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var changed = false;
        foreach (var tariff in existing)
        {
            var before = tariff.Features.Count;
            tariff.EnsureDefaultFeatureRows();
            if (tariff.Features.Count != before)
                changed = true;
        }

        if (changed)
            await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpsertTariffsAsync(
        IReadOnlyList<(int DurationMonths, long PriceToman, bool IsActive, IReadOnlyList<(string Code, bool IsOffered, long AddonPriceToman)> Features)> tariffs,
        CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.SupportPlanTariffs
            .Include(x => x.Features)
            .Where(x => !x.IsDelete)
            .ToListAsync(cancellationToken);

        foreach (var item in tariffs)
        {
            var row = existing.FirstOrDefault(x => x.DurationMonths == item.DurationMonths);
            if (row == null)
            {
                var created = SupportPlanTariff.Create(item.DurationMonths, item.PriceToman, item.DurationMonths);
                created.Update(item.PriceToman, item.IsActive, item.DurationMonths);
                created.SyncFeatures(item.Features);
                await dbContext.SupportPlanTariffs.AddAsync(created, cancellationToken);
            }
            else
            {
                row.Update(item.PriceToman, item.IsActive, item.DurationMonths);
                row.EnsureDefaultFeatureRows();
                row.SyncFeatures(item.Features);
            }
        }
    }

    public async Task UpsertPendingPurchaseAsync(
        long studentUserId,
        long tariffId,
        IReadOnlyList<string> featureCodes,
        long totalAmountToman,
        CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        var existing = await dbContext.SupportPlanPendingPurchases
            .Where(x =>
                !x.IsDelete
                && !x.IsConsumed
                && x.StudentUserId == studentUserId
                && x.TariffId == tariffId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is null)
        {
            await dbContext.SupportPlanPendingPurchases.AddAsync(
                SupportPlanPendingPurchase.Create(studentUserId, tariffId, featureCodes, totalAmountToman, utcNow),
                cancellationToken);
            return;
        }

        existing.Refresh(featureCodes, totalAmountToman, utcNow);
    }

    public async Task<SupportPlanPendingPurchase?> GetOpenPendingPurchaseAsync(
        long studentUserId,
        long tariffId,
        CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;
        var pending = await dbContext.SupportPlanPendingPurchases
            .Where(x =>
                !x.IsDelete
                && !x.IsConsumed
                && x.StudentUserId == studentUserId
                && x.TariffId == tariffId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (pending is null || !pending.IsOpen(utcNow))
            return null;

        return pending;
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
        => dbContext.SaveChangesAsync(cancellationToken);
}
