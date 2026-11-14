using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherAdvertisement;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherAdvertisementQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ITeacherCommandRepository teacherCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherAdvertisingEntitlements entitlements,
    TeacherXpService xpService,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherAdvertisementQuery, TeacherAdvertisementQri>(mafiaOuterService)
{
    public override async Task<QueryResult<TeacherAdvertisementQri>> Handle(GetTeacherAdvertisementQuery query)
    {
        TeacherAdvertisement? advertisement = null;
        Teacher? teacher = null;

        if (query.ForEdit)
        {
            var userId = ResolveAuthenticatedUserId(query.UserId ?? 0, httpContextAccessor);
            if (userId > 0)
            {
                teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
                    userId,
                    userCommandRepository,
                    teacherCommandRepository,
                    studentCommandRepository);

                if (teacher is null)
                {
                    var claimUserName = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
                        ?? httpContextAccessor.HttpContext?.User?.FindFirst("name")?.Value
                        ?? query.UserName;
                    if (!string.IsNullOrWhiteSpace(claimUserName))
                    {
                        teacher = await TeacherProfileProvisioner.EnsureTeacherRecordByUserNameAsync(
                            claimUserName,
                            userCommandRepository,
                            teacherCommandRepository,
                            studentCommandRepository);
                    }
                }

                advertisement = await teacherCommandRepository.GetAdvertisementByUserIdAsync(userId);
            }
            else if (!string.IsNullOrWhiteSpace(query.UserName))
            {
                teacher = await TeacherProfileProvisioner.EnsureTeacherRecordByUserNameAsync(
                    query.UserName,
                    userCommandRepository,
                    teacherCommandRepository,
                    studentCommandRepository);
                if (teacher?.UserId is > 0)
                    advertisement = await teacherCommandRepository.GetAdvertisementByUserIdAsync(teacher.UserId.Value);
            }
        }
        else
        {
            if (query.UserId is > 0)
                advertisement = await teacherCommandRepository.GetAdvertisementByUserIdAsync(query.UserId.Value);
            else if (query.TeacherId is > 0)
            {
                teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(query.TeacherId.Value);
                advertisement = teacher?.Advertisement;
            }
            else if (!string.IsNullOrWhiteSpace(query.UserName))
            {
                var foundUser = userCommandRepository.FindByUserNameAsync(query.UserName);
                if (foundUser is { Id: > 0 })
                    advertisement = await teacherCommandRepository.GetAdvertisementByUserIdAsync(foundUser.Id);
                else
                {
                    teacher = await TeacherProfileProvisioner.EnsureTeacherRecordByUserNameAsync(
                        query.UserName,
                        userCommandRepository,
                        teacherCommandRepository,
                        studentCommandRepository);
                    if (teacher?.UserId is > 0)
                        advertisement = await teacherCommandRepository.GetAdvertisementByUserIdAsync(teacher.UserId.Value);
                }
            }
        }

        if (advertisement is null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        teacher ??= advertisement.Teacher;
        if (teacher is null && advertisement.TeacherId > 0)
            teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(advertisement.TeacherId);

        if (!query.ForEdit && !TeacherContentPublicAccess.IsAdvertisementPubliclyVisible(advertisement, teacher))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (teacher is null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var user = teacher.User;
        var displayName = user?.UserFullName != null
            ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
            : string.Empty;
        var userName = user?.UserName?.Value ?? string.Empty;
        var avatar = user?.ProfileImage?.ImageURL;
        if (string.IsNullOrWhiteSpace(avatar))
            avatar = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(displayName)}";

        var viewerUserId = query.ViewerUserId is > 0
            ? query.ViewerUserId.Value
            : ResolveAuthenticatedUserId(0, httpContextAccessor);
        var hasPaid = await entitlements.HasPaidFeaturesAsync(teacher);
        var canShowContact = query.ForEdit || await entitlements.CanShowContactToViewerAsync(
            teacher,
            viewerUserId > 0 ? viewerUserId : null);
        var hasContactDetails = HasAdvertisementContactDetails(advertisement);
        var starLevel = await entitlements.GetEffectiveStarLevelAsync(teacher);
        var xpThreshold = await xpService.GetNextThresholdAsync(teacher);
        var sub = await teacherCommandRepository.GetActiveSubscriptionAsync(teacher.Id);

        string? planStatus = null;
        if (query.ForEdit)
        {
            planStatus = hasPaid
                ? (sub != null ? "paid" : teacher.HasXpFreePlanActive(DateTime.UtcNow) ? "xp_free" : "paid_legacy")
                : "free";
        }

        return await ResultAsync(new TeacherAdvertisementQri
        {
            Id = advertisement.Id,
            TeacherId = teacher.Id,
            Title = advertisement.Title,
            PrivateTeachingCost = advertisement.PrivateTeachingCost,
            HourlyTeachingCost = advertisement.HourlyTeachingCost,
            WorkExperience = advertisement.WorkExperience,
            DescriptionHtml = advertisement.DescriptionHtml,
            WebsiteUrl = canShowContact ? advertisement.WebsiteUrl : null,
            WebsiteTitle = canShowContact ? advertisement.WebsiteTitle : null,
            ContactPhone = canShowContact ? advertisement.ContactPhone : null,
            BaleLink = canShowContact ? advertisement.BaleLink : null,
            TelegramLink = canShowContact ? advertisement.TelegramLink : null,
            WhatsAppLink = canShowContact ? advertisement.WhatsAppLink : null,
            GitHubLink = canShowContact ? advertisement.GitHubLink : null,
            LinkedInLink = canShowContact ? advertisement.LinkedInLink : null,
            InfoAccuracyConfirmed = advertisement.InfoAccuracyConfirmed,
            TermsAccepted = advertisement.TermsAccepted,
            IsPublic = advertisement.IsPublic,
            TeacherDisplayName = displayName,
            TeacherUserName = userName,
            TeacherAvatarUrl = avatar,
            Tags = advertisement.GetTags().ToList(),
            CanShowContact = canShowContact,
            HasContactDetails = hasContactDetails,
            ListingStarLevel = advertisement.ListingStarLevel > 0 ? advertisement.ListingStarLevel : starLevel,
            PlanStatus = planStatus,
            ExperiencePoints = query.ForEdit ? teacher.ExperiencePoints : 0,
            XpNextThreshold = query.ForEdit ? xpThreshold : 0,
            HasPaidFeatures = query.ForEdit && hasPaid,
            ApprovalStatus = MapApprovalStatus(advertisement.ApprovalStatus),
            RejectionNote = query.ForEdit ? advertisement.RejectionNote : null,
            SeoTitle = advertisement.SeoTitle,
            MetaDescription = advertisement.MetaDescription,
            OgImageUrl = advertisement.OgImageUrl,
            IsFollowing = viewerUserId > 0
                && viewerUserId != teacher.UserId
                && await teacherQueryRepository.IsUserFollowingTeacherAsync(viewerUserId, teacher.Id),
        }, ApplicationServiceStatus.Ok);
    }

    private static string MapApprovalStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };

    private static long ResolveAuthenticatedUserId(long queryUserId, IHttpContextAccessor httpContextAccessor)
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier ||
            x.Type == "userId" ||
            x.Type == "nameid");

        if (claim != null && long.TryParse(claim.Value, out var authUserId) && authUserId > 0)
            return authUserId;

        return queryUserId;
    }

    private static bool HasAdvertisementContactDetails(TeacherAdvertisement advertisement)
    {
        static bool HasValue(string? value) => !string.IsNullOrWhiteSpace(value);

        return HasValue(advertisement.ContactPhone)
            || HasValue(advertisement.WebsiteUrl)
            || HasValue(advertisement.BaleLink)
            || HasValue(advertisement.TelegramLink)
            || HasValue(advertisement.WhatsAppLink)
            || HasValue(advertisement.GitHubLink)
            || HasValue(advertisement.LinkedInLink);
    }
}
