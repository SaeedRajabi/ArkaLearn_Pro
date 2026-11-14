using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.UpdateCategoriesName;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices.Commands
{
    public class UpdateCategoryNameCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICategoryCommandRepository categoryCommandRepository,
        IEntityTitleUniquenessChecker titleUniquenessChecker)
        : CommandHandler<CategoryNameUpdate, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(CategoryNameUpdate command)
        {
            Category categoryExist = await categoryCommandRepository.GetAsync(command.CategoryId);
            if (categoryExist == null!)
                return await ResultAsync($"Category With Id : {command.CategoryId} Is Not Found.", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);

            if (await titleUniquenessChecker.CategoryTitleExistsAsync(command.CategoryName, command.CategoryId))
            {
                AddMessage("A category with this name already exists.");
                return await ResultAsync(string.Empty, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exist);
            }

            categoryExist.ChangeCategoryName(new CategoryTitleVo(command.CategoryName));
            await categoryCommandRepository.CommitAsync();
            return await ResultAsync($"The category was updated with the new name of {command.CategoryName}.", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok);
        }
    }
}
