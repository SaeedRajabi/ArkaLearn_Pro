using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.UnitOfWorksContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.UnitOfWorksContract;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UnitOfWorks;

public class OrderUnitOfWork(
    ArkaSoftwareCommandDbContext dbContext,
    IOrderCommandRepository orderCommandRepository,
    IBasketCommandRepository basketCommandRepository,
    IBasketQueryRepository basketQueryRepository)
    : BaseEntityFrameworkUnitOfWork<ArkaSoftwareCommandDbContext>(dbContext), IOrderUnitOfWork
{
    public IOrderCommandRepository OrderCommandRepository { get; } = orderCommandRepository;
    public IBasketCommandRepository BasketCommandRepository { get; } = basketCommandRepository;
    public IBasketQueryRepository BasketQueryRepository { get; } = basketQueryRepository;
}