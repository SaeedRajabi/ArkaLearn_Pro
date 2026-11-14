using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands
{
    public interface ICategoryCommandRepository : ICommandRepository<Category, long>
    {
    }
}
