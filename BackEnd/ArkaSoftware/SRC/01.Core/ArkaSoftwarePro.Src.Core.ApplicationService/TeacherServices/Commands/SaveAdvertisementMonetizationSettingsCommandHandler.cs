using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveAdvertisementMonetizationSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SaveAdvertisementMonetizationSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SaveAdvertisementMonetizationSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SaveAdvertisementMonetizationSettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Access denied. Admin role is required.");
            return await ResultAsync("Access denied.", ApplicationServiceStatus.ValidationError);
        }

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        settings.Update(
            command.ContactUnlockPriceToman,
            command.ContactUnlockHours,
            command.FreeMinTags,
            command.FreeMaxTags,
            command.FreeMaxWorkExperienceChars,
            command.FreeMaxVideos,
            command.FreeMaxBooks,
            command.FreeMaxArticles,
            command.FreeMaxDescriptionChars,
            command.XpFirstFreeMonthThreshold,
            command.XpThresholdIncrementPerMonth,
            command.XpRewardSaveAdvertisement,
            command.XpRewardSaveVideo,
            command.XpRewardSaveBook,
            command.AutoBumpIntervalMinutes,
            command.ManualBumpCooldownMinutes > 0 ? command.ManualBumpCooldownMinutes : settings.ManualBumpCooldownMinutes,
            command.OneTimeBumpPriceToman,
            command.SubscriptionIncludesAutoBump,
            command.XpRewardPublishCourse,
            command.XpRewardPublishArticle,
            command.XpRewardPortfolioArticle);

        if (command.Tariffs?.Count > 0)
        {
            await teacherCommandRepository.ReplaceTariffPricesAsync(
                command.Tariffs.Select(t => (t.Id, t.PriceToman, t.DiscountPercent, t.IsActive)).ToList());
        }

        if (command.AutoBumpPackages?.Count > 0)
        {
            await teacherCommandRepository.ReplaceAutoBumpPackagePricesAsync(
                command.AutoBumpPackages.Select(p => (p.Id, p.Name, p.DurationDays, p.PriceToman, p.IsActive)).ToList());
        }

        await teacherCommandRepository.SaveMonetizationSettingsAsync(settings);
        await teacherCommandRepository.CommitAsync();
        return await OkAsync("Settings saved.");
    }
}
