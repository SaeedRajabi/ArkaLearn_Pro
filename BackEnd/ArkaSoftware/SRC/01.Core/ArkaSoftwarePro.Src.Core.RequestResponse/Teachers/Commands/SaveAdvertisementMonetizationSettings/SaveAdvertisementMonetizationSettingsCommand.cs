using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveAdvertisementMonetizationSettings;

public class SaveAdvertisementMonetizationSettingsCommand : ICommand<string>, IWebRequest
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
    public int ManualBumpCooldownMinutes { get; set; }
    public long OneTimeBumpPriceToman { get; set; }
    public bool SubscriptionIncludesAutoBump { get; set; }
    public int XpRewardPublishCourse { get; set; }
    public int XpRewardPublishArticle { get; set; }
    public int XpRewardPortfolioArticle { get; set; }
    public List<TariffPriceUpdateDto> Tariffs { get; set; } = [];
    public List<AutoBumpPackageUpdateDto> AutoBumpPackages { get; set; } = [];
    public string Path => "/api/Service/Teacher/SaveAdvertisementMonetizationSettings";
}

public class AutoBumpPackageUpdateDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public long PriceToman { get; set; }
    public bool IsActive { get; set; }
}

public class TariffPriceUpdateDto
{
    public long Id { get; set; }
    public long PriceToman { get; set; }
    public int DiscountPercent { get; set; }
    public bool IsActive { get; set; }
}
