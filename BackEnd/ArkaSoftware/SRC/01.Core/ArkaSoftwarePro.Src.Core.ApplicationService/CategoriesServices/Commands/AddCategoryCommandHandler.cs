using ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices;
using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Commands.AddCategories;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CategoriesServices.Commands
{
    public class AddCategoryCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ICategoryCommandRepository categoryCommandRepository,
        IEntityTitleUniquenessChecker titleUniquenessChecker,
        ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
        : CommandHandler<AddCategory, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddCategory command)
        {
            if (await titleUniquenessChecker.CategoryTitleExistsAsync(command.CategoryName))
            {
                AddMessage("A category with this name already exists.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
            }

            var categoryImage = await UploadImage(command.CategoryImage, command.CategoryName);
            if (string.IsNullOrWhiteSpace(categoryImage))
                categoryImage = CategoryImageDefaults.DefaultImagePath;

            Category category = new(
                new CategoryTitleVo(command.CategoryName),
                new Description(command.Description),
                new Image(categoryImage),
                command.ParentId ?? null);
            await categoryCommandRepository.InsertAsync(category);
            await categoryCommandRepository.CommitAsync();
            return await OkAsync("Create Category Is Success.");
        }



        private async Task<string> UploadImage(IFormFile? file, string title)
        {
            if (file == null || file.Length == 0)
                return "";

            return await fileStoragePathSaver.SavePublicAsync(file, "images/categories");
        }
    }

   
}
