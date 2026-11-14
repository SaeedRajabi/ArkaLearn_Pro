using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.CloseSupportConversation;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class CloseSupportConversationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<CloseSupportConversationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(CloseSupportConversationCommand command)
    {
        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.Status == SupportConversationStatus.Closed)
            return await OkAsync("Already closed.");

        conversation.Close();
        await chatRepository.CommitAsync();

        await realtimeNotifier.NotifyConversationStatusChangedAsync(new SupportChatConversationStatusEvent
        {
            ConversationId = conversation.Id,
            Status = "closed",
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
        });

        return await OkAsync("Closed.");
    }
}
