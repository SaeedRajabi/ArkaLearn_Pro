using ArkaSoftwarePro.Src.Core.Contracts.UserFiles.UserFileRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserFileAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Commands;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices.Commands;

public class DeleteUserFileCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserFileCommandRepository repository)
    : CommandHandler<DeleteUserFileCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteUserFileCommand command)
    {
        if (command.FileId <= 0 || command.UserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        try
        {
            var target = await repository.GetByIdAndUserIdAsync(command.FileId, command.UserId);
            if (target == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

            var allFiles = await repository.GetAllByUserIdAsync(command.UserId);
            var idsToDelete = CollectSubtreeIds(command.FileId, allFiles);

            var pending = new HashSet<long>(idsToDelete);
            while (pending.Count > 0)
            {
                var leafIds = pending.Where(id =>
                    !allFiles.Any(x => x.ParentId == id && pending.Contains(x.Id))).ToList();

                if (leafIds.Count == 0)
                    break;

                foreach (var leafId in leafIds)
                {
                    var entity = allFiles.First(x => x.Id == leafId);
                    repository.Delete(entity);
                    pending.Remove(leafId);
                }
            }

            await repository.CommitAsync();
            return await OkAsync("Deleted");
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }

    private static HashSet<long> CollectSubtreeIds(long rootId, List<UserFile> allFiles)
    {
        var ids = new HashSet<long> { rootId };
        var changed = true;
        while (changed)
        {
            changed = false;
            foreach (var file in allFiles)
            {
                if (file.ParentId.HasValue && ids.Contains(file.ParentId.Value) && ids.Add(file.Id))
                    changed = true;
            }
        }

        return ids;
    }
}
