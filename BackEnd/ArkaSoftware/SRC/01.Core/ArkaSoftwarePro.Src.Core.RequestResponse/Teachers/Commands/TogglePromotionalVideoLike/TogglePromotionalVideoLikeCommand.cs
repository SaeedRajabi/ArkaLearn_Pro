using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.TogglePromotionalVideoLike;

public class TogglePromotionalVideoLikeCommand : ICommand<PromotionalVideoLikeResult>, IWebRequest
{
    public long VideoId { get; set; }
    public string Path => "/api/Service/Teacher/TogglePromotionalVideoLike";
}

public class PromotionalVideoLikeResult
{
    public string Action { get; set; } = string.Empty;
    public int LikeCount { get; set; }
    public bool IsLiked { get; set; }
}
