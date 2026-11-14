using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Orders.UnitOfWorksContract;

public interface IOrderUnitOfWork:IUnitOfWork
{
    IOrderCommandRepository OrderCommandRepository { get; }
    IBasketQueryRepository BasketQueryRepository { get; }
    IBasketCommandRepository BasketCommandRepository { get; }
    
}