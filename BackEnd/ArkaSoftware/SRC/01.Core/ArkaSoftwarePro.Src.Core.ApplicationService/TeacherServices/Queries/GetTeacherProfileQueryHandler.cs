using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherProfile;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherProfileQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ITeacherQueryRepository teacherQueryRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository)
    : QueryHandler<GetTeacherProfileQuery, TeacherProfileQri>(mafiaOuterService)
{
    public override async Task<QueryResult<TeacherProfileQri>> Handle(GetTeacherProfileQuery query)
    {
        var includeUnapproved = query.ForEdit;
        TeacherProfileQri? profile = null;

        if (includeUnapproved)
            profile = await teacherQueryRepository.GetProfileAsync(query, includeUnapproved: true);

        profile ??= await teacherQueryRepository.GetProfileAsync(query, includeUnapproved: false);

        if (profile == null && !includeUnapproved)
        {
            profile = await TryGetPublicAdvertiserProfileAsync(query);
            profile ??= await TryGetPublishedInstructorProfileAsync(query);
        }

        if (profile == null && includeUnapproved && !string.IsNullOrWhiteSpace(query.UserName))
        {
            await TeacherProfileProvisioner.EnsureTeacherRecordByUserNameAsync(
                query.UserName,
                userCommandRepository,
                teacherCommandRepository,
                studentCommandRepository);
            profile = await teacherQueryRepository.GetProfileAsync(query, includeUnapproved: true);
        }

        if (profile == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!includeUnapproved && profile.AccountStatus == "terminated")
        {
            SanitizeTerminatedPublicProfile(profile);
            return await ResultAsync(profile, ApplicationServiceStatus.Ok);
        }

        await EnrichMarketplaceContentAsync(profile, includeUnapproved);
        await EnrichResumeAsync(profile, includeUnapproved);
        await EnrichFollowDataAsync(profile, query.ViewerUserId);
        return await ResultAsync(profile, ApplicationServiceStatus.Ok);
    }

    private async Task EnrichFollowDataAsync(TeacherProfileQri profile, long? viewerUserId)
    {
        if (profile.TeacherId <= 0)
            return;

        profile.FollowerCount = await teacherQueryRepository.GetTeacherFollowerCountAsync(profile.TeacherId);
        if (viewerUserId is > 0 && viewerUserId != profile.UserId)
            profile.IsFollowing = await teacherQueryRepository.IsUserFollowingTeacherAsync(viewerUserId.Value, profile.TeacherId);
    }

    private static void SanitizeTerminatedPublicProfile(TeacherProfileQri profile)
    {
        profile.Headline = string.Empty;
        profile.LongDescription = string.Empty;
        profile.ShortDescription = string.Empty;
        profile.HeaderImageUrl = string.Empty;
        profile.CanShowContact = false;
        profile.ContactEmail = null;
        profile.ContactPhone = null;
        profile.Educations = [];
        profile.Skills = [];
        profile.Courses = [];
        profile.PromotionalVideos = [];
        profile.Books = [];
        profile.PortfolioArticles = [];
        profile.PublishedCourseCount = 0;
        profile.PublishedArticleCount = 0;
        profile.Points = 0;
        profile.StudentCount = 0;
        profile.ReviewCount = 0;
    }

    private async Task<TeacherProfileQri?> TryGetPublicAdvertiserProfileAsync(GetTeacherProfileQuery query)
    {
        var profile = await teacherQueryRepository.GetProfileAsync(query, includeUnapproved: false);

        if (profile?.UserId is not > 0)
            return null;

        var advertisement = await teacherCommandRepository.GetAdvertisementByUserIdAsync(profile.UserId);
        if (advertisement == null || !TeacherContentPublicAccess.IsAdvertisementPubliclyVisible(advertisement, advertisement.Teacher))
            return null;

        return profile;
    }

    private async Task<TeacherProfileQri?> TryGetPublishedInstructorProfileAsync(GetTeacherProfileQuery query)
    {
        var profile = await teacherQueryRepository.GetProfileAsync(query, includeUnapproved: false);

        if (profile?.TeacherId is not > 0 || profile.UserId is not > 0)
            return null;

        var stats = await teacherQueryRepository.GetProfileStatsAsync(profile.TeacherId, profile.UserId);
        return stats?.PublishedCourseCount > 0 ? profile : null;
    }

    private async Task EnrichMarketplaceContentAsync(TeacherProfileQri profile, bool includeUnapproved)
    {
        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(profile.UserId);
        if (teacher == null)
            return;

        profile.PromotionalVideos = teacher.PromotionalVideos
            .Where(v => includeUnapproved || v.ApprovalStatus == TeacherApprovalStatus.Approved)
            .OrderBy(v => v.SortOrder)
            .Select(v => new TeacherPromotionalVideoQri
            {
                Id = v.Id,
                Title = v.Title,
                VideoUrl = v.VideoUrl,
                ThumbnailUrl = v.ThumbnailUrl,
                ApprovalStatus = MapStatus(v.ApprovalStatus),
            }).ToList();

        if (teacher.AdvertisingPlan == TeacherAdvertisingPlan.Paid || includeUnapproved)
        {
            profile.Books = teacher.Books
                .Where(b => includeUnapproved || b.ApprovalStatus == TeacherApprovalStatus.Approved)
                .OrderBy(b => b.SortOrder)
                .Select(b => new TeacherBookQri
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    CoverImageUrl = b.CoverImageUrl,
                    ApprovalStatus = MapStatus(b.ApprovalStatus),
                }).ToList();

            profile.PortfolioArticles = teacher.PortfolioArticles
                .Where(a => includeUnapproved || a.ApprovalStatus == TeacherApprovalStatus.Approved)
                .OrderBy(a => a.SortOrder)
                .Select(a => new TeacherPortfolioArticleQri
                {
                    Id = a.Id,
                    Title = a.Title,
                    Summary = a.Summary,
                    Content = a.Content,
                    ApprovalStatus = MapStatus(a.ApprovalStatus),
                }).ToList();
        }
    }

    private async Task EnrichResumeAsync(TeacherProfileQri profile, bool includeUnapproved)
    {
        var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(profile.UserId);
        var resume = teacher?.Resume;
        if (resume == null)
            return;

        if (!includeUnapproved && resume.ApprovalStatus != TeacherApprovalStatus.Approved)
            return;

        profile.Resume = new TeacherResumeQri
        {
            Id = resume.Id,
            Title = resume.Title,
            Description = resume.Description,
            PdfFileUrl = resume.PdfFileUrl,
            PdfFileName = resume.PdfFileName,
            ApprovalStatus = MapStatus(resume.ApprovalStatus),
        };
    }

    private static string MapStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };
}
