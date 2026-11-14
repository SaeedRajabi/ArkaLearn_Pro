using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SubmitSupportConversationRating;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class SubmitSupportConversationRatingCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository)
    : CommandHandler<SubmitSupportConversationRatingCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SubmitSupportConversationRatingCommand command)
    {
        var conversation = await chatRepository.GetConversationByIdAsync(command.ConversationId);
        if (conversation == null || conversation.StudentUserId != command.UserId)
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.Status != SupportConversationStatus.Closed)
            return await ResultAsync("You can rate only after closing the topic.", ApplicationServiceStatus.ValidationError);

        if (await chatRepository.HasRatingAsync(command.ConversationId))
            return await ResultAsync("You have already rated this topic.", ApplicationServiceStatus.ValidationError);

        if (!Enum.IsDefined(typeof(SupportRatingLevel), command.RatingLevel))
            return await ResultAsync("Invalid rating level.", ApplicationServiceStatus.ValidationError);

        var level = (SupportRatingLevel)command.RatingLevel;
        if (!SupportRatingScores.IsValid(level))
            return await ResultAsync("Invalid rating level.", ApplicationServiceStatus.ValidationError);

        var rating = SupportConversationRating.Create(
            conversation.Id,
            conversation.StudentUserId,
            conversation.TeacherUserId,
            level,
            command.Feedback);

        await chatRepository.InsertRatingAsync(rating);
        await chatRepository.CommitAsync();

        return await OkAsync(rating.Id.ToString());
    }
}
