using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.UnsubscribeCommunityThread;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Commands;

public class UnsubscribeCommunityThreadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionCommandRepository repository)
    : CommandHandler<UnsubscribeCommunityThreadCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UnsubscribeCommunityThreadCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        await repository.RemoveSubscriptionAsync(command.ThreadId, command.UserId);
        await repository.CommitAsync();
        return await OkAsync("unsubscribed");
    }
}
