using ArkaSoftwarePro.Src.Core.Contracts.Categories.CategoryRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class CategoryCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Category, ArkaSoftwareCommandDbContext>(dbContext), ICategoryCommandRepository;
}
