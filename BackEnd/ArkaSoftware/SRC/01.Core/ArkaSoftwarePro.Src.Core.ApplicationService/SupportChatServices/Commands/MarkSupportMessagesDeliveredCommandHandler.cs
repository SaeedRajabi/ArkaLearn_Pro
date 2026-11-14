using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.MarkSupportMessagesDelivered;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class MarkSupportMessagesDeliveredCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<MarkSupportMessagesDeliveredCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(MarkSupportMessagesDeliveredCommand command)
    {
        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        var messageIds = command.MessageIds?.Where(x => x > 0).Distinct().ToList() ?? [];
        if (messageIds.Count == 0)
            return await OkAsync("No messages to deliver.");

        var deliveredIds = await chatRepository.MarkMessagesDeliveredAsync(
            command.ConversationId,
            command.UserId,
            messageIds);

        if (deliveredIds.Count == 0)
            return await OkAsync("Already delivered.");

        await chatRepository.CommitAsync();

        var deliveredAtUtc = DateTime.UtcNow.ToString("O");
        await realtimeNotifier.NotifyMessagesDeliveredAsync(new SupportChatMessagesDeliveredEvent
        {
            ConversationId = conversation.Id,
            RecipientUserId = command.UserId,
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
            MessageIds = deliveredIds,
            DeliveredAtUtc = deliveredAtUtc,
        });

        return await OkAsync("Delivered.");
    }
}
