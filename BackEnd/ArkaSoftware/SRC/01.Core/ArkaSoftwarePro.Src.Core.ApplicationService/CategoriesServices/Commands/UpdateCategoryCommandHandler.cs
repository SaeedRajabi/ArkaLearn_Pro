using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategory;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices.Commands;

public class UpdateCategoryCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    ICategoryCommandRepository categoryCommandRepository,
    ICategoryQueryRepository categoryQueryRepository,
    IEntityTitleUniquenessChecker titleUniquenessChecker,
    ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
    : CommandHandler<UpdateCategory, string>(outerServices)
{
    public override async Task<CommandResult<string>> Handle(UpdateCategory command)
    {
        var category = await categoryCommandRepository.GetAsync(command.CategoryId);
        if (category == null!)
            return await ResultAsync($"Category With Id : {command.CategoryId} Is Not Found.", ApplicationServiceStatus.NotFound);

        if (await titleUniquenessChecker.CategoryTitleExistsAsync(command.CategoryName, command.CategoryId))
        {
            AddMessage("A category with this name already exists.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
        }

        if (command.ParentId is > 0)
        {
            if (command.ParentId == command.CategoryId ||
                await categoryQueryRepository.IsDescendantOfAsync(command.CategoryId, command.ParentId.Value))
            {
                AddMessage("Invalid parent category.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.InvalidDomainState);
            }
        }

        category.ChangeCategoryName(new CategoryTitleVo(command.CategoryName));
        category.ChangeCategoryDescription(new Description(command.Description));
        category.ChangeParent(command.ParentId);

        if (command.CategoryImage is { Length: > 0 })
        {
            var savedPath = await fileStoragePathSaver.SavePublicAsync(command.CategoryImage, "images/categories");
            category.ChangeCategoryImage(new Image(savedPath));
        }

        await categoryCommandRepository.CommitAsync();
        return await OkAsync("Category updated successfully.");
    }
}
