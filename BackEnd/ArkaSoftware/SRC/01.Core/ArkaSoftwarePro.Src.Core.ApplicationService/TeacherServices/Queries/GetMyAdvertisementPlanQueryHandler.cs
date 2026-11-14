using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyAdvertisementPlan;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetMyAdvertisementPlanQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherAdvertisingEntitlements entitlements,
    TeacherXpService xpService,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyAdvertisementPlanQuery, MyAdvertisementPlanQri>(outer)
{
    public override async Task<QueryResult<MyAdvertisementPlanQri>> Handle(GetMyAdvertisementPlanQuery query)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var sub = await teacherCommandRepository.GetActiveSubscriptionAsync(teacher.Id);
        var autoBump = await teacherCommandRepository.GetActiveAutoBumpPurchaseAsync(teacher.Id);
        var hasPaid = await entitlements.HasPaidFeaturesAsync(teacher);
        var starLevel = await entitlements.GetEffectiveStarLevelAsync(teacher);
        var xpThreshold = await xpService.GetNextThresholdAsync(teacher);

        var planType = hasPaid ? (sub != null ? "paid" : teacher.HasXpFreePlanActive(DateTime.UtcNow) ? "xp_free" : "paid_legacy") : "free";

        var ad = teacher.Advertisement ?? await teacherCommandRepository.GetAdvertisementByTeacherIdAsync(teacher.Id);
        var cooldownMinutes = settings.ManualBumpCooldownMinutes > 0 ? settings.ManualBumpCooldownMinutes : 25;
        var now = DateTime.UtcNow;
        var lastManualBump = ad?.LastManualBumpAtUtc;
        var canManualBump = ad is not null
            && ad.IsPublic
            && ad.ApprovalStatus == TeacherApprovalStatus.Approved
            && ad.CanManualBump(now, cooldownMinutes);
        DateTime? nextManualBump = lastManualBump.HasValue
            ? lastManualBump.Value.AddMinutes(cooldownMinutes)
            : null;

        var hasActiveSubscription = sub is not null && sub.IsActiveAt(now);
        var hasActiveAutoBumpPackage = autoBump is not null && autoBump.IsActiveAt(now);
        var autoBumpFromSubscription = hasActiveSubscription && settings.SubscriptionIncludesAutoBump;
        var hasActiveAutoBump = hasActiveAutoBumpPackage || autoBumpFromSubscription;

        DateTime? autoBumpStartedAt = null;
        DateTime? autoBumpExpiresAt = null;
        if (hasActiveAutoBumpPackage && autoBump != null)
        {
            autoBumpStartedAt = autoBump.StartedAtUtc;
            autoBumpExpiresAt = autoBump.ExpiresAtUtc;
        }
        else if (autoBumpFromSubscription && sub != null)
        {
            autoBumpStartedAt = sub.StartedAtUtc;
            autoBumpExpiresAt = sub.ExpiresAtUtc;
        }

        var intervalMinutes = settings.AutoBumpIntervalMinutes > 0 ? settings.AutoBumpIntervalMinutes : 60;
        var lastAutoBump = autoBump?.LastAutoBumpAtUtc ?? ad?.LastBumpedAtUtc;
        DateTime? nextAutoBumpAt = null;
        var remainingAutoBumps = 0;
        if (hasActiveAutoBump && autoBumpExpiresAt.HasValue)
            (nextAutoBumpAt, remainingAutoBumps) = CalculateAutoBumpSchedule(now, autoBumpExpiresAt.Value, lastAutoBump, intervalMinutes);

        return await ResultAsync(new MyAdvertisementPlanQri
        {
            PlanType = planType,
            HasPaidFeatures = hasPaid,
            ExperiencePoints = teacher.ExperiencePoints,
            XpNextFreeMonthThreshold = xpThreshold,
            XpFreeMonthsRedeemed = teacher.XpFreeMonthsRedeemed,
            HasActiveSubscription = hasActiveSubscription,
            SubscriptionStartedAtUtc = hasActiveSubscription ? sub!.StartedAtUtc : null,
            SubscriptionDurationMonths = hasActiveSubscription ? sub!.DurationMonths : 0,
            SubscriptionExpiresAtUtc = sub?.ExpiresAtUtc,
            XpFreePlanUntilUtc = teacher.XpFreePlanUntilUtc,
            ActiveStarLevel = starLevel,
            ContactUnlockPriceToman = settings.ContactUnlockPriceToman,
            OneTimeBumpPriceToman = settings.OneTimeBumpPriceToman,
            HasActiveAutoBump = hasActiveAutoBump,
            AutoBumpIncludedWithSubscription = autoBumpFromSubscription && !hasActiveAutoBumpPackage,
            AutoBumpIntervalMinutes = intervalMinutes,
            AutoBumpStartedAtUtc = autoBumpStartedAt,
            AutoBumpExpiresAtUtc = autoBumpExpiresAt,
            LastAutoBumpAtUtc = lastAutoBump,
            NextAutoBumpAtUtc = nextAutoBumpAt,
            RemainingAutoBumps = remainingAutoBumps,
            ManualBumpCooldownMinutes = cooldownMinutes,
            LastManualBumpAtUtc = lastManualBump,
            CanManualBumpNow = canManualBump,
            NextManualBumpAtUtc = canManualBump ? null : nextManualBump,
            FreeMinTags = settings.FreeMinTags,
            FreeMaxTags = settings.FreeMaxTags,
            FreeMaxWorkExperienceChars = settings.FreeMaxWorkExperienceChars,
            FreeMaxVideos = settings.FreeMaxVideos,
            FreeMaxBooks = settings.FreeMaxBooks,
            FreeMaxArticles = settings.FreeMaxArticles,
            FreeMaxDescriptionChars = settings.FreeMaxDescriptionChars,
        }, ApplicationServiceStatus.Ok);
    }

    private static (DateTime? NextAtUtc, int Remaining) CalculateAutoBumpSchedule(
        DateTime now,
        DateTime expiresAtUtc,
        DateTime? lastBumpAtUtc,
        int intervalMinutes)
    {
        if (expiresAtUtc <= now)
            return (null, 0);

        var interval = TimeSpan.FromMinutes(intervalMinutes > 0 ? intervalMinutes : 60);
        var nextBump = lastBumpAtUtc.HasValue
            ? lastBumpAtUtc.Value + interval
            : now;

        while (nextBump < now)
            nextBump += interval;

        if (nextBump >= expiresAtUtc)
            return (null, 0);

        var remaining = 0;
        var cursor = nextBump;
        while (cursor < expiresAtUtc)
        {
            remaining++;
            cursor += interval;
        }

        return (nextBump, remaining);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
