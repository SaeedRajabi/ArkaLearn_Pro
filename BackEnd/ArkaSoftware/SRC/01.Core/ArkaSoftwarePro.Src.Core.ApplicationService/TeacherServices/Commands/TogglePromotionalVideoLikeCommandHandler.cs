using ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.TogglePromotionalVideoLike;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class TogglePromotionalVideoLikeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPromotionalVideoRepository promotionalVideoRepository,
    EngagementNotifier engagementNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<TogglePromotionalVideoLikeCommand, PromotionalVideoLikeResult>(outer)
{
    public override async Task<CommandResult<PromotionalVideoLikeResult>> Handle(TogglePromotionalVideoLikeCommand command)
    {
        if (command.VideoId <= 0)
        {
            AddMessage("Video id is required.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        if (!TryGetUserId(out var userId))
        {
            AddMessage("User is not authenticated.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var video = await promotionalVideoRepository.GetVideoWithTeacherAsync(command.VideoId);
        if (video == null || !PromotionalVideoPublicAccess.IsPubliclyVisible(video, video.Teacher))
        {
            AddMessage("Video not found.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var alreadyLiked = await promotionalVideoRepository.HasUserLikedAsync(command.VideoId, userId);
        if (alreadyLiked)
        {
            await promotionalVideoRepository.RemoveLikeAsync(command.VideoId, userId);
            video.DecrementLike();
            await promotionalVideoRepository.CommitAsync();
            await engagementNotifier.NotifyPromotionalVideoLikeChangedAsync(video.Id, video.LikeCount);
            return await ResultAsync(new PromotionalVideoLikeResult
            {
                Action = "unliked",
                LikeCount = video.LikeCount,
                IsLiked = false,
            }, ApplicationServiceStatus.Ok);
        }

        await promotionalVideoRepository.AddLikeAsync(TeacherPromotionalVideoLike.Create(command.VideoId, userId));
        video.IncrementLike();
        await promotionalVideoRepository.CommitAsync();

        var teacherUserId = video.Teacher?.UserId ?? 0;
        if (teacherUserId > 0 && teacherUserId != userId)
        {
            await engagementNotifier.NotifyPromotionalVideoLikedAsync(
                video.Id,
                teacherUserId,
                video.Title,
                video.LikeCount);
        }
        else
        {
            await engagementNotifier.NotifyPromotionalVideoLikeChangedAsync(video.Id, video.LikeCount);
        }

        return await ResultAsync(new PromotionalVideoLikeResult
        {
            Action = "liked",
            LikeCount = video.LikeCount,
            IsLiked = true,
        }, ApplicationServiceStatus.Ok);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
