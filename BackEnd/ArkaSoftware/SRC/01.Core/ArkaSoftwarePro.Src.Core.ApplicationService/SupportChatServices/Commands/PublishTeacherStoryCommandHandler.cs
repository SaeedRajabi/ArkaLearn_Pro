using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enums;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.PublishTeacherStory;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class PublishTeacherStoryCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository)
    : CommandHandler<PublishTeacherStoryCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(PublishTeacherStoryCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync(0, ApplicationServiceStatus.NotFound);

        var caption = (command.Caption ?? string.Empty).Trim();
        var mediaUrl = string.IsNullOrWhiteSpace(command.MediaUrl) ? null : command.MediaUrl.Trim();
        if (string.IsNullOrWhiteSpace(caption) && string.IsNullOrWhiteSpace(mediaUrl))
        {
            AddMessage("Caption or media is required.");
            return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
        }

        if (!Enum.IsDefined(typeof(TeacherStoryMediaKind), command.MediaKind))
        {
            AddMessage("Invalid media kind.");
            return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
        }

        var mediaKind = (TeacherStoryMediaKind)command.MediaKind;
        if (mediaKind == TeacherStoryMediaKind.Video)
        {
            if (string.IsNullOrWhiteSpace(mediaUrl))
            {
                AddMessage("Video media url is required.");
                return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
            }

            if (command.DurationSeconds is > SupportTeacherStory.MaxVideoDurationSeconds)
            {
                AddMessage($"Video duration must be at most {SupportTeacherStory.MaxVideoDurationSeconds} seconds.");
                return await ResultAsync(0, ApplicationServiceStatus.ValidationError);
            }
        }

        var story = SupportTeacherStory.Publish(
            command.UserId,
            caption,
            mediaUrl,
            command.ThumbnailUrl,
            mediaKind,
            command.DurationSeconds);

        await chatRepository.InsertStoryAsync(story);
        await chatRepository.CommitAsync();
        return await OkAsync(story.Id);
    }
}
