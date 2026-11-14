using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.MarkSupportMessagesDelivered;

public class MarkSupportMessagesDeliveredCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public List<long> MessageIds { get; set; } = [];
    public string Path => "/api/Service/SupportChat/MarkDelivered";
}
