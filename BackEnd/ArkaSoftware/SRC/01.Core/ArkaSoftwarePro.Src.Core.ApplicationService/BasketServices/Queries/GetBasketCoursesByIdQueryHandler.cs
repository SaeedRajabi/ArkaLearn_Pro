using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Queries;
using Framework.Src.Core.ApplicationService.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.BasketServices.Queries
{
    public class GetBasketCoursesByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IBasketQueryRepository basketQueryRepository
        )
        : QueryHandler<GetBasketCourseByIdQuery, List<GetBasketCoursesQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<List<GetBasketCoursesQri>>> Handle(GetBasketCourseByIdQuery query)
        {
            try
            {
                var basketCoursesGetByIdAsync = await basketQueryRepository.GetBasketCoursesExecuteAsync(query);
                if (basketCoursesGetByIdAsync! == null!)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
                return await ResultAsync(basketCoursesGetByIdAsync.ToList(), ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
