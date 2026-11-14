using ArkaSoftwarePro.Src.Core.Contracts.UserFiles.UserFileRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Commands;

public class RenameUserFileCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserFileCommandRepository repository)
    : CommandHandler<RenameUserFileCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RenameUserFileCommand command)
    {
        if (command.FileId <= 0 || command.UserId <= 0 || string.IsNullOrWhiteSpace(command.Name))
        {
            AddMessage("Name is required.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var file = await repository.GetByIdAndUserIdAsync(command.FileId, command.UserId);
            if (file == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            var name = command.Name.Trim();
            if (await repository.ExistsSiblingWithNameAsync(command.UserId, file.ParentId, name, file.Id))
            {
                AddMessage("A folder or file with this name already exists in this location.");
                return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
            }

            file.Rename(name);
            await repository.CommitAsync();
            return await OkAsync("Renamed");
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
