using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.LikeCommunityReply;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Commands;

public class LikeCommunityReplyCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionCommandRepository repository,
    ICommunityQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<LikeCommunityReplyCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(LikeCommunityReplyCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var reply = await repository.GetReplyAsync(command.ReplyId);
        if (reply == null)
            return await ResultAsync("Reply not found.", ApplicationServiceStatus.NotFound);

        var alreadyLiked = await repository.HasUserLikedReplyAsync(command.ReplyId, command.UserId);
        if (alreadyLiked)
        {
            await repository.RemoveReplyLikeAsync(command.ReplyId, command.UserId);
            reply.DecrementLike();
            await repository.CommitAsync();
            await realtimeNotifier.NotifyReplyLikeChangedAsync(reply.ThreadId, reply.Id, reply.LikeCount);
            return await OkAsync("unliked");
        }

        await repository.AddReplyLikeAsync(CommunityReplyLike.Create(command.ReplyId, command.UserId));
        reply.IncrementLike();
        await repository.CommitAsync();
        await realtimeNotifier.NotifyReplyLikeChangedAsync(reply.ThreadId, reply.Id, reply.LikeCount);
        return await OkAsync("liked");
    }
}
