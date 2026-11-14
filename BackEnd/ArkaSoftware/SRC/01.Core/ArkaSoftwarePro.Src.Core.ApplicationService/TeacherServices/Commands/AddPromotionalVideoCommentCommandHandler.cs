using ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddPromotionalVideoComment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class AddPromotionalVideoCommentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPromotionalVideoRepository promotionalVideoRepository,
    EngagementNotifier engagementNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AddPromotionalVideoCommentCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AddPromotionalVideoCommentCommand command)
    {
        if (command.VideoId <= 0)
            return await ResultAsync("Video id is required.", ApplicationServiceStatus.ValidationError);

        if (!TryGetUserId(out var userId))
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.ValidationError);

        var content = command.Content?.Trim() ?? string.Empty;
        if (content.Length is < 1 or > 2000)
            return await ResultAsync("Comment must be between 1 and 2000 characters.", ApplicationServiceStatus.ValidationError);

        var video = await promotionalVideoRepository.GetVideoWithTeacherAsync(command.VideoId);
        if (video == null || !PromotionalVideoPublicAccess.IsPubliclyVisible(video, video.Teacher))
            return await ResultAsync("Video not found.", ApplicationServiceStatus.ValidationError);

        var comment = await promotionalVideoRepository.AddCommentAsync(
            TeacherPromotionalVideoComment.Create(command.VideoId, userId, content, command.ParentId));
        await promotionalVideoRepository.CommitAsync();

        var displayName = httpContextAccessor.HttpContext?.User?.Identity?.Name
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value
            ?? $"User {userId}";

        var teacherUserId = video.Teacher?.UserId ?? 0;
        var parentId = command.ParentId is > 0 ? command.ParentId : null;

        if (teacherUserId > 0 && teacherUserId != userId)
        {
            await engagementNotifier.NotifyPromotionalVideoCommentAsync(
                video.Id,
                teacherUserId,
                video.Title,
                displayName,
                comment.Id,
                parentId);
        }
        else
        {
            await engagementNotifier.NotifyPromotionalVideoCommentLiveAsync(
                video.Id,
                comment.Id,
                parentId,
                []);
        }

        return await OkAsync("Comment added.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
