using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.RecordSoftwareDownload;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Commands;

public class RecordSoftwareDownloadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository)
    : CommandHandler<RecordSoftwareDownloadCommand, int>(outer)
{
    public override async Task<CommandResult<int>> Handle(RecordSoftwareDownloadCommand command)
    {
        if (command.SoftwareId <= 0)
            return await ResultAsync(0, ApplicationServiceStatus.ValidationError);

        var item = await softwareRepository.GetWithTeacherAsync(command.SoftwareId);
        if (item == null || !SoftwareMapper.IsPubliclyVisible(item))
            return await ResultAsync(0, ApplicationServiceStatus.NotFound);

        item.IncrementDownload();
        await softwareRepository.CommitAsync();
        return await OkAsync(item.DownloadCount);
    }
}
