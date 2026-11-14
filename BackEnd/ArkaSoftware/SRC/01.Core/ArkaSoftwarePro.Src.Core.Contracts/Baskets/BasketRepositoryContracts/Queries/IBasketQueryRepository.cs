using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketByUserId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Queries
{
    public interface IBasketQueryRepository:IQueryRepository
    {
        Task<IEnumerable<GetBasketCoursesQri>> GetBasketCoursesExecuteAsync(GetBasketCourseByIdQuery query);
    }
}
