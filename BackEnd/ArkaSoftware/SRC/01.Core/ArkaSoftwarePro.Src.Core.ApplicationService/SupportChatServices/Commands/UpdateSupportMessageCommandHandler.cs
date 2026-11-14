using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.UpdateSupportMessage;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class UpdateSupportMessageCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatRealtimeNotifier realtimeNotifier)
    : CommandHandler<UpdateSupportMessageCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpdateSupportMessageCommand command)
    {
        var content = command.ContentHtml ?? string.Empty;
        if (!HasContent(content))
            return await ResultAsync("Message content is required.", ApplicationServiceStatus.ValidationError);

        var conversation = await chatRepository.GetConversationWithMessagesAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.Status == SupportConversationStatus.Closed)
            return await ResultAsync("This conversation is closed.", ApplicationServiceStatus.ValidationError);

        var message = conversation.Messages.FirstOrDefault(m => m.Id == command.MessageId);
        if (message == null || message.IsDelete)
            return await ResultAsync("Message not found.", ApplicationServiceStatus.NotFound);

        if (message.SenderUserId != command.UserId)
            return await ResultAsync("You can only edit your own messages.", ApplicationServiceStatus.ValidationError);

        message.EditContent(content);
        await chatRepository.CommitAsync();

        await realtimeNotifier.NotifyMessageUpdatedAsync(new SupportChatMessageUpdatedEvent
        {
            ConversationId = conversation.Id,
            MessageId = message.Id,
            SenderUserId = message.SenderUserId,
            ContentHtml = message.ContentHtml,
            EditedAtUtc = message.EditedAtUtc?.ToString("O"),
            StudentUserId = conversation.StudentUserId,
            TeacherUserId = conversation.TeacherUserId,
        });

        return await OkAsync("Updated.");
    }

    private static bool HasContent(string html) =>
        html.Replace("<p></p>", "", StringComparison.OrdinalIgnoreCase).Trim().Length >= 1;
}
