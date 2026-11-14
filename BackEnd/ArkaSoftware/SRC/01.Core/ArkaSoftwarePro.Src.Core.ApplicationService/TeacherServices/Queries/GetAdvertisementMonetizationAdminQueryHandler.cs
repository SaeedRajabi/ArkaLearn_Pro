using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetAdvertisementMonetizationAdmin;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetAdvertisementMonetizationAdminQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetAdvertisementMonetizationAdminQuery, AdvertisementMonetizationAdminQri>(outer)
{
    public override async Task<QueryResult<AdvertisementMonetizationAdminQri>> Handle(GetAdvertisementMonetizationAdminQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Access denied. Admin role is required.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        await teacherCommandRepository.EnsureDefaultTariffsAsync();
        await teacherCommandRepository.EnsureDefaultAutoBumpPackagesAsync();

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var tariffs = await teacherCommandRepository.GetAllTariffsAsync();
        var bumpPackages = await teacherCommandRepository.GetAllAutoBumpPackagesAsync();

        return await ResultAsync(new AdvertisementMonetizationAdminQri
        {
            Settings = new AdvertisementMonetizationSettingsQri
            {
                ContactUnlockPriceToman = settings.ContactUnlockPriceToman,
                ContactUnlockHours = settings.ContactUnlockHours,
                FreeMinTags = settings.FreeMinTags,
                FreeMaxTags = settings.FreeMaxTags,
                FreeMaxWorkExperienceChars = settings.FreeMaxWorkExperienceChars,
                FreeMaxVideos = settings.FreeMaxVideos,
                FreeMaxBooks = settings.FreeMaxBooks,
                FreeMaxArticles = settings.FreeMaxArticles,
                FreeMaxDescriptionChars = settings.FreeMaxDescriptionChars,
                XpFirstFreeMonthThreshold = settings.XpFirstFreeMonthThreshold,
                XpThresholdIncrementPerMonth = settings.XpThresholdIncrementPerMonth,
                XpRewardSaveAdvertisement = settings.XpRewardSaveAdvertisement,
                XpRewardSaveVideo = settings.XpRewardSaveVideo,
                XpRewardSaveBook = settings.XpRewardSaveBook,
                AutoBumpIntervalMinutes = settings.AutoBumpIntervalMinutes,
                OneTimeBumpPriceToman = settings.OneTimeBumpPriceToman,
                SubscriptionIncludesAutoBump = settings.SubscriptionIncludesAutoBump,
                XpRewardPublishCourse = settings.XpRewardPublishCourse,
                XpRewardPublishArticle = settings.XpRewardPublishArticle,
                XpRewardPortfolioArticle = settings.XpRewardPortfolioArticle,
            },
            Tariffs = tariffs.Select(t => new AdvertisementTariffAdminQri
            {
                Id = t.Id,
                DurationMonths = t.DurationMonths,
                StarLevel = t.StarLevel,
                PriceToman = t.PriceToman,
                DiscountPercent = t.DiscountPercent,
                IsActive = t.IsActive,
            }).ToList(),
            AutoBumpPackages = bumpPackages.Select(p => new AdvertisementAutoBumpPackageAdminQri
            {
                Id = p.Id,
                Name = p.Name,
                DurationDays = p.DurationDays,
                PriceToman = p.PriceToman,
                IsActive = p.IsActive,
            }).ToList(),
        }, ApplicationServiceStatus.Ok);
    }
}
