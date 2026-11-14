using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands
{
    public interface ICategoryCacheCommandRepository
    {
        Task UpdateCategoryCacheAsync(List<Category> categories);
        Task RemoveCategoryCacheAsync();
    }
}
