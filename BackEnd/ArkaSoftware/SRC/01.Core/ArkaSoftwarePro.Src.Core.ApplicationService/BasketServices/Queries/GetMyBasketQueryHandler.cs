using ArkaSoftwarePro.Src.Core.Contracts.Baskets.BasketRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetMyBasket;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.BasketServices.Queries
{
    public class GetMyBasketQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IBasketQueryRepository basketQueryRepository,
        IHttpContextAccessor httpContextAccessor
    ) : QueryHandler<GetMyBasketQuery, List<GetBasketCoursesQri>>(mafiaOuterService)
    {
        public override async Task<QueryResult<List<GetBasketCoursesQri>>> Handle(GetMyBasketQuery query)
        {
            try
            {
                var basketIdStr = httpContextAccessor.HttpContext?.Request.Cookies["basketId"];
                if (string.IsNullOrEmpty(basketIdStr) || !long.TryParse(basketIdStr, out var basketId))
                    return await ResultAsync(new List<GetBasketCoursesQri>(), ApplicationServiceStatus.Ok);

                var getQuery = new GetBasketCourseByIdQuery { BasketId = basketId };
                var items = await basketQueryRepository.GetBasketCoursesExecuteAsync(getQuery);
                return await ResultAsync(items?.ToList() ?? new List<GetBasketCoursesQri>(), ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync(new List<GetBasketCoursesQri>(), ApplicationServiceStatus.Ok);
            }
        }
    }
}
