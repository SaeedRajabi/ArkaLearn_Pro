using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.SubmitCommunityThread;

public class SubmitCommunityThreadCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string? Subject { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }

    public string Path => "/api/Service/CommunityDiscussion/Submit";
}
