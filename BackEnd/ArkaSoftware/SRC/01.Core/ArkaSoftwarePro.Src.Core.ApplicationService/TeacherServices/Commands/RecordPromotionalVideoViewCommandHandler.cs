using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RecordPromotionalVideoView;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class RecordPromotionalVideoViewCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPromotionalVideoRepository promotionalVideoRepository)
    : CommandHandler<RecordPromotionalVideoViewCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RecordPromotionalVideoViewCommand command)
    {
        if (command.VideoId <= 0)
            return await ResultAsync("Video id is required.", ApplicationServiceStatus.ValidationError);

        var video = await promotionalVideoRepository.GetVideoWithTeacherAsync(command.VideoId);
        if (video == null || !PromotionalVideoPublicAccess.IsPubliclyVisible(video, video.Teacher))
            return await ResultAsync("Video not found.", ApplicationServiceStatus.ValidationError);

        video.IncrementView();
        await promotionalVideoRepository.CommitAsync();
        return await OkAsync("view recorded");
    }
}
