using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPromotionalVideos;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherPromotionalVideosQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IPromotionalVideoRepository promotionalVideoRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherPromotionalVideosQuery, List<TeacherPromotionalVideoPublicQri>>(outer)
{
    public override async Task<QueryResult<List<TeacherPromotionalVideoPublicQri>>> Handle(GetTeacherPromotionalVideosQuery query)
    {
        try
        {
            if (TeacherContentTargetResolver.IsAdminListingAllTeachersContent(
                    query.ForEdit,
                    query.UserId,
                    query.TeacherId,
                    query.UserName,
                    httpContextAccessor.HttpContext?.User))
            {
                var allVideos = await promotionalVideoRepository.GetAllVideosForAdminEditAsync();
                var adminResult = new List<TeacherPromotionalVideoPublicQri>();
                foreach (var video in allVideos)
                {
                    var videoTeacher = video.Teacher;
                    var user = videoTeacher?.User;
                    var displayName = user != null
                        ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
                        : string.Empty;
                    var commentCount = await promotionalVideoRepository.GetCommentCountAsync(video.Id);
                    adminResult.Add(new TeacherPromotionalVideoPublicQri
                    {
                        Id = video.Id,
                        TeacherUserId = videoTeacher?.UserId,
                        TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
                        Title = video.Title,
                        VideoUrl = video.VideoUrl,
                        ThumbnailUrl = video.ThumbnailUrl,
                        ApprovalStatus = MapStatus(video.ApprovalStatus),
                        SortOrder = video.SortOrder,
                        ViewCount = video.ViewCount,
                        LikeCount = video.LikeCount,
                        CommentCount = commentCount,
                        IsLikedByViewer = false,
                        SeoTitle = video.SeoTitle,
                        MetaDescription = video.MetaDescription,
                        OgImageUrl = video.OgImageUrl,
                    });
                }

                return await ResultAsync(adminResult, ApplicationServiceStatus.Ok);
            }

            var teacher = await ResolveTeacherAsync(query);
            if (teacher == null)
                return await ResultAsync(new List<TeacherPromotionalVideoPublicQri>(), ApplicationServiceStatus.Ok);

            var viewerUserId = query.ViewerUserId > 0
                ? query.ViewerUserId
                : ResolveAuthenticatedUserId(0, httpContextAccessor);

            var videos = teacher.PromotionalVideos
                .Where(v => query.ForEdit || PromotionalVideoPublicAccess.IsPubliclyVisible(v, teacher))
                .OrderBy(v => v.SortOrder)
                .ThenByDescending(v => v.Id)
                .ToList();

            var result = new List<TeacherPromotionalVideoPublicQri>();
            foreach (var video in videos)
            {
                var commentCount = await promotionalVideoRepository.GetCommentCountAsync(video.Id);
                var isLiked = viewerUserId > 0 && await promotionalVideoRepository.HasUserLikedAsync(video.Id, viewerUserId);
                result.Add(new TeacherPromotionalVideoPublicQri
                {
                    Id = video.Id,
                    TeacherUserId = teacher.UserId,
                    TeacherDisplayName = string.IsNullOrWhiteSpace(
                        $"{teacher.User?.UserFullName?.FirstName} {teacher.User?.UserFullName?.LastName}".Trim())
                        ? teacher.User?.UserName?.Value
                        : $"{teacher.User?.UserFullName?.FirstName} {teacher.User?.UserFullName?.LastName}".Trim(),
                    Title = video.Title,
                    VideoUrl = query.ForEdit ? video.VideoUrl : video.ResolvePublicPlaybackUrl(),
                    ThumbnailUrl = video.ThumbnailUrl,
                    ApprovalStatus = MapStatus(video.ApprovalStatus),
                    SortOrder = video.SortOrder,
                    ViewCount = video.ViewCount,
                    LikeCount = video.LikeCount,
                    CommentCount = commentCount,
                    IsLikedByViewer = isLiked,
                    SeoTitle = video.SeoTitle,
                    MetaDescription = video.MetaDescription,
                    OgImageUrl = video.OgImageUrl,
                });
            }

            return await ResultAsync(result, ApplicationServiceStatus.Ok);
        }
        catch (Exception)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }

    private async Task<ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities.Teacher?> ResolveTeacherAsync(GetTeacherPromotionalVideosQuery query)
    {
        if (query.ForEdit)
        {
            if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            {
                return await TeacherContentTargetResolver.ResolveTeacherForAdminReadAsync(
                    query.UserId,
                    query.TeacherId,
                    httpContextAccessor,
                    teacherCommandRepository);
            }

            var userId = ResolveAuthenticatedUserId(query.UserId ?? 0, httpContextAccessor);
            if (userId > 0)
                return await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
                    userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        }

        if (query.UserId is > 0)
            return await teacherCommandRepository.GetByUserIdWithDetailsAsync(query.UserId.Value);

        if (query.TeacherId is > 0)
            return await teacherCommandRepository.GetByIdWithDetailsAsync(query.TeacherId.Value);

        if (!string.IsNullOrWhiteSpace(query.UserName))
        {
            var user = userCommandRepository.FindByUserNameAsync(query.UserName);
            if (user?.Id is > 0)
                return await teacherCommandRepository.GetByUserIdWithDetailsAsync(user.Id);
        }

        return null;
    }

    private static long ResolveAuthenticatedUserId(long queryUserId, IHttpContextAccessor httpContextAccessor)
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        if (claim != null && long.TryParse(claim.Value, out var authUserId) && authUserId > 0)
            return authUserId;
        return queryUserId;
    }

    private static string MapStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };
}
