using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.ReopenSupportConversation;

public class ReopenSupportConversationCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public string Path => "/api/Service/SupportChat/Reopen";
}
