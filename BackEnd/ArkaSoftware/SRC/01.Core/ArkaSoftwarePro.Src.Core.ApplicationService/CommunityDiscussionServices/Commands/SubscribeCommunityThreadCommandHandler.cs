using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubscribeCommunityThread;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Commands;

public class SubscribeCommunityThreadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionCommandRepository repository)
    : CommandHandler<SubscribeCommunityThreadCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubscribeCommunityThreadCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var thread = await repository.GetWithRepliesAsync(command.ThreadId);
        if (thread == null)
            return await ResultAsync("Thread not found.", ApplicationServiceStatus.NotFound);

        if (!await repository.IsUserSubscribedAsync(command.ThreadId, command.UserId))
        {
            await repository.AddSubscriptionAsync(
                CommunityThreadSubscription.Create(command.ThreadId, command.UserId));
            await repository.CommitAsync();
        }

        return await OkAsync("subscribed");
    }
}
