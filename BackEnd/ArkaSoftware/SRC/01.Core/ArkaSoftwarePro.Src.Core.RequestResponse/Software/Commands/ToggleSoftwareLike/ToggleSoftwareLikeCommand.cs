using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.ToggleSoftwareLike;

public class ToggleSoftwareLikeCommand : ICommand<SoftwareLikeResult>, IWebRequest
{
    public long SoftwareId { get; set; }
    public string Path => "/api/Service/Software/ToggleLike";
}

public class SoftwareLikeResult
{
    public string Action { get; set; } = string.Empty;
    public int LikeCount { get; set; }
    public bool IsLiked { get; set; }
}
