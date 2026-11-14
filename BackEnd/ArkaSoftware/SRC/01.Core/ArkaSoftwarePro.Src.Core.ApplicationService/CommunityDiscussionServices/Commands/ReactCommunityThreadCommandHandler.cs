using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.ReactCommunityThread;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Commands;

public class ReactCommunityThreadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionCommandRepository repository,
    ICommunityQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<ReactCommunityThreadCommand, CommunityThreadReactionResult>(outer)
{
    public override async Task<CommandResult<CommunityThreadReactionResult>> Handle(ReactCommunityThreadCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var thread = await repository.GetWithRepliesAsync(command.ThreadId);
        if (thread == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var existing = await repository.GetThreadReactionAsync(command.ThreadId, command.UserId);

        if (command.Reaction == 0)
        {
            if (existing != null)
            {
                if (existing.Reaction == 1) thread.DecrementLike();
                else thread.DecrementDislike();
                await repository.RemoveThreadReactionAsync(command.ThreadId, command.UserId);
            }
        }
        else if (command.Reaction is 1 or -1)
        {
            if (existing == null)
            {
                if (command.Reaction == 1) thread.IncrementLike();
                else thread.IncrementDislike();
                await repository.AddThreadReactionAsync(
                    new CommunityThreadReaction(command.ThreadId, command.UserId, command.Reaction));
            }
            else if (existing.Reaction != command.Reaction)
            {
                if (existing.Reaction == 1)
                {
                    thread.DecrementLike();
                    thread.IncrementDislike();
                }
                else
                {
                    thread.DecrementDislike();
                    thread.IncrementLike();
                }
                existing.SetReaction(command.Reaction);
            }
        }
        else
        {
            AddMessage("Reaction must be -1, 0, or 1.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        await repository.CommitAsync();

        var result = new CommunityThreadReactionResult
        {
            Likes = thread.LikeCount,
            Dislikes = thread.DislikeCount,
            MyReaction = command.Reaction == 0 ? 0 : command.Reaction,
        };

        await realtimeNotifier.NotifyThreadReactionChangedAsync(thread.Id, thread.LikeCount, thread.DislikeCount);
        return await OkAsync(result);
    }
}
