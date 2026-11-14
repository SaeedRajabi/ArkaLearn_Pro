using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.MediaServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.MediaUploadSettingsServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePromotionalVideo;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Linq;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class SavePromotionalVideoCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IMediaUploadSettingsCommandRepository mediaUploadSettingsRepository,
    TeacherAdvertisingEntitlements entitlements,
    TeacherXpService xpService,
    IHttpContextAccessor httpContextAccessor,
    TeacherContentNotifier contentNotifier,
    IVideoWatermarkQueue videoWatermarkQueue)
    : CommandHandler<SavePromotionalVideoCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SavePromotionalVideoCommand command)
    {
        if (!TeacherContentTargetResolver.TryGetAuthenticatedUserId(httpContextAccessor, out _))
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var teacher = await TeacherContentTargetResolver.ResolveTeacherForContentEditAsync(
            command.TeacherUserId,
            httpContextAccessor,
            userCommandRepository,
            teacherCommandRepository,
            studentCommandRepository);
        if (teacher == null)
            return await ResultAsync("Teacher profile not found.", ApplicationServiceStatus.NotFound);

        var blockedReason = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User)
            ? null
            : TeacherAccountGuard.GetContentManagementBlockReason(teacher);
        if (blockedReason != null)
            return await ResultAsync(blockedReason, ApplicationServiceStatus.ValidationError);

        if (string.IsNullOrWhiteSpace(command.Title) || string.IsNullOrWhiteSpace(command.VideoUrl))
            return await ResultAsync("Title and video URL are required.", ApplicationServiceStatus.ValidationError);

        var maxDurationSeconds = await MediaUploadDurationGuard
            .GetPromotionalLimitAsync(mediaUploadSettingsRepository);
        if (command.DurationSeconds is > 0 && command.DurationSeconds.Value > maxDurationSeconds)
        {
            var error = $"Video duration cannot exceed {Math.Ceiling(maxDurationSeconds / 60d):0} minutes.";
            AddMessage(error);
            return await ResultAsync(error, ApplicationServiceStatus.ValidationError);
        }

        var isAdmin = DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User);

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var hasPaid = await entitlements.HasPaidFeaturesAsync(teacher);
        if (!isAdmin && !hasPaid && command.VideoId <= 0)
        {
            var videoCount = teacher.PromotionalVideos.Count();
            if (videoCount >= settings.FreeMaxVideos)
                return await ResultAsync($"Free plan allows up to {settings.FreeMaxVideos} promotional video(s).", ApplicationServiceStatus.ValidationError);
        }

        var status = isAdmin ? TeacherApprovalStatus.Approved : TeacherApprovalStatus.Pending;
        TeacherPromotionalVideo? createdVideo = null;

        if (command.VideoId > 0)
        {
            var existing = teacher.PromotionalVideos.FirstOrDefault(v => v.Id == command.VideoId);
            if (existing == null)
                return await ResultAsync("Video not found.", ApplicationServiceStatus.NotFound);

            teacher.UpdatePromotionalVideo(
                command.VideoId,
                command.Title,
                command.VideoUrl,
                command.ThumbnailUrl,
                command.SortOrder,
                status);
            existing.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);
        }
        else
        {
            createdVideo = teacher.AddPromotionalVideo(
                command.Title,
                command.VideoUrl,
                command.ThumbnailUrl,
                command.SortOrder,
                status);
            createdVideo.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);
        }

        await teacherCommandRepository.CommitAsync();

        if (isAdmin)
        {
            var savedVideo = command.VideoId > 0
                ? teacher.PromotionalVideos.FirstOrDefault(v => v.Id == command.VideoId)
                : createdVideo;
            if (savedVideo != null)
            {
                savedVideo.SetApprovedSnapshot(TeacherReviewSnapshotService.BuildVideoSnapshot(savedVideo));
                await teacherCommandRepository.CommitAsync();
                videoWatermarkQueue.EnqueuePromotionalVideoWatermark(savedVideo.Id, savedVideo.VideoUrl);
            }
        }

        if (createdVideo != null && createdVideo.Id > 0)
        {
            await xpService.TryAwardOnceAsync(
                teacher,
                settings.XpRewardSaveVideo,
                TeacherXpEventReason.SaveVideo,
                createdVideo.Id);
        }

        if (!isAdmin)
        {
            var teacherWithDetails = await teacherCommandRepository.GetByIdWithDetailsAsync(teacher.Id);
            var savedVideo = command.VideoId > 0
                ? teacherWithDetails?.PromotionalVideos.FirstOrDefault(v => v.Id == command.VideoId)
                    ?? teacher.PromotionalVideos.FirstOrDefault(v => v.Id == command.VideoId)
                : createdVideo;
            var displayName = teacherWithDetails?.User?.UserFullName != null
                ? $"{teacherWithDetails.User.UserFullName.FirstName} {teacherWithDetails.User.UserFullName.LastName}".Trim()
                : "Teacher";
            await contentNotifier.NotifyAdminsContentSubmittedAsync(
                teacher.Id,
                displayName,
                "video",
                savedVideo?.Title ?? command.Title);
        }

        return await OkAsync(isAdmin ? "Video saved." : "Video saved and submitted for admin review.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
