using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.ReactCommunityThread;

public class ReactCommunityThreadCommand : ICommand<CommunityThreadReactionResult>, IWebRequest
{
    public long UserId { get; set; }
    public long ThreadId { get; set; }
    public int Reaction { get; set; }

    public string Path => "/api/Service/CommunityDiscussion/React";
}

public class CommunityThreadReactionResult
{
    public int Likes { get; set; }
    public int Dislikes { get; set; }
    public int MyReaction { get; set; }
}
