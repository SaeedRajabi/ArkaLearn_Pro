using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrders;

public class GetMyProjectOrdersQuery : IQuery<List<MyProjectOrderQri>>, IWebRequest
{
    public long UserId { get; set; }

    public string Path => "/api/Service/ProjectOrder/GetMyOrders";
}

public class MyProjectOrderQri
{
    public long Id { get; set; }
    public int RequestNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? ReviewedAt { get; set; }
}
