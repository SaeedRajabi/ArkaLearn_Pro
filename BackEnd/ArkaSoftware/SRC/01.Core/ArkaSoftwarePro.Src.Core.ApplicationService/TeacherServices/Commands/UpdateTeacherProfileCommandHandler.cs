using System.Linq;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UpdateTeacherProfile;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class UpdateTeacherProfileCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherXpService teacherXpService,
    TeacherProfileNotifier profileNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpdateTeacherProfileCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(UpdateTeacherProfileCommand command)
    {
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

        teacher.UpdateMarketplaceProfile(
            command.ShortDescription,
            command.LongDescription,
            command.HeaderImageUrl,
            command.TeachingCategoryId);

        teacher.ReplaceTeacherEducations((command.Educations ?? [])
            .Where(e => !string.IsNullOrWhiteSpace(e.UniversityName))
            .Select(e => (e.UniversityName.Trim(), MapDegreeType(e.DegreeType), e.DegreeImage ?? string.Empty))
            .ToList());

        teacher.ReplaceExpertiseAreas((command.Skills ?? [])
            .Where(s => !string.IsNullOrWhiteSpace(s.Name))
            .Select(s => (s.Name.Trim(), s.Rate))
            .ToList());

        teacher.ReplacePromotionalVideos((command.PromotionalVideos ?? [])
            .Where(v => !string.IsNullOrWhiteSpace(v.Title) && !string.IsNullOrWhiteSpace(v.VideoUrl))
            .Select(v => (v.Title, v.VideoUrl, v.ThumbnailUrl, v.SortOrder))
            .ToList());

        if (teacher.CanPublishBooksAndArticles())
        {
            var previousPortfolioTitles = teacher.PortfolioArticles
                .Select(a => a.Title.Trim())
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            teacher.ReplaceBooks((command.Books ?? [])
                .Where(b => !string.IsNullOrWhiteSpace(b.Title))
                .Select(b => (b.Title, b.Description ?? string.Empty, b.CoverImageUrl, b.SortOrder))
                .ToList());

            teacher.ReplacePortfolioArticles((command.PortfolioArticles ?? [])
                .Where(a => !string.IsNullOrWhiteSpace(a.Title))
                .Select(a => (a.Title, a.Summary ?? string.Empty, a.Content ?? string.Empty, a.SortOrder))
                .ToList());

            teacher.SubmitProfileForReview();
            await teacherCommandRepository.CommitAsync();

            var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
            foreach (var article in teacher.PortfolioArticles)
            {
                var title = article.Title.Trim();
                if (string.IsNullOrWhiteSpace(title) || previousPortfolioTitles.Contains(title))
                    continue;

                await teacherXpService.TryAwardOnceAsync(
                    teacher,
                    settings.XpRewardPortfolioArticle,
                    TeacherXpEventReason.PortfolioArticle,
                    entityKey: $"portfolio:{title.ToLowerInvariant()}");
            }
        }
        else
        {
            teacher.SubmitProfileForReview();
            await teacherCommandRepository.CommitAsync();
        }

        var teacherWithDetails = await teacherCommandRepository.GetByIdWithDetailsAsync(teacher.Id);
        var displayName = teacherWithDetails?.User?.UserFullName != null
            ? $"{teacherWithDetails.User.UserFullName.FirstName} {teacherWithDetails.User.UserFullName.LastName}".Trim()
            : "Teacher";
        await profileNotifier.NotifyAdminsProfileSubmittedAsync(teacher.Id, displayName);

        return await ResultAsync("Profile saved and submitted for admin review.", ApplicationServiceStatus.Ok);
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

    private static TeacherDegreeTypes MapDegreeType(string? raw)
    {
        var normalized = (raw ?? "bachelors").Trim().ToLowerInvariant();
        return normalized switch
        {
            "phd" or "ph_d" => TeacherDegreeTypes.PH_D,
            "masters" or "master" => TeacherDegreeTypes.MASTER,
            "certificate" or "work" => TeacherDegreeTypes.WORK,
            _ => TeacherDegreeTypes.BACHELOR,
        };
    }
}
