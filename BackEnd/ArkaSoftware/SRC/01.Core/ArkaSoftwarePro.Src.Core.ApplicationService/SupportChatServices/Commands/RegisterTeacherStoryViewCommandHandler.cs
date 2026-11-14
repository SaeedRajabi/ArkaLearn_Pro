using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.RegisterTeacherStoryView;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class RegisterTeacherStoryViewCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository)
    : CommandHandler<RegisterTeacherStoryViewCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RegisterTeacherStoryViewCommand command)
    {
        if (command.UserId <= 0 || command.StoryId <= 0)
            return await ResultAsync("Invalid request.", ApplicationServiceStatus.ValidationError);

        var story = await chatRepository.GetStoryWithViewsAsync(command.StoryId);
        if (story is null || !story.IsActive(DateTime.UtcNow))
            return await ResultAsync("Story not found.", ApplicationServiceStatus.NotFound);

        story.RegisterView(command.UserId);
        await chatRepository.CommitAsync();
        return await OkAsync("ok");
    }
}
