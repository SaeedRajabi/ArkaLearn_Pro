using System.Security.Claims;
using System.Text.RegularExpressions;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherAdvertisement;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SaveTeacherAdvertisementCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherAdvertisingEntitlements entitlements,
    TeacherXpService xpService,
    ITeacherAdvertisementContentModerator contentModerator,
    TeacherAdvertisementNotifier advertisementNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SaveTeacherAdvertisementCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(SaveTeacherAdvertisementCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Title))
            return await ResultAsync("Advertisement title is required.", ApplicationServiceStatus.InvalidDomainState);

        if (!command.InfoAccuracyConfirmed)
            return await ResultAsync("You must confirm the accuracy of your information.", ApplicationServiceStatus.InvalidDomainState);

        if (!command.TermsAccepted)
            return await ResultAsync("You must accept the site terms and conditions.", ApplicationServiceStatus.InvalidDomainState);

        var userId = ResolveAuthenticatedUserId(command.UserId, httpContextAccessor);
        if (userId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId,
            userCommandRepository,
            teacherCommandRepository,
            studentCommandRepository);

        if (teacher is null)
        {
            var userName = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("name")?.Value;
            if (!string.IsNullOrWhiteSpace(userName))
            {
                teacher = await TeacherProfileProvisioner.EnsureTeacherRecordByUserNameAsync(
                    userName,
                    userCommandRepository,
                    teacherCommandRepository,
                    studentCommandRepository);
            }
        }

        if (teacher is null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        var blockedReason = TeacherAccountGuard.GetContentManagementBlockReason(teacher);
        if (blockedReason != null)
            return await ResultAsync(blockedReason, ApplicationServiceStatus.ValidationError);

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var hasPaid = await entitlements.HasPaidFeaturesAsync(teacher);
        var tags = command.Tags ?? [];

        if (!hasPaid)
        {
            var validTags = tags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            if (validTags.Count < settings.FreeMinTags)
                return await ResultAsync($"Free plan requires at least {settings.FreeMinTags} tags.", ApplicationServiceStatus.ValidationError);

            if (validTags.Count > settings.FreeMaxTags)
                return await ResultAsync($"Free plan allows up to {settings.FreeMaxTags} tags.", ApplicationServiceStatus.ValidationError);

            var workLength = (command.WorkExperience ?? string.Empty).Trim().Length;
            if (workLength > settings.FreeMaxWorkExperienceChars)
                return await ResultAsync($"Free plan work experience is limited to {settings.FreeMaxWorkExperienceChars} characters.", ApplicationServiceStatus.ValidationError);

            var plainLength = GetPlainTextLength(command.DescriptionHtml ?? string.Empty);
            if (plainLength > settings.FreeMaxDescriptionChars)
                return await ResultAsync($"Free plan description is limited to {settings.FreeMaxDescriptionChars} characters.", ApplicationServiceStatus.ValidationError);
        }

        var moderation = await contentModerator.EvaluateAsync(
            new TeacherAdvertisementModerationInput(
                command.Title.Trim(),
                command.WorkExperience ?? string.Empty,
                command.DescriptionHtml ?? string.Empty,
                tags));

        if (!moderation.IsAllowed)
            return await ResultAsync(
                string.IsNullOrWhiteSpace(moderation.Reason)
                    ? "Advertisement content is not allowed."
                    : moderation.Reason,
                ApplicationServiceStatus.ValidationError);

        var hadAdvertisement = teacher.Advertisement != null;

        teacher.UpsertAdvertisement(
            command.Title,
            command.PrivateTeachingCost,
            command.HourlyTeachingCost,
            command.WorkExperience,
            command.DescriptionHtml ?? string.Empty,
            command.WebsiteUrl,
            command.WebsiteTitle,
            command.ContactPhone,
            command.BaleLink,
            command.TelegramLink,
            command.WhatsAppLink,
            command.GitHubLink,
            command.LinkedInLink,
            tags,
            command.InfoAccuracyConfirmed,
            command.TermsAccepted);

        teacher.Advertisement?.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

        await teacherCommandRepository.CommitAsync();
        if (!hadAdvertisement)
        {
            await xpService.TryAwardOnceAsync(
                teacher,
                settings.XpRewardSaveAdvertisement,
                TeacherXpEventReason.SaveAdvertisement);
        }

        var teacherWithDetails = await teacherCommandRepository.GetByIdWithDetailsAsync(teacher.Id);
        var displayName = teacherWithDetails?.User?.UserFullName != null
            ? $"{teacherWithDetails.User.UserFullName.FirstName} {teacherWithDetails.User.UserFullName.LastName}".Trim()
            : "Teacher";
        var adTitle = teacherWithDetails?.Advertisement?.Title ?? command.Title.Trim();
        await advertisementNotifier.NotifyAdminsAdvertisementSubmittedAsync(teacher.Id, displayName, adTitle);

        return await ResultAsync("Advertisement saved and submitted for admin review.", ApplicationServiceStatus.Ok);
    }

    private static int GetPlainTextLength(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return 0;
        var stripped = Regex.Replace(html, "<[^>]+>", " ");
        return stripped.Trim().Length;
    }

    private static long ResolveAuthenticatedUserId(long commandUserId, IHttpContextAccessor httpContextAccessor)
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier ||
            x.Type == "userId" ||
            x.Type == "nameid");

        if (claim != null && long.TryParse(claim.Value, out var authUserId) && authUserId > 0)
            return authUserId;

        return commandUserId;
    }
}
