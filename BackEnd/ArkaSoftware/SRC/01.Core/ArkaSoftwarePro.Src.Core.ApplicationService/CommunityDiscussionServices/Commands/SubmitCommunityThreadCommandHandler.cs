using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubmitCommunityThread;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Commands;

public class SubmitCommunityThreadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionCommandRepository repository,
    UserEmailVerificationGuard emailVerificationGuard,
    ICommunityQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<SubmitCommunityThreadCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubmitCommunityThreadCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(command.UserId);
        if (!emailCheck.Ok)
        {
            AddMessage(emailCheck.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var content = command.ContentHtml ?? string.Empty;
        if (content.Replace("<p></p>", "").Trim().Length < 10 && string.IsNullOrWhiteSpace(command.AudioUrl))
        {
            AddMessage("Thread content is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var thread = CommunityThread.Create(
            command.UserId,
            command.Subject,
            content,
            command.AudioUrl);

        await repository.InsertAsync(thread);
        await repository.CommitAsync();

        if (!await repository.IsUserSubscribedAsync(thread.Id, command.UserId))
        {
            await repository.AddSubscriptionAsync(
                CommunityThreadSubscription.Create(thread.Id, command.UserId));
            await repository.CommitAsync();
        }

        await realtimeNotifier.NotifyThreadCreatedAsync(thread.Id);

        return await OkAsync(thread.Id.ToString());
    }
}
