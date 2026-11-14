using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById
{
    public class GetBasketCourseByIdQuery:IQuery<List<GetBasketCoursesQri>>, IWebRequest
    {
        public long? BasketId { get; set; } = 0;

        public string Path => "/api/Service/Basket/GetCourses";
    }
}
