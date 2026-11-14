using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementMonetizationAdmin;

public class GetAdvertisementMonetizationAdminQuery : IQuery<AdvertisementMonetizationAdminQri>, IWebRequest
{
    public string Path => "/api/Service/Teacher/GetAdvertisementMonetizationAdmin";
}

public class AdvertisementMonetizationAdminQri
{
    public AdvertisementMonetizationSettingsQri Settings { get; set; } = new();
    public List<AdvertisementTariffAdminQri> Tariffs { get; set; } = [];
    public List<AdvertisementAutoBumpPackageAdminQri> AutoBumpPackages { get; set; } = [];
}

public class AdvertisementMonetizationSettingsQri
{
    public long ContactUnlockPriceToman { get; set; }
    public int ContactUnlockHours { get; set; }
    public int FreeMinTags { get; set; }
    public int FreeMaxTags { get; set; }
    public int FreeMaxWorkExperienceChars { get; set; }
    public int FreeMaxVideos { get; set; }
    public int FreeMaxBooks { get; set; }
    public int FreeMaxArticles { get; set; }
    public int FreeMaxDescriptionChars { get; set; }
    public int XpFirstFreeMonthThreshold { get; set; }
    public int XpThresholdIncrementPerMonth { get; set; }
    public int XpRewardSaveAdvertisement { get; set; }
    public int XpRewardSaveVideo { get; set; }
    public int XpRewardSaveBook { get; set; }
    public int AutoBumpIntervalMinutes { get; set; }
    public long OneTimeBumpPriceToman { get; set; }
    public bool SubscriptionIncludesAutoBump { get; set; }
    public int XpRewardPublishCourse { get; set; }
    public int XpRewardPublishArticle { get; set; }
    public int XpRewardPortfolioArticle { get; set; }
}

public class AdvertisementAutoBumpPackageAdminQri
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public long PriceToman { get; set; }
    public bool IsActive { get; set; }
}

public class AdvertisementTariffAdminQri
{
    public long Id { get; set; }
    public int DurationMonths { get; set; }
    public int StarLevel { get; set; }
    public long PriceToman { get; set; }
    public int DiscountPercent { get; set; }
    public bool IsActive { get; set; }
}
