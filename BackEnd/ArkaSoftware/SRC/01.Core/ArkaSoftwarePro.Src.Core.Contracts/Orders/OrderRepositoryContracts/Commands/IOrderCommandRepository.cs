using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Commands
{
    public interface IOrderCommandRepository:ICommandRepository<Order , long>
    {
    }
}
