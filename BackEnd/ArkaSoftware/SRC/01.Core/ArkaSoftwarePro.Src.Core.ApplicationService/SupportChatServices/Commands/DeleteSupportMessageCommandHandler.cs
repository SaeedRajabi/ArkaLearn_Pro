using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteSupportMessage;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class DeleteSupportMessageCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<DeleteSupportMessageCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteSupportMessageCommand command)
    {
        var conversation = await chatRepository.GetConversationWithMessagesAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.Status == SupportConversationStatus.Closed)
            return await ResultAsync("This conversation is closed.", ApplicationServiceStatus.ValidationError);

        var message = conversation.Messages.FirstOrDefault(m => m.Id == command.MessageId);
        if (message == null || message.IsDelete)
            return await ResultAsync("Message not found.", ApplicationServiceStatus.NotFound);

        if (message.SenderUserId != command.UserId)
            return await ResultAsync("You can only delete your own messages.", ApplicationServiceStatus.ValidationError);

        message.MarkDeleted();
        await chatRepository.CommitAsync();

        await realtimeNotifier.NotifyMessageDeletedAsync(new SupportChatMessageDeletedEvent
        {
            ConversationId = conversation.Id,
            MessageId = message.Id,
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
        });

        return await OkAsync("Deleted.");
    }
}
