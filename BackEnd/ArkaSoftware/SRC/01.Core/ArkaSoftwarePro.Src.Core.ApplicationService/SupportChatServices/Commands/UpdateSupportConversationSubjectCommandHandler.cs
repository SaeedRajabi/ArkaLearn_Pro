using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.UpdateSupportConversationSubject;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class UpdateSupportConversationSubjectCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatQueryRepository chatQueryRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<UpdateSupportConversationSubjectCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpdateSupportConversationSubjectCommand command)
    {
        var subject = command.Subject?.Trim() ?? string.Empty;
        if (subject.Length < 3)
            return await ResultAsync("Subject must be at least 3 characters.", ApplicationServiceStatus.ValidationError);

        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (await chatQueryRepository.HasConversationWithSubjectAsync(
                conversation.StudentUserId,
                conversation.TeacherUserId,
                subject,
                conversation.Id))
            return await ResultAsync("A support topic with this subject already exists.", ApplicationServiceStatus.ValidationError);

        conversation.UpdateSubject(subject);
        await chatRepository.CommitAsync();

        await realtimeNotifier.NotifyConversationUpdatedAsync(new SupportChatConversationUpdatedEvent
        {
            ConversationId = conversation.Id,
            Subject = conversation.Subject,
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
        });

        return await OkAsync("Updated.");
    }
}
