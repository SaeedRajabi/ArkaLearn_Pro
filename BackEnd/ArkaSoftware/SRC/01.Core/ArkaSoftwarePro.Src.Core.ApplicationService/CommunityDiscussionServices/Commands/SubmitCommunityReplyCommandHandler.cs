using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubmitCommunityReply;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Commands;

public class SubmitCommunityReplyCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionCommandRepository repository,
    IUserNotificationCommandRepository notificationRepository,
    IUserQueryRepository userQueryRepository,
    UserEmailVerificationGuard emailVerificationGuard,
    ICommunityQaRealtimeNotifier realtimeNotifier)
    : CommandHandler<SubmitCommunityReplyCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubmitCommunityReplyCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        var emailCheck = await emailVerificationGuard.EnsureVerifiedAsync(command.UserId);
        if (!emailCheck.Ok)
        {
            AddMessage(emailCheck.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var thread = await repository.GetWithRepliesAsync(command.ThreadId);
        if (thread == null)
            return await ResultAsync("Thread not found.", ApplicationServiceStatus.NotFound);

        var content = command.ContentHtml ?? string.Empty;
        if (content.Replace("<p></p>", "").Trim().Length < 5 && string.IsNullOrWhiteSpace(command.AudioUrl))
        {
            AddMessage("Reply content is required.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var reply = thread.AddReply(command.UserId, content, command.AudioUrl);
        await repository.CommitAsync();

        if (!await repository.IsUserSubscribedAsync(thread.Id, command.UserId))
        {
            await repository.AddSubscriptionAsync(
                CommunityThreadSubscription.Create(thread.Id, command.UserId));
            await repository.CommitAsync();
        }

        var replier = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        var replierName = BuildDisplayName(replier?.FirstName, replier?.LastName, replier?.UserName, replier?.Email);
        var subjectPreview = string.IsNullOrWhiteSpace(thread.Subject)
            ? StripHtml(thread.ContentHtml, 80)
            : thread.Subject!.Trim();

        var subscriberIds = await repository.GetSubscriberUserIdsAsync(thread.Id);
        var notifyIds = subscriberIds.Where(id => id != command.UserId).Distinct().ToList();

        if (notifyIds.Count > 0)
        {
            var notifications = notifyIds.Select(subscriberId => UserNotification.Create(
                subscriberId,
                "New reply in discussion",
                $"{replierName} replied to \"{subjectPreview}\"",
                "community_thread_reply",
                $"/qa/{thread.Id}#reply-{reply.Id}",
                thread.Id)).ToList();

            await notificationRepository.InsertManyAsync(notifications);
            await notificationRepository.CommitAsync();
        }

        await realtimeNotifier.NotifyReplyPostedAsync(thread.Id, reply.Id, notifyIds);
        foreach (var subscriberId in notifyIds)
            await realtimeNotifier.NotifyUserNotificationAsync(subscriberId);

        return await OkAsync(reply.Id.ToString());
    }

    private static string BuildDisplayName(string? firstName, string? lastName, string? userName, string? email)
    {
        var full = $"{firstName?.Trim() ?? ""} {lastName?.Trim() ?? ""}".Trim();
        if (!string.IsNullOrEmpty(full)) return full;
        if (!string.IsNullOrWhiteSpace(userName)) return userName.Trim();
        return email?.Trim() ?? "A user";
    }

    private static string StripHtml(string html, int maxLen)
    {
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ").Trim();
        if (text.Length <= maxLen) return text;
        return text[..maxLen] + "...";
    }
}
