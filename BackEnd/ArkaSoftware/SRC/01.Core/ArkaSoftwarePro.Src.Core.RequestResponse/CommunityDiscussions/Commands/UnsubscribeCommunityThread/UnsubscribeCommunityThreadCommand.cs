using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.UnsubscribeCommunityThread;

public class UnsubscribeCommunityThreadCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ThreadId { get; set; }

    public string Path => "/api/Service/CommunityDiscussion/Unsubscribe";
}
