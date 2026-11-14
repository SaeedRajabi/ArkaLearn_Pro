using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Commands
{
    public interface IBasketCommandRepository:ICommandRepository<Basket , long>
    {
    }
}
