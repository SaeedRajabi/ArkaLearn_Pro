using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetMyAdvertisementPlan;

public class GetMyAdvertisementPlanQuery : IQuery<MyAdvertisementPlanQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetMyAdvertisementPlan";
}

public class MyAdvertisementPlanQri
{
    public string PlanType { get; set; } = "free";
    public bool HasPaidFeatures { get; set; }
    public int ExperiencePoints { get; set; }
    public int XpNextFreeMonthThreshold { get; set; }
    public int XpFreeMonthsRedeemed { get; set; }
    public bool HasActiveSubscription { get; set; }
    public DateTime? SubscriptionStartedAtUtc { get; set; }
    public int SubscriptionDurationMonths { get; set; }
    public DateTime? SubscriptionExpiresAtUtc { get; set; }
    public DateTime? XpFreePlanUntilUtc { get; set; }
    public int ActiveStarLevel { get; set; }
    public long ContactUnlockPriceToman { get; set; }
    public long OneTimeBumpPriceToman { get; set; }
    public bool HasActiveAutoBump { get; set; }
    public bool AutoBumpIncludedWithSubscription { get; set; }
    public int AutoBumpIntervalMinutes { get; set; }
    public DateTime? AutoBumpStartedAtUtc { get; set; }
    public DateTime? AutoBumpExpiresAtUtc { get; set; }
    public DateTime? LastAutoBumpAtUtc { get; set; }
    public DateTime? NextAutoBumpAtUtc { get; set; }
    public int RemainingAutoBumps { get; set; }
    public int ManualBumpCooldownMinutes { get; set; } = 25;
    public DateTime? LastManualBumpAtUtc { get; set; }
    public bool CanManualBumpNow { get; set; }
    public DateTime? NextManualBumpAtUtc { get; set; }
    public int FreeMinTags { get; set; }
    public int FreeMaxTags { get; set; }
    public int FreeMaxWorkExperienceChars { get; set; }
    public int FreeMaxVideos { get; set; }
    public int FreeMaxBooks { get; set; }
    public int FreeMaxArticles { get; set; }
    public int FreeMaxDescriptionChars { get; set; }
}
