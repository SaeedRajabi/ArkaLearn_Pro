using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Queries.GetMyStudentSupportStatus;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.Queries;

public class GetMyStudentSupportStatusQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IStudentSupportSubscriptionRepository repository)
    : QueryHandler<GetMyStudentSupportStatusQuery, StudentSupportStatusQri>(outer)
{
    public override async Task<QueryResult<StudentSupportStatusQri>> Handle(GetMyStudentSupportStatusQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        await repository.EnsureDefaultTariffsAsync();

        var utcNow = DateTime.UtcNow;
        var subscription = await repository.GetByStudentUserIdAsync(query.UserId);
        subscription?.ResolveExpiredFreeze(utcNow);

        var tariffs = await repository.GetActiveTariffsAsync();
        if (subscription == null)
        {
            return await ResultAsync(new StudentSupportStatusQri
            {
                HasActiveAccess = false,
                FreezeCountRemaining = StudentSupportSubscription.MaxFreezeCount,
                Plans = tariffs.Select(SupportPlanTariffMapper.Map).ToList(),
            });
        }

        return await ResultAsync(new StudentSupportStatusQri
        {
            HasActiveAccess = subscription.HasActiveAccess(utcNow),
            IsFrozen = subscription.IsFrozen(utcNow),
            AccessEndsAtUtc = subscription.AccessEndsAtUtc,
            RemainingDays = subscription.RemainingDays(utcNow),
            FreezeCountUsed = subscription.FreezeCountUsed,
            FreezeCountRemaining = Math.Max(0, StudentSupportSubscription.MaxFreezeCount - subscription.FreezeCountUsed),
            FrozenUntilUtc = subscription.FrozenUntilUtc,
            ActiveFreezeReason = subscription.ActiveFreezeReason,
            FreezeHistory = subscription.FreezeHistory
                .OrderByDescending(x => x.StartedAtUtc)
                .Select(x => new StudentSupportFreezeHistoryQri
                {
                    StartedAtUtc = x.StartedAtUtc,
                    EndsAtUtc = x.EndsAtUtc,
                    DurationDays = x.DurationDays,
                    Reason = x.Reason,
                })
                .ToList(),
            Plans = tariffs.Select(SupportPlanTariffMapper.Map).ToList(),
            ActiveFeatureCodes = subscription.GetActiveFeatureCodes(utcNow).ToList(),
        });
    }
}
