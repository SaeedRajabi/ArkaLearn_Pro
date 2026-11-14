using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminarMedia;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class UpdateSeminarMediaCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository)
        : CommandHandler<UpdateSeminarMedia, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpdateSeminarMedia command)
        {
            var seminar = await seminarCommandRepository.GetAsync(command.SeminarId);
            if (seminar == null)
                return await ResultAsync("Seminar not found.", ApplicationServiceStatus.NotFound);

            var isRecording = string.Equals(command.MediaKind, "recording", StringComparison.OrdinalIgnoreCase)
                || !string.IsNullOrEmpty(command.RecordingVideoUrl);
            if (isRecording)
            {
                if (seminar.Status != SeminarStatus.Completed && DateTime.UtcNow <= seminar.EndTime)
                    return await ResultAsync("Recording can only be uploaded after the seminar has ended.", ApplicationServiceStatus.ValidationError);
                seminar.SetMediaUrls(command.ThumbnailUrl, null, command.RecordingVideoUrl ?? command.VideoUrl);
            }
            else
            {
                seminar.SetMediaUrls(command.ThumbnailUrl, command.VideoUrl);
            }
            await seminarCommandRepository.CommitAsync();
            return await OkAsync("Media updated successfully.");
        }
    }
}
