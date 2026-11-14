using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.MarkSupportConversationRead;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class MarkSupportConversationReadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatSmsScheduler smsScheduler,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<MarkSupportConversationReadCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(MarkSupportConversationReadCommand command)
    {
        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        var deliveredIds = await chatRepository.MarkAllUndeliveredAsDeliveredAsync(
            command.ConversationId,
            command.UserId);

        conversation.MarkReadBy(command.UserId);
        await chatRepository.CommitAsync();

        await smsScheduler.CancelPendingRemindersForReadAsync(command.ConversationId, command.UserId);

        if (deliveredIds.Count > 0)
        {
            await realtimeNotifier.NotifyMessagesDeliveredAsync(new SupportChatMessagesDeliveredEvent
            {
                ConversationId = conversation.Id,
                RecipientUserId = command.UserId,
                StudentUserId = conversation.StudentUserId,
                TeacherUserId = conversation.TeacherUserId,
                MessageIds = deliveredIds,
                DeliveredAtUtc = DateTime.UtcNow.ToString("O"),
            });
        }

        await realtimeNotifier.NotifyMessagesReadAsync(new SupportChatMessagesReadEvent
        {
            ConversationId = conversation.Id,
            ReaderUserId = command.UserId,
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
            StudentLastReadAtUtc = conversation.StudentLastReadAtUtc?.ToString("O"),
            TeacherLastReadAtUtc = conversation.TeacherLastReadAtUtc?.ToString("O"),
        });

        return await OkAsync("Marked as read.");
    }
}
