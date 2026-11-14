using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteSupportConversation;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class DeleteSupportConversationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<DeleteSupportConversationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteSupportConversationCommand command)
    {
        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        conversation.MarkDeleted();
        await chatRepository.CommitAsync();

        await realtimeNotifier.NotifyConversationDeletedAsync(new SupportChatConversationDeletedEvent
        {
            ConversationId = conversation.Id,
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
        });

        return await OkAsync("Deleted.");
    }
}
