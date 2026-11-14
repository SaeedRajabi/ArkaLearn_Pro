using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById;

public class GetProjectOrderByIdQuery : IQuery<ProjectOrderQri>, IWebRequest
{
    public long OrderId { get; set; }

    public string Path => "/api/Service/ProjectOrder/GetById";
}

public class ProjectOrderQri
{
    public long Id { get; set; }
    public int RequestNumber { get; set; }
    public long? UserId { get; set; }
    public string? RequesterName { get; set; }
    public string? RequesterEmail { get; set; }
    public string? RequesterPhone { get; set; }
    public string? RequesterAvatarUrl { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ProjectType { get; set; } = string.Empty;
    public string DescriptionHtml { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public long? ReviewedByUserId { get; set; }
    public string? ReviewedByName { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? ReviewedAt { get; set; }
}
