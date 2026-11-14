using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.DeleteSeminar;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands;

public class DeleteSeminarCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEntityPermanentDeletionService permanentDeletionService)
    : CommandHandler<DeleteSeminarCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteSeminarCommand command)
    {
        var deleted = await permanentDeletionService.PermanentlyDeleteSeminarAsync(command.SeminarId);
        if (!deleted)
            return await ResultAsync("Seminar not found.", ApplicationServiceStatus.NotFound);

        return await OkAsync("Seminar permanently deleted.");
    }
}
