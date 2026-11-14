using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class BasketCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Basket, ArkaSoftwareCommandDbContext>(dbContext), IBasketCommandRepository;
}
