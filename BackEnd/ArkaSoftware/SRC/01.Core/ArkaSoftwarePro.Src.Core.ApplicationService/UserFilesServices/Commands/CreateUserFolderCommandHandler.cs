using ArkaSoftwarePro.Src.Core.Contracts.UserFiles.UserFileRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Commands;

public class CreateUserFolderCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserFileCommandRepository repository)
    : CommandHandler<CreateUserFolderCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(CreateUserFolderCommand command)
    {
        if (command.UserId <= 0 || string.IsNullOrWhiteSpace(command.Name))
        {
            AddMessage("Folder name is required.");
            return await ResultAsync(default, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var parentId = command.ParentId is > 0 ? command.ParentId : null;
            var name = command.Name.Trim();

            if (await repository.ExistsSiblingWithNameAsync(command.UserId, parentId, name))
            {
                AddMessage("A folder or file with this name already exists in this location.");
                return await ResultAsync(default, ApplicationServiceStatus.ValidationError);
            }

            var folder = UserFile.CreateFolder(command.UserId, parentId, name, command.UploadedByUserId);
            if (command.UploadedByUserId is > 0)
                outer.CurrentUserContext.SetUserId(command.UploadedByUserId.Value.ToString());
            await repository.InsertAsync(folder);
            await repository.CommitAsync();

            return await OkAsync(folder.Id);
        }
        catch
        {
            return await ResultAsync(default, ApplicationServiceStatus.Exception);
        }
    }
}
