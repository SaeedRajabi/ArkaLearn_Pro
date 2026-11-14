using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.CloseSupportConversation;

public class CloseSupportConversationCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public string Path => "/api/Service/SupportChat/Close";
}
