using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketByUserId;

public class GetBasketByUserIdQuery:IQuery<GetBasketByUserIdQri> , IWebRequest
{

    public long UserId { get; set; }
    public string Path => "/api/Service/Basket/GetByUserId";

}