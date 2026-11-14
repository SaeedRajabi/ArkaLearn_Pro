using ArkaSoftwarePro.Src.Core.Contracts.UserFiles.UserFileRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Commands;

public class SaveUserFileCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserFileCommandRepository repository,
    UserFileNotifier userFileNotifier,
    IHttpContextAccessor httpContextAccessor,
    ILogger<SaveUserFileCommandHandler> logger)
    : CommandHandler<SaveUserFileCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(SaveUserFileCommand command)
    {
        try
        {
            if (command.UserId <= 0 || string.IsNullOrWhiteSpace(command.Name))
            {
                AddMessage("File name is required.");
                return await ResultAsync(default, ApplicationServiceStatus.ValidationError);
            }

            var parentId = command.ParentId is > 0 ? command.ParentId : null;
            var name = command.Name.Trim();

            if (await repository.ExistsSiblingWithNameAsync(command.UserId, parentId, name))
            {
                AddMessage("A folder or file with this name already exists in this location.");
                return await ResultAsync(default, ApplicationServiceStatus.ValidationError);
            }

            var file = UserFile.CreateFile(
                command.UserId,
                parentId,
                name,
                command.FileUrl,
                command.FileSize,
                command.UploadedByUserId);
            if (command.UploadedByUserId is > 0)
                outer.CurrentUserContext.SetUserId(command.UploadedByUserId.Value.ToString());
            await repository.InsertAsync(file);
            await repository.CommitAsync();

            var shouldNotify = SharedFileUploadNotificationPolicy.ShouldNotifyManagedStudent(
                httpContextAccessor.HttpContext?.User,
                command.NotifyStudent);

            if (shouldNotify)
            {
                try
                {
                    await userFileNotifier.NotifySharedFileUploadedAsync(
                        command.UserId,
                        command.Name,
                        file.Id);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(
                        ex,
                        "Shared file saved but student notification failed for managed student {ManagedStudentId}, file {FileId}",
                        command.UserId,
                        file.Id);
                }
            }

            return await OkAsync(file.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save shared user file for managed student {ManagedStudentId}", command.UserId);
            return await ResultAsync(default, ApplicationServiceStatus.Exception);
        }
    }
}
