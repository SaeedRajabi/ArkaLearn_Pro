using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.DeleteCategory;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices.Commands;

public class DeleteCategoryCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEntityPermanentDeletionService permanentDeletionService)
    : CommandHandler<DeleteCategoryCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteCategoryCommand command)
    {
        var deleted = await permanentDeletionService.PermanentlyDeleteCategoryAsync(command.CategoryId);
        if (!deleted)
            return await ResultAsync("Category not found.", ApplicationServiceStatus.NotFound);

        return await OkAsync("Category permanently deleted.");
    }
}
