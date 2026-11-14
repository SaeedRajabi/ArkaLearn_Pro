using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Commands.ReviewProjectOrder;

public class ReviewProjectOrderCommand : ICommand<string>, IWebRequest
{
    public long OrderId { get; set; }
    public long ReviewerUserId { get; set; }
    public bool Approve { get; set; }
    public string? AdminNote { get; set; }

    public string Path => "/api/Service/ProjectOrder/Review";
}
