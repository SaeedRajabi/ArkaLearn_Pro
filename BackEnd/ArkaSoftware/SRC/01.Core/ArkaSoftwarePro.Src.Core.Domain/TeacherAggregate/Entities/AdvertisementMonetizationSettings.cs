using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

/// <summary>Singleton site-wide settings for advertisement monetization.</summary>
public class AdvertisementMonetizationSettings : Entity
{
    public long ContactUnlockPriceToman { get; private set; } = 20000;
    public int ContactUnlockHours { get; private set; } = 48;
    public int FreeMinTags { get; private set; } = 3;
    public int FreeMaxTags { get; private set; } = 3;
    public int FreeMaxWorkExperienceChars { get; private set; } = 1000;
    public int FreeMaxVideos { get; private set; } = 1;
    public int FreeMaxBooks { get; private set; } = 1;
    public int FreeMaxArticles { get; private set; } = 1;
    public int FreeMaxDescriptionChars { get; private set; } = 2000;
    public int XpFirstFreeMonthThreshold { get; private set; } = 200;
    public int XpThresholdIncrementPerMonth { get; private set; } = 100;
    public int XpRewardSaveAdvertisement { get; private set; } = 5;
    public int XpRewardSaveVideo { get; private set; } = 5;
    public int XpRewardSaveBook { get; private set; } = 10;
    public int AutoBumpIntervalMinutes { get; private set; } = 60;
    public int ManualBumpCooldownMinutes { get; private set; } = 25;
    public long OneTimeBumpPriceToman { get; private set; } = 50000;
    public bool SubscriptionIncludesAutoBump { get; private set; } = true;
    public int XpRewardPublishCourse { get; private set; } = 15;
    public int XpRewardPublishArticle { get; private set; } = 10;
    public int XpRewardPortfolioArticle { get; private set; } = 10;

    private AdvertisementMonetizationSettings() { }

    public static AdvertisementMonetizationSettings CreateDefault() => new();

    public void Update(
        long contactUnlockPriceToman,
        int contactUnlockHours,
        int freeMinTags,
        int freeMaxTags,
        int freeMaxWorkExperienceChars,
        int freeMaxVideos,
        int freeMaxBooks,
        int freeMaxArticles,
        int freeMaxDescriptionChars,
        int xpFirstFreeMonthThreshold,
        int xpThresholdIncrementPerMonth,
        int xpRewardSaveAdvertisement,
        int xpRewardSaveVideo,
        int xpRewardSaveBook,
        int autoBumpIntervalMinutes,
        int manualBumpCooldownMinutes,
        long oneTimeBumpPriceToman,
        bool subscriptionIncludesAutoBump,
        int xpRewardPublishCourse,
        int xpRewardPublishArticle,
        int xpRewardPortfolioArticle)
    {
        ContactUnlockPriceToman = contactUnlockPriceToman > 0 ? contactUnlockPriceToman : 20000;
        ContactUnlockHours = contactUnlockHours > 0 ? contactUnlockHours : 48;
        FreeMinTags = freeMinTags > 0 ? freeMinTags : 3;
        FreeMaxTags = freeMaxTags > 0 ? freeMaxTags : 3;
        FreeMaxWorkExperienceChars = freeMaxWorkExperienceChars > 0 ? freeMaxWorkExperienceChars : 1000;
        FreeMaxVideos = freeMaxVideos > 0 ? freeMaxVideos : 1;
        FreeMaxBooks = freeMaxBooks > 0 ? freeMaxBooks : 1;
        FreeMaxArticles = freeMaxArticles > 0 ? freeMaxArticles : 1;
        FreeMaxDescriptionChars = freeMaxDescriptionChars > 0 ? freeMaxDescriptionChars : 2000;
        XpFirstFreeMonthThreshold = xpFirstFreeMonthThreshold > 0 ? xpFirstFreeMonthThreshold : 200;
        XpThresholdIncrementPerMonth = xpThresholdIncrementPerMonth >= 0 ? xpThresholdIncrementPerMonth : 100;
        XpRewardSaveAdvertisement = xpRewardSaveAdvertisement >= 0 ? xpRewardSaveAdvertisement : 5;
        XpRewardSaveVideo = xpRewardSaveVideo >= 0 ? xpRewardSaveVideo : 5;
        XpRewardSaveBook = xpRewardSaveBook >= 0 ? xpRewardSaveBook : 10;
        AutoBumpIntervalMinutes = autoBumpIntervalMinutes > 0 ? autoBumpIntervalMinutes : 60;
        ManualBumpCooldownMinutes = manualBumpCooldownMinutes > 0 ? manualBumpCooldownMinutes : 25;
        OneTimeBumpPriceToman = oneTimeBumpPriceToman > 0 ? oneTimeBumpPriceToman : 50000;
        SubscriptionIncludesAutoBump = subscriptionIncludesAutoBump;
        XpRewardPublishCourse = xpRewardPublishCourse >= 0 ? xpRewardPublishCourse : 15;
        XpRewardPublishArticle = xpRewardPublishArticle >= 0 ? xpRewardPublishArticle : 10;
        XpRewardPortfolioArticle = xpRewardPortfolioArticle >= 0 ? xpRewardPortfolioArticle : 10;
    }
}
