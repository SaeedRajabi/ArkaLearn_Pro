using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrderById;

public class GetMyProjectOrderByIdQuery : IQuery<ProjectOrderQri>, IWebRequest
{
    public long UserId { get; set; }
    public long OrderId { get; set; }

    public string Path => "/api/Service/ProjectOrder/GetMyOrderById";
}
