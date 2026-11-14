using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Commands.LikeCommunityReply;

public class LikeCommunityReplyCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ReplyId { get; set; }

    public string Path => "/api/Service/CommunityDiscussion/LikeReply";
}
