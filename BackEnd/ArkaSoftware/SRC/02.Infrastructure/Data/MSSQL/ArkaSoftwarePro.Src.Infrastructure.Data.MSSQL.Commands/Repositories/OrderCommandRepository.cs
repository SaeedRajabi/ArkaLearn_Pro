using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class OrderCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Order, ArkaSoftwareCommandDbContext>(dbContext), IOrderCommandRepository;
}
