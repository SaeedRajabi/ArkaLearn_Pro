using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.DeleteTeacherStory;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class DeleteTeacherStoryCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository)
    : CommandHandler<DeleteTeacherStoryCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteTeacherStoryCommand command)
    {
        if (command.UserId <= 0 || command.StoryId <= 0)
            return await ResultAsync("Invalid request.", ApplicationServiceStatus.ValidationError);

        var story = await chatRepository.GetStoryByIdAsync(command.StoryId);
        if (story is null || story.IsDelete)
            return await ResultAsync("Story not found.", ApplicationServiceStatus.NotFound);

        if (!command.IsAdmin && story.TeacherUserId != command.UserId)
            return await ResultAsync("Forbidden.", ApplicationServiceStatus.ValidationError);

        story.SoftDelete();
        await chatRepository.CommitAsync();
        return await OkAsync("ok");
    }
}
