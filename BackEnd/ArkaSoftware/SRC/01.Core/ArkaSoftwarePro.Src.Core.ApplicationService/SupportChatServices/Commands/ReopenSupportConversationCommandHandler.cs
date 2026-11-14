using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.ReopenSupportConversation;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class ReopenSupportConversationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<ReopenSupportConversationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReopenSupportConversationCommand command)
    {
        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null)
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.TeacherUserId != command.UserId)
            return await ResultAsync("Only the teacher can reopen this conversation.", ApplicationServiceStatus.ValidationError);

        if (conversation.Status == SupportConversationStatus.Open)
            return await OkAsync("Already open.");

        conversation.Reopen();
        await chatRepository.CommitAsync();

        await realtimeNotifier.NotifyConversationStatusChangedAsync(new SupportChatConversationStatusEvent
        {
            ConversationId = conversation.Id,
            Status = "open",
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
        });

        return await OkAsync("Reopened.");
    }
}
