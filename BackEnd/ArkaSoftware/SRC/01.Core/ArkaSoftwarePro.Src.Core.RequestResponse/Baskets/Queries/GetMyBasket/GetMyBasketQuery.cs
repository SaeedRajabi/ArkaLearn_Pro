using ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetMyBasket
{
    public class GetMyBasketQuery : IQuery<List<GetBasketCoursesQri>>, IWebRequest
    {
        public string Path => "api/Service/Basket/GetMyBasket";
    }
}
